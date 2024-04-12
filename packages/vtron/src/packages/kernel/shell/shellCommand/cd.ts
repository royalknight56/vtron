import * as vPath from '../../file/Path';
import type { Shell } from '../Shell';
async function cd(input: string, output: (text: string) => void, shell: Shell) {
  const path = input.split(' ')[1];
  if (path === '..') {
    const res = await shell.system.fs.stat(shell.router);
    if (res?.parentPath) {
      shell.setRouter(res.parentPath);
    }
  } else {
    const res = await shell.system.fs.stat(vPath.join(shell.router, path));
    if (res && res.isDirectory) {
      shell.setRouter(vPath.join(shell.router, path));
    } else {
      output(`\x1b[31m${path}: Not a directory\x1b[0m\r\n`);
    }
  }
}
export { cd };
