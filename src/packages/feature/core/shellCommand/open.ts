import type { Shell } from '../Shell';
import * as vPath from '../Path';

async function open(input: string, output: (text: string) => void, shell: Shell) {
  const path = input.split(' ')[1];
  if (path) {
    const res = await shell.system.fs.stat(vPath.join(shell.router, path));
    if (res) {
      shell.system.openFile(res.path);
    } else {
      output(`\x1b[31m${path}: No such file or directory\x1b[0m\r\n`);
    }
  }
}
export { open };
