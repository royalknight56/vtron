import * as fspath from '@/packages/util/Path';
import { Shell } from '../Shell';
import { scriptArguments } from '../scriptRuntime';
async function sh(input: string, output: (text: string) => void, shell: Shell) {
  try {
    const args = scriptArguments(input).slice(1);
    if (args.length !== 1) throw new Error('Usage: sh <file>');
    const path = fspath.resolve(shell.router, args[0]);
    if (!(await shell.system.fs.stat(path))?.isFile) throw new Error(`${args[0]}: Not a file`);
    const file = await shell.system.fs.readFile(path);
    if (file === null) throw new Error(`${args[0]}: No such file or directory`);
    const child = new Shell(shell.system, shell.router, shell.user, shell);
    child.on('message', output);
    child.env = { ...shell.env };
    child.setTerminal(shell.terminal);
    for (const line of file.split(/\r?\n/)) {
      if (shell.executionSignal?.aborted) { shell.exitCode = 130; return; }
      if (!line.trim() || line.trimStart().startsWith('#')) continue;
      await child.exec(line, { signal: shell.executionSignal });
      shell.exitCode = child.exitCode;
    }
  } catch (error) {
    shell.exitCode = shell.executionSignal?.aborted ? 130 : 1;
    if (!shell.executionSignal?.aborted) output(`\x1b[31msh: ${error instanceof Error ? error.message : String(error)}\x1b[0m\r\n`);
  }
}
export { sh };
