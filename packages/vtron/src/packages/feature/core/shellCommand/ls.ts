import type { Shell } from '../Shell';
import { basename } from '@feature/core/Path';
async function ls(input: string, output: (text: string) => void, shell: Shell) {
  const path = input.split(' ')[1];
  if (path) {
    const res = await shell.system.fs.stat(path);
    if (res) {
      if (res.isDirectory) {
        const children = await shell.system.fs.readdir(path);
        children?.forEach((item) => {
          if (item.isDirectory) {
            output(`\x1b[34m${basename(item.path)}\x1b[0m\r\n`);
          } else {
            output(`\x1b[32m${basename(item.path)}\x1b[0m\r\n`);
          }
        });
      } else {
        output(`\x1b[31m${path}: Not a directory\x1b[0m\r\n`);
      }
    } else {
      output(`\x1b[31m${path}: No such file or directory\x1b[0m\r\n`);
    }
  } else {
    const res = await shell.system.fs.readdir(shell.router);
    res?.forEach((item) => {
      if (item.isDirectory) {
        output(`\x1b[34m${basename(item.path)}\x1b[0m\r\n`);
      } else {
        output(`\x1b[32m${basename(item.path)}\x1b[0m\r\n`);
      }
    });
  }
}
export { ls };
