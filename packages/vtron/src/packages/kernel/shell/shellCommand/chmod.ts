import * as vPath from '../../file/Path';
import type { Shell } from '../Shell';
async function chmod(input: string, output: (text: string) => void, shell: Shell) {
  const path = input.split(' ')[2];
  if (path) {
    try {
      await shell.system.fs.chmod(vPath.join(shell.router, path), parseInt(input.split(' ')[1], 8));
      output(`\x1b[32m${path}: Permission changed\x1b[0m\r\n`);
    } catch (e) {
      output(`\x1b[31m${path}: No such file or directory\x1b[0m\r\n`);
      return;
    }
  } else {
    output(`\x1b[31m${path}: No such file or directory\x1b[0m\r\n`);
  }
}
export { chmod };
