import { parseShellArguments } from 'vtron';

export type ScriptCommand = { source: string; condition: ';' | '&&' | '||' };

export function quoteScriptArgument(value: string) {
  return "'" + value.replace(/'/g, "'\"'\"'") + "'";
}

/** Split only shell control operators; leave argument quoting for the shared parser. */
export function parseScriptCommands(source: string): ScriptCommand[] {
  if (source.length > 64 * 1024 || source.includes('\0')) throw new Error('npm script 过长或包含无效字符');
  const commands: ScriptCommand[] = [];
  let command = '';
  let quote = '';
  let condition: ScriptCommand['condition'] = ';';
  let awaitingCommand = false;
  const flush = (next: ScriptCommand['condition'], required: boolean) => {
    const text = command.trim();
    if (text) commands.push({ source: text, condition });
    else if (required) throw new Error('npm script 的命令连接符前缺少命令');
    command = ''; condition = next; awaitingCommand = next !== ';';
  };
  for (let index = 0; index < source.length; index++) {
    const char = source[index];
    const next = source[index + 1];
    if (char === '\\' && quote !== "'" && next) {
      if (next === '\n') { index++; continue; }
      if (next === '\r' && source[index + 2] === '\n') { index += 2; continue; }
      command += char + next; index++; continue;
    }
    if (quote === "'") { command += char; if (char === quote) quote = ''; continue; }
    if (char === '`' || char === '$' && /[({A-Za-z_]/.test(next || '')) throw new Error('npm script 暂不支持 shell 变量展开或命令替换，请在 JavaScript 中使用 process.env');
    if (quote) { command += char; if (char === quote) quote = ''; continue; }
    if (char === '"' || char === "'") { quote = char; command += char; continue; }
    if (char === '&' && next === '&' || char === '|' && next === '|') {
      flush((char + next) as '&&' | '||', true); index++; continue;
    }
    if (char === ';' || char === '\n' || char === '\r') {
      if (awaitingCommand && !command.trim()) {
        if (char === ';') throw new Error('npm script 的命令连接符后缺少命令');
        continue;
      }
      flush(';', char === ';');
      continue;
    }
    if ('|&<>()'.includes(char)) throw new Error(`npm script 暂不支持 shell 运算符 ${char}（管道、重定向、后台和子 shell）`);
    command += char;
  }
  if (quote) throw new Error('npm script 中存在未闭合的引号');
  if (command.trim()) commands.push({ source: command.trim(), condition });
  else if (awaitingCommand) throw new Error('npm script 的命令连接符后缺少命令');
  return commands;
}

/** Preserve raw command text while removing leading KEY=value assignments. */
export function scriptInvocation(source: string) {
  const spans: { start: number; end: number }[] = [];
  let quote = '';
  let start = -1;
  for (let index = 0; index <= source.length; index++) {
    const char = source[index];
    if (index === source.length || !quote && /\s/.test(char)) {
      if (start >= 0) spans.push({ start, end: index });
      start = -1;
      continue;
    }
    if (start < 0) start = index;
    if (char === '\\' && quote !== "'" && index + 1 < source.length) { index++; continue; }
    if (quote) { if (char === quote) quote = ''; }
    else if (char === '"' || char === "'") quote = char;
  }
  const args = parseShellArguments(source);
  const env: Record<string, string> = {};
  let index = 0;
  while (index < args.length && /^[A-Za-z_][A-Za-z0-9_]*=/.test(args[index])) {
    const equal = args[index].indexOf('=');
    env[args[index].slice(0, equal)] = args[index].slice(equal + 1); index++;
  }
  if (index === args.length) throw new Error('npm script 的环境变量赋值后需要指定命令');
  const name = args[index];
  return { name, env, tail: source.slice(spans[index].end), args: args.slice(index + 1) };
}
