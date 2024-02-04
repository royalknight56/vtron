import type { Shell } from '../Shell';
import * as vPath from '../../file/Path';
async function rm(input: string, output: (text: string) => void, shell: Shell) {
  // rm -f test.txt
  // rm -rf testdi
  const path = input.split(' ')[1];
  if (path) {
    const res = await shell.system.fs.stat(vPath.join(shell.router, path));
    if (res) {
      if (res.isDirectory) {
        await shell.system.fs.unlink(vPath.join(shell.router, path));
      } else {
        await shell.system.fs.rmdir(vPath.join(shell.router, path));
      }
    } else {
      output(`\x1b[31m${path}: No such file or directory\x1b[0m\r\n`);
    }
  }
}
export { rm };
