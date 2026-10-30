import { createScriptUtilFormat } from './scriptUtilFormat';

type ArgValue = string | boolean;
type ArgOption = { type: 'string' | 'boolean'; short?: string; multiple?: boolean; default?: ArgValue | ArgValue[] };
type ParseArgsConfig = {
  args?: string[];
  options?: Record<string, ArgOption>;
  strict?: boolean;
  allowPositionals?: boolean;
  allowNegative?: boolean;
  tokens?: boolean;
};
type OptionToken = { kind: 'option'; name: string; rawName: string; index: number; value: string | undefined; inlineValue: boolean | undefined };
type ParseToken = OptionToken | { kind: 'positional'; index: number; value: string } | { kind: 'option-terminator'; index: number };

function argumentError(code: string, message: string): never {
  throw Object.assign(new TypeError(message), { code });
}

function objectArgument(value: unknown, name: string) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) argumentError('ERR_INVALID_ARG_TYPE', `${name} must be an object`);
}

function booleanArgument(value: unknown, name: string) {
  if (value !== undefined && typeof value !== 'boolean') argumentError('ERR_INVALID_ARG_TYPE', `${name} must be a boolean`);
}

function parseEnv(content: string) {
  if (typeof content !== 'string') argumentError('ERR_INVALID_ARG_TYPE', 'content must be a string');
  const source = content.replace(/\r/g, '');
  const result: Record<string, string> = {};
  const trim = (text: string) => text.replace(/^[ \t]+|[ \t]+$/g, '');
  let cursor = 0;
  while (cursor < source.length) {
    let end = source.indexOf('\n', cursor);
    if (end === -1) end = source.length;
    const line = source.slice(cursor, end);
    const equals = line.indexOf('=');
    if (equals < 0 || trim(line).startsWith('#')) { cursor = end + 1; continue; }
    const name = trim(line.slice(0, equals)).replace(/^export +/, '');
    let valueStart = cursor + equals + 1;
    while (source[valueStart] === ' ' || source[valueStart] === '\t') valueStart++;
    const quote = source[valueStart];
    let value: string;
    const closing = ['"', "'", '`'].includes(quote) ? source.indexOf(quote, valueStart + 1) : -1;
    if (closing !== -1) {
      value = source.slice(valueStart + 1, closing);
      if (quote === '"') value = value.replace(/\\n/g, '\n');
      end = source.indexOf('\n', closing + 1);
      if (end === -1) end = source.length;
    } else {
      value = trim(source.slice(valueStart, end).split('#', 1)[0]);
    }
    if (name) result[name] = value;
    cursor = end + 1;
  }
  return result;
}

export function createScriptUtil(defaultArgs: () => string[]) {
  const customPromisify = Symbol.for('nodejs.util.promisify.custom');
  function promisify(original: (...args: any[]) => any): (...args: any[]) => any {
    if (typeof original !== 'function') argumentError('ERR_INVALID_ARG_TYPE', 'original must be a function');
    const custom = Reflect.get(original, customPromisify);
    if (custom) {
      if (typeof custom !== 'function') argumentError('ERR_INVALID_ARG_TYPE', 'util.promisify.custom must be a function');
      Object.defineProperty(custom, customPromisify, { value: custom, writable: false, enumerable: false, configurable: true });
      return custom as (...args: any[]) => any;
    }
    const wrapped = function (this: unknown, ...args: unknown[]) {
      return new Promise((resolve, reject) => {
        Reflect.apply(original, this, [...args, (error: unknown, value: unknown) => {
          if (error) reject(error);
          else resolve(value);
        }]);
      });
    };
    Object.setPrototypeOf(wrapped, Object.getPrototypeOf(original));
    Object.defineProperty(wrapped, customPromisify, { value: wrapped, writable: false, enumerable: false, configurable: true });
    Object.defineProperties(wrapped, Object.getOwnPropertyDescriptors(original));
    return wrapped;
  }
  Object.assign(promisify, { custom: customPromisify });
  function parseArgs(config: ParseArgsConfig = {}) {
    objectArgument(config, 'config');
    for (const key of ['strict', 'allowPositionals', 'allowNegative', 'tokens'] as const) booleanArgument(config[key], key);
    const args = config.args ?? defaultArgs();
    if (!Array.isArray(args) || args.some(value => typeof value !== 'string')) argumentError('ERR_INVALID_ARG_TYPE', 'args must be an array of strings');
    const definitions = config.options ?? {};
    objectArgument(definitions, 'options');
    const aliases = new Map<string, string>();
    for (const [name, option] of Object.entries(definitions)) {
      objectArgument(option, `options.${name}`);
      if (option.type !== 'string' && option.type !== 'boolean') argumentError('ERR_INVALID_ARG_TYPE', `options.${name}.type must be string or boolean`);
      booleanArgument(option.multiple, `options.${name}.multiple`);
      if (option.short !== undefined) {
        if (typeof option.short !== 'string') argumentError('ERR_INVALID_ARG_TYPE', `options.${name}.short must be a string`);
        if (option.short.length !== 1) argumentError('ERR_INVALID_ARG_VALUE', `options.${name}.short must be a single character`);
        if (!aliases.has(option.short)) aliases.set(option.short, name);
      }
      if (option.default !== undefined) {
        const values = option.multiple ? option.default : [option.default];
        if (!Array.isArray(values) || values.some(value => typeof value !== option.type)) argumentError('ERR_INVALID_ARG_TYPE', `options.${name}.default must match its type and multiple setting`);
      }
    }
    const strict = config.strict ?? true;
    const allowPositionals = config.allowPositionals ?? !strict;
    const values: Record<string, ArgValue | ArgValue[]> = Object.create(null);
    const positionals: string[] = [];
    const tokens: ParseToken[] = [];
    let terminated = false;
    const optionToken = (name: string, rawName: string, index: number, value?: string, inlineValue?: boolean) => {
      const negative = !!config.allowNegative && rawName.startsWith('--no-');
      const definition = Object.prototype.hasOwnProperty.call(definitions, name) ? definitions[name] : undefined;
      const positive = negative ? rawName.slice(5) : '';
      const positiveDefinition = negative && Object.prototype.hasOwnProperty.call(definitions, positive) ? definitions[positive] : undefined;
      const type = definition?.type ?? (positiveDefinition?.type === 'boolean' ? 'boolean' : undefined);
      if (strict) {
        if (!type) argumentError('ERR_PARSE_ARGS_UNKNOWN_OPTION', `Unknown option '${rawName}'`);
        if (type === 'boolean' && value !== undefined) argumentError('ERR_PARSE_ARGS_INVALID_OPTION_VALUE', `Option '${rawName}' does not take an argument`);
        if (type === 'string' && value === undefined) argumentError('ERR_PARSE_ARGS_INVALID_OPTION_VALUE', `Option '${rawName}' argument missing`);
        if (type === 'string' && !inlineValue && value!.length > 1 && value!.startsWith('-')) argumentError('ERR_PARSE_ARGS_INVALID_OPTION_VALUE', `Option '${rawName}' argument is ambiguous; use '${rawName}=value'`);
      }
      let parsed: ArgValue = value ?? true;
      if (negative && value === undefined) { name = positive; parsed = false; }
      tokens.push({ kind: 'option', name, rawName, index, value, inlineValue });
      if (name === '__proto__') return;
      if (Object.prototype.hasOwnProperty.call(definitions, name) && definitions[name].multiple) {
        values[name] ??= [];
        (values[name] as ArgValue[]).push(parsed);
      } else values[name] = parsed;
    };
    for (let index = 0; index < args.length; index++) {
      const arg = args[index];
      if (!terminated && arg === '--') { tokens.push({ kind: 'option-terminator', index }); terminated = true; continue; }
      if (!terminated && arg.startsWith('--') && arg.length > 2) {
        const equals = arg.indexOf('=');
        const name = arg.slice(2, equals === -1 ? undefined : equals);
        const rawName = '--' + name;
        const definition = Object.prototype.hasOwnProperty.call(definitions, name) ? definitions[name] : undefined;
        const originalIndex = index;
        let value: string | undefined;
        let inlineValue: boolean | undefined;
        if (equals !== -1) { value = arg.slice(equals + 1); inlineValue = true; }
        else if (definition?.type === 'string' && index + 1 < args.length) { value = args[++index]; inlineValue = false; }
        optionToken(name, rawName, originalIndex, value, inlineValue);
      } else if (!terminated && arg.startsWith('-') && arg.length > 1) {
        const originalIndex = index;
        for (let offset = 1; offset < arg.length; offset++) {
          const short = arg[offset];
          const name = aliases.get(short) ?? short;
          const definition = Object.prototype.hasOwnProperty.call(definitions, name) ? definitions[name] : undefined;
          let value: string | undefined;
          let inlineValue: boolean | undefined;
          if (definition?.type === 'string') {
            if (offset + 1 < arg.length) { value = arg.slice(offset + 1); inlineValue = true; }
            else if (index + 1 < args.length) { value = args[++index]; inlineValue = false; }
            offset = arg.length;
          }
          optionToken(name, '-' + short, originalIndex, value, inlineValue);
        }
      } else {
        if (!allowPositionals) argumentError('ERR_PARSE_ARGS_UNEXPECTED_POSITIONAL', `Unexpected argument '${arg}'. This command does not take positional arguments`);
        positionals.push(arg);
        tokens.push({ kind: 'positional', index, value: arg });
      }
    }
    for (const [name, option] of Object.entries(definitions)) {
      if (!Object.prototype.hasOwnProperty.call(values, name) && option.default !== undefined) values[name] = Array.isArray(option.default) ? [...option.default] : option.default;
    }
    return config.tokens ? { values, positionals, tokens } : { values, positionals };
  }
  return { parseArgs, parseEnv, promisify: promisify as typeof promisify & { custom: symbol }, ...createScriptUtilFormat() };
}
