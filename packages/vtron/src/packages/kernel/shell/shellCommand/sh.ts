import * as vPath from '@/packages/kernel/file/Path';
import { Shell } from '../Shell';
async function sh(input: string, output: (text: string) => void, shell: Shell) {
  const path = input.split(' ')[1];
  if (path) {
    const res = await shell.system.fs.stat(vPath.join(shell.router, path));
    if (res) {
      if (!res.isDirectory) {
        const file = await shell.system.fs.readFile(vPath.join(shell.router, path));
        if (file) {
          const subShell = new Shell(shell.system, shell.router, shell.user);
          // subShell.run(file, output)
          subShell.on('message', (text) => {
            output(text);
          });
          const lines = file.split('\n');
          for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            await subShell.exec(line);
          }
        }
      } else {
        output(`\x1b[31m${path}: Not a file\x1b[0m\r\n`);
      }
    } else {
      output(`\x1b[31m${path}: No such file or directory\x1b[0m\r\n`);
    }
  } else {
    output(`\x1b[31m${path}: No such file or directory\x1b[0m\r\n`);
  }
}
export { sh };
