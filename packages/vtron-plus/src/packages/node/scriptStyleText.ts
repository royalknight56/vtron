type Stream = { isTTY?: boolean; write?: unknown; read?: unknown; pipe?: unknown; on?: unknown; getColorDepth?: () => number };
export type StyleTextHooks = { stdout?: () => unknown; env?: () => Record<string, string> };
const fail = (code: string, message: string): never => { throw Object.assign(new TypeError(message), { code }); };

/** ANSI terminal styling against this execution's actual stream and env. */
export function createScriptStyleText(hooks: StyleTextHooks = {}) {
  const colors: Record<string, [number, number]> = {
    reset: [0, 0], bold: [1, 22], dim: [2, 22], italic: [3, 23], underline: [4, 24], blink: [5, 25], inverse: [7, 27], hidden: [8, 28], strikethrough: [9, 29], doubleunderline: [21, 24], framed: [51, 54], overlined: [53, 55],
  };
  for (const [index, name] of ['black', 'red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white'].entries()) {
    colors[name] = [30 + index, 39]; colors['bg' + name[0].toUpperCase() + name.slice(1)] = [40 + index, 49];
    colors[index ? name + 'Bright' : 'gray'] = [90 + index, 39]; colors[index ? 'bg' + name[0].toUpperCase() + name.slice(1) + 'Bright' : 'bgGray'] = [100 + index, 49];
  }
  for (const [name, target] of Object.entries({ grey: 'gray', blackBright: 'gray', bgGrey: 'bgGray', bgBlackBright: 'bgGray', faint: 'dim', crossedout: 'strikethrough', strikeThrough: 'strikethrough', crossedOut: 'strikethrough', conceal: 'hidden', swapColors: 'inverse', swapcolors: 'inverse', doubleUnderline: 'doubleunderline' })) colors[name] = colors[target];
  function styleText(format: string | string[], text: string, options: { validateStream?: boolean; stream?: unknown } = {}) {
    if (typeof text !== 'string') fail('ERR_INVALID_ARG_TYPE', 'styleText text must be a string');
    if (!options || typeof options !== 'object' || Array.isArray(options)) fail('ERR_INVALID_ARG_TYPE', 'styleText options must be an object');
    for (const key of Object.keys(options)) if (!['validateStream', 'stream'].includes(key)) fail('ERR_NOT_SUPPORTED', `Unsupported styleText option: ${key}`);
    if (options.validateStream !== undefined && typeof options.validateStream !== 'boolean') fail('ERR_INVALID_ARG_TYPE', 'validateStream must be boolean');
    const styles = Array.isArray(format) ? format : [format];
    const codes = styles.map(name => { if (typeof name !== 'string' || !Object.prototype.hasOwnProperty.call(colors, name)) fail('ERR_INVALID_ARG_VALUE', `Unknown terminal style: ${String(name)}`); return colors[name]; });
    if (options.validateStream !== false) {
      const stream = (options.stream === undefined ? hooks.stdout?.() : options.stream) as Stream | undefined;
      if (stream !== undefined && (!stream || typeof stream !== 'object' || !(typeof stream.on === 'function' && (typeof stream.write === 'function' || typeof stream.read === 'function' || typeof stream.pipe === 'function')) && !(typeof ReadableStream !== 'undefined' && stream instanceof ReadableStream) && !(typeof WritableStream !== 'undefined' && stream instanceof WritableStream))) fail('ERR_INVALID_ARG_TYPE', 'styleText stream must be a readable or writable stream');
      const env = hooks.env?.() ?? {};
      const force = env.FORCE_COLOR;
      const enabled = force !== undefined ? force !== '0' && force !== 'false' : env.NO_COLOR === undefined && env.NODE_DISABLE_COLORS === undefined && env.TERM !== 'dumb' && stream?.isTTY === true && (stream.getColorDepth?.() ?? 4) > 1;
      if (!enabled) return text;
    }
    return codes.map(pair => `\x1b[${pair[0]}m`).join('') + text + codes.slice().reverse().map(pair => `\x1b[${pair[1]}m`).join('');
  }
  return { colors, styleText };
}
