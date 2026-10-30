import { join, parseShellArguments, type System } from 'vtron';
import { installPackages } from './installer';
import { createNpmModuleLoader } from './moduleLoader';
import { runNpmScript } from './run';

export interface NpmOptions { registry?: string }
const installations = new WeakMap<System, () => void>();
const usage = 'Vtron npm · 纯 JS / CommonJS\r\n' +
  'npm install [包名[@版本|tag|范围] ...]\r\n' +
  'npm i 与 npm install 相同；无参数时安装 package.json 的 dependencies。\r\n' +
  '选项：--registry <地址>、--no-save、-S / --save\r\n' +
  'npm run：列出 scripts；npm run <名称> [-- 参数...]：执行项目脚本。\r\n' +
  '安装时不执行生命周期脚本；不支持原生扩展、ESM-only 或全局安装。\r\n';

export function installNpmSupport(system: System, options: NpmOptions = {}): () => void {
  const existing = installations.get(system);
  if (existing) return existing;
  const unregisterLoader = system.registerScriptModuleLoader(createNpmModuleLoader(system));
  let unregisterCommand: () => void;
  try {
    unregisterCommand = system.registerShellCommand({
      name: 'npm', description: 'install pure JavaScript packages and run project scripts', usage: 'npm install [package[@version] ...] | npm run [script] [-- args]',
      async callback(input, output, shell) {
        try {
          const args = parseShellArguments(input).slice(1);
          if (!args.length || ['--help', '-h'].includes(args[0])) { output(usage); return; }
          const command = args.shift()!;
          if (command === 'run' || command === 'run-script') {
            if (['--help', '-h'].includes(args[0])) { output(usage); return; }
            shell.exitCode = await runNpmScript(system, shell, output, args);
            return;
          }
          if (!['install', 'i'].includes(command)) throw new Error('暂不支持此 npm 命令，使用 npm --help 查看用法');
          if (args.includes('--help') || args.includes('-h')) { output(usage); return; }
          let registry = options.registry;
          let save = true;
          const specs: string[] = [];
          for (let index = 0; index < args.length; index++) {
            const arg = args[index];
            if (arg === '--registry') { registry = args[++index]; if (!registry) throw new Error('--registry 缺少地址'); }
            else if (arg.startsWith('--registry=')) { registry = arg.slice('--registry='.length); if (!registry) throw new Error('--registry 缺少地址'); }
            else if (arg === '--no-save') save = false;
            else if (arg === '--save' || arg === '-S') save = true;
            else if (arg.startsWith('-')) throw new Error(`暂不支持选项：${arg}`);
            else specs.push(arg);
          }
          if (!specs.length) {
            const source = await system.fs.readFile(join(shell.router, 'package.json'));
            if (source === null) throw new Error('当前目录没有 package.json；请指定要安装的包，例如 npm install dayjs');
            const manifest = JSON.parse(source);
            const dependencies = manifest?.dependencies;
            if (dependencies !== undefined && (!dependencies || typeof dependencies !== 'object' || Array.isArray(dependencies))) throw new Error('package.json 的 dependencies 必须是对象');
            for (const [name, version] of Object.entries(dependencies || {})) {
              if (typeof version !== 'string' || !version.trim()) throw new Error(`无效的依赖版本：${name}`);
              specs.push(`${name}@${version}`);
            }
            if (!specs.length) { output('package.json 中没有需要安装的 dependencies。\r\n'); return; }
            // Preserve the user's declared ranges when restoring an existing project.
            save = false;
          }
          await installPackages(system, shell.router, specs, { registry, save, signal: shell.executionSignal, output });
          system.emitEvent('file.props.edit');
        } catch (error) {
          shell.exitCode = shell.executionSignal?.aborted ? 130 : 1;
          if (shell.executionSignal?.aborted) output('npm：安装已取消。\r\n');
          else output(`\x1b[31mnpm：${error instanceof Error ? error.message : String(error)}\x1b[0m\r\n`);
        }
      },
    });
  } catch (error) { unregisterLoader(); throw error; }
  const dispose = () => { if (installations.get(system) !== dispose) return; unregisterCommand(); unregisterLoader(); installations.delete(system); };
  installations.set(system, dispose);
  return dispose;
}
