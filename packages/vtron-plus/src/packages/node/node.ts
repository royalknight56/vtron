import * as fspath from 'vtron';
import * as ivue from 'vue';
import type { Shell } from 'vtron';
import { executeScript } from './scriptRuntime';
import { parseShellArguments } from 'vtron';
import { ScriptFailure } from './scriptDiagnostics';
import { executeNodeWorker } from './nodeWorker';
async function node(input: string, output: (text: string) => void, shell: Shell) {
  const source = input.replace(/^\S+\s*/, '');
  if (!source) { shell.exitCode = 1; output('Usage: node <file.js> [args] | node -e "code"\r\n'); return; }
  try {
    const args = parseShellArguments(source);
    const execute = async (code: string, filename: string, scriptArgs: string[], execArgv: string[] = []) => {
      const workerResult = await executeNodeWorker(code, shell, output, filename, scriptArgs, execArgv);
      return workerResult === undefined ? executeScript(code, shell, output, filename, scriptArgs, ivue, { execArgv }) : workerResult;
    };
    if (args[0] === '-e' || args[0] === '--eval') {
      if (args[1] === undefined) throw new Error('node -e requires JavaScript code');
      shell.exitCode = await execute(args[1], '[eval]', args.slice(2), args.slice(0, 2));
      return;
    }
    if (args[0].startsWith('-')) throw Object.assign(new Error(`Unsupported Node command option: ${args[0]}`), { code: 'ERR_NOT_SUPPORTED' });
    const path = fspath.resolve(shell.router, args[0]);
    const info = await shell.system.fs.stat(path);
    if (info) {
      if (!info.isFile) throw new Error(`${path}: Not a file`);
      const file = await shell.system.fs.readFile(path);
      if (file === null) throw new Error(`${path}: No such file`);
      shell.exitCode = await execute(file, path, args.slice(1));
    } else if (/\.(?:[cm]?js|ts)$/i.test(args[0])) {
      throw new Error(`${path}: No such file`);
    } else {
      // Preserve the legacy inline-script form as well as main(system, vue) plugins.
      shell.exitCode = await execute(source, '[eval]', []);
    }
  } catch (error) {
    shell.exitCode = shell.executionSignal?.aborted ? 130 : 1;
    if (shell.executionSignal?.aborted) return;
    const message = error instanceof ScriptFailure ? error.diagnostic : error && typeof error === 'object' && 'diagnostic' in error && typeof error.diagnostic === 'string' ? error.diagnostic : error instanceof Error ? error.stack || `${error.name}: ${error.message}` : String(error);
    output(`\x1b[31m${message.replace(/\r?\n/g, '\r\n')}\x1b[0m\r\n`);
  }
}
export { node };
