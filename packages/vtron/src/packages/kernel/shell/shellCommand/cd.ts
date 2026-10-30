import * as fspath from '@/packages/util/Path';
import type { Shell } from '../Shell';
import { parseShellArguments } from '../shellArguments';
async function cd(input: string, output: (text: string) => void, shell: Shell) {
  try {
    const args = parseShellArguments(input).slice(1);
    if (args.length > 1) throw new Error('too many arguments');
    const path = args[0] ?? shell.system._options.userLocation ?? '/C/Users/';
    if (!path) throw new Error('empty directory path');
    const target = fspath.resolve(shell.router, path);
    const info = await shell.system.fs.stat(target);
    if (!info?.isDirectory) throw new Error(`${path}: Not a directory`);
    shell.setRouter(target);
    shell.exitCode = 0;
  } catch (error) {
    shell.exitCode = 1;
    output(`\x1b[31mcd: ${error instanceof Error ? error.message : String(error)}\x1b[0m\r\n`);
  }
}
export { cd };
