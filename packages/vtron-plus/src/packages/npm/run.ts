import { Shell, basename, dirname, extname, join, resolve, type System } from 'vtron';
import { parseScriptCommands, quoteScriptArgument, scriptInvocation, type ScriptCommand } from './scriptCommand';

type Manifest = { name?: string; version?: string; type?: string; bin?: string | Record<string, string>; scripts?: Record<string, string> };
type RunContext = { stack: string[]; initCwd: string };
const contexts = new WeakMap<Shell, RunContext>();
const MAX_DEPTH = 16;
const MAX_MANIFEST_BYTES = 1024 * 1024;

function object(value: unknown): value is Record<string, unknown> { return !!value && typeof value === 'object' && !Array.isArray(value); }
function inside(parent: string, path: string) { return parent === '/' || path === parent || path.startsWith(parent + '/'); }
function ancestors(path: string) {
  const paths: string[] = [];
  for (let current = resolve(path); ; current = dirname(current)) { paths.push(current); if (current === '/') return paths; }
}
function parseManifest(source: string, path: string): Manifest {
  if (source.length > MAX_MANIFEST_BYTES) throw new Error(`package.json 超过 1 MB 限制：${path}`);
  let value: unknown;
  try { value = JSON.parse(source.replace(/^\uFEFF/, '')); }
  catch { throw new Error(`package.json 不是有效 JSON：${path}`); }
  if (!object(value)) throw new Error(`package.json 必须是对象：${path}`);
  return value as Manifest;
}
async function projectManifest(system: System, cwd: string, signal?: AbortSignal) {
  for (const root of ancestors(cwd)) {
    if (signal?.aborted) return undefined;
    const path = join(root, 'package.json');
    const info = await system.fs.stat(path);
    if (!info) continue;
    if (!info.isFile) throw new Error(`package.json 不是文件：${path}`);
    const source = await system.fs.readFile(path);
    if (source !== null) return { root, manifest: parseManifest(source, path) };
  }
  throw new Error('当前目录及其父目录没有 package.json');
}

async function packageBin(system: System, root: string, command: string, signal?: AbortSignal): Promise<string | undefined> {
  if (!/^[\w.-]+$/.test(command)) return undefined;
  let inspected = 0;
  for (const ancestor of ancestors(root)) {
    if (signal?.aborted) return undefined;
    const modules = join(ancestor, 'node_modules');
    if (!(await system.fs.stat(modules))?.isDirectory) continue;
    const packageDirectories: string[] = [];
    for (const entry of (await system.fs.readdir(modules)).sort((a, b) => a.name.localeCompare(b.name))) {
      if (!entry.isDirectory || entry.isSymlink || entry.name.startsWith('.')) continue;
      if (entry.name.startsWith('@')) {
        for (const scoped of (await system.fs.readdir(entry.path)).sort((a, b) => a.name.localeCompare(b.name))) {
          if (scoped.isDirectory && !scoped.isSymlink && !scoped.name.startsWith('.')) packageDirectories.push(scoped.path);
        }
      } else packageDirectories.push(entry.path);
    }
    const matches: { path: string; manifest: Manifest; target: string }[] = [];
    for (const path of packageDirectories) {
      if (signal?.aborted) return undefined;
      if (++inspected > 4096) throw new Error('npm script 查找 bin 超过 4096 个包，请缩小项目依赖规模');
      const source = await system.fs.readFile(join(path, 'package.json'));
      if (source === null) continue;
      const manifest = parseManifest(source, join(path, 'package.json'));
      const bin = manifest.bin;
      const target = typeof bin === 'string'
        ? command === basename(typeof manifest.name === 'string' ? manifest.name : path) ? bin : undefined
        : object(bin) && Object.prototype.hasOwnProperty.call(bin, command) ? bin[command] : undefined;
      if (target !== undefined) {
        if (typeof target !== 'string' || !target) throw new Error(`无效的 bin 入口：${path}`);
        matches.push({ path, manifest, target });
      }
    }
    if (matches.length > 1) throw new Error(`多个包声明了 bin 命令 “${command}”，请在 script 中明确使用 node 和入口文件路径`);
    if (!matches.length) continue;
    const { path, manifest, target } = matches[0];
    const filename = resolve(path, target);
    if (target.startsWith('/') || /[\\\0]/.test(target) || /^[A-Za-z]:/.test(target) || !inside(path, filename)) throw new Error(`bin 入口不能指向包目录之外：${path}`);
    const info = await system.fs.stat(filename);
    if (!info?.isFile || info.isSymlink) throw new Error(`bin 入口不存在或不是普通文件：${filename}`);
    const source = await system.fs.readFile(filename);
    if (source === null) throw new Error(`无法读取 bin 入口：${filename}`);
    const extension = extname(filename).toLowerCase();
    const firstLine = source.replace(/^\uFEFF/, '').split(/\r?\n/, 1)[0];
    const nodeShebang = /^#!\s*(?:\/\S*\/node|\/usr\/bin\/env\s+(?:-S\s+)?node)(?:\s|$)/.test(firstLine);
    if (firstLine.startsWith('#!') && !nodeShebang) throw new Error(`仅支持 Node JavaScript bin，不支持此解释器：${filename}`);
    if (!['.js', '.cjs', '.mjs'].includes(extension) && !(extension === '' && nodeShebang)) throw new Error(`仅支持 .js、.cjs、.mjs 或带 Node shebang 的纯 JavaScript bin：${filename}`);
    return filename;
  }
  return undefined;
}

async function executeCommands(system: System, parent: Shell, root: string, context: RunContext, event: string, source: string, commands: ScriptCommand[], manifest: Manifest, output: (text: string) => void): Promise<number> {
  const signal = parent.executionSignal;
  if (signal?.aborted) return 130;
  const child = new Shell(system, root, parent.user, parent);
  child.on('message', output);
  child.setTerminal(parent.terminal);
  child.env = {
    ...parent.env,
    npm_lifecycle_event: event,
    npm_lifecycle_script: source,
    npm_package_name: typeof manifest.name === 'string' ? manifest.name : basename(root),
    npm_package_version: typeof manifest.version === 'string' ? manifest.version : '',
    INIT_CWD: context.initCwd,
  };
  contexts.set(child, context);
  let exitCode = 0;
  try {
    for (const command of commands) {
      if (signal?.aborted) return 130;
      if (command.condition === '&&' && exitCode !== 0 || command.condition === '||' && exitCode === 0) continue;
      const invocation = scriptInvocation(command.source);
      const previousEnv = child.env;
      child.env = { ...previousEnv, ...invocation.env };
      try {
        let executable: string;
        if (child.hasCommand(invocation.name)) executable = invocation.name;
        else {
          const bin = await packageBin(system, root, invocation.name, signal);
          if (signal?.aborted) return 130;
          if (!bin) {
            output(`npm：找不到命令 “${invocation.name}”；仅支持 Vtron Shell 命令和已安装的纯 JS bin。\r\n`);
            exitCode = 127; continue;
          }
          executable = 'node ' + quoteScriptArgument(bin);
        }
        await child.exec(executable + invocation.tail, { signal });
        exitCode = child.exitCode;
      } catch (error) {
        if (signal?.aborted) return 130;
        output(`\x1b[31m${error instanceof Error ? error.message : String(error)}\x1b[0m\r\n`);
        exitCode = 1;
      } finally { child.env = previousEnv; }
    }
    return signal?.aborted ? 130 : exitCode;
  } finally { contexts.delete(child); }
}

export async function runNpmScript(system: System, shell: Shell, output: (text: string) => void, args: string[]): Promise<number> {
  const project = await projectManifest(system, shell.router, shell.executionSignal);
  if (!project) return 130;
  const { root, manifest } = project;
  if (manifest.scripts !== undefined && !object(manifest.scripts)) throw new Error('package.json 的 scripts 必须是对象');
  const scripts = manifest.scripts || {};
  for (const [name, value] of Object.entries(scripts)) if (typeof value !== 'string') throw new Error(`script “${name}” 必须是字符串`);
  if (!args.length) {
    const entries = Object.entries(scripts);
    if (!entries.length) output('package.json 中没有 scripts。\r\n');
    else {
      output(`Scripts available in ${manifest.name || basename(root)}${manifest.version ? '@' + manifest.version : ''}:\r\n`);
      for (const [name, value] of entries) output(`  ${name}\r\n    ${value.replace(/\r?\n/g, '\r\n    ')}\r\n`);
    }
    return 0;
  }
  const name = args[0];
  if (name.startsWith('-')) throw new Error(`npm run 暂不支持选项：${name}`);
  if (!Object.prototype.hasOwnProperty.call(scripts, name)) throw new Error(`没有名为 “${name}” 的 script；运行 npm run 查看可用脚本`);
  let inherited: RunContext | undefined;
  for (let ancestor: Shell | undefined = shell; ancestor && !inherited; ancestor = ancestor.parentShell) inherited = contexts.get(ancestor);
  inherited ||= { stack: [], initCwd: shell.router };
  const key = root + '\0' + name;
  if (inherited.stack.includes(key) || inherited.stack.length >= MAX_DEPTH) throw new Error(`npm run 存在循环调用或嵌套超过 ${MAX_DEPTH} 层：${name}`);
  const context = { stack: [...inherited.stack, key], initCwd: inherited.initCwd };
  const extraArgs = args.slice(args[1] === '--' ? 2 : 1);
  const events = ['pre' + name, name, 'post' + name].filter(event => Object.prototype.hasOwnProperty.call(scripts, event));
  // Validate all lifecycle command syntax before any hook has side effects.
  const prepared = events.map(event => {
    const source = scripts[event] + (event === name && extraArgs.length ? ' ' + extraArgs.map(quoteScriptArgument).join(' ') : '');
    return { event, source, commands: parseScriptCommands(source) };
  });
  for (const item of prepared) {
    if (shell.executionSignal?.aborted) return 130;
    output(`\r\n> ${manifest.name || basename(root)}${manifest.version ? '@' + manifest.version : ''} ${item.event}\r\n> ${item.source.replace(/\r?\n/g, '\r\n> ')}\r\n\r\n`);
    const code = await executeCommands(system, shell, root, context, item.event, scripts[item.event], item.commands, manifest, output);
    if (code !== 0) {
      if (!shell.executionSignal?.aborted) output(`npm：脚本 “${item.event}” 执行失败（退出码 ${code}）。\r\n`);
      return code;
    }
  }
  return 0;
}
