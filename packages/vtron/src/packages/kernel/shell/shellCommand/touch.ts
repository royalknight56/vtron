import * as vPath from '../../file/Path';
import type { Shell } from '../Shell';
async function touch(input: string, output: (text: string) => void, shell: Shell) {
  const fileName = input.split(' ')[1].trim();
  const res = await shell.system.fs.stat(vPath.join(shell.router, fileName));
  if (res) {
    output(`\x1b[31m${fileName}: File exists\x1b[0m\r\n`);
  } else {
    await shell.system.fs.writeFile(vPath.join(shell.router, fileName), '');
  }
}
export { touch };
