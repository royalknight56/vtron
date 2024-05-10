import * as vPath from '@/packages/kernel/file/Path';
import * as ivue from 'vue';
import type { Shell } from '../Shell';
async function node(input: string, output: (text: string) => void, shell: Shell) {
  const path = input.split(' ')[1];
  if (path) {
    const res = await shell.system.fs.stat(vPath.join(shell.router, path));
    if (res) {
      if (res.isFile) {
        const file = await shell.system.fs.readFile(vPath.join(shell.router, path));
        if (file) {
          new Function('system', 'vue', file + '\nmain(system,vue)')(shell.system, ivue);
        }
      } else {
        output(`\x1b[31m${path}: Not a file\x1b[0m\r\n`);
      }
    } else {
      // 没有文件，尝试直接运行
      const nodecontent = input.split(' ').slice(1).join(' ');
      new Function('system', 'vue', nodecontent + '\nmain(system,vue)')(shell.system, ivue);
      // output(`\x1b[31m${path}: No such file or directory\x1b[0m\r\n`)
    }
  } else {
    output(`\x1b[31m${path}: No such file or directory\x1b[0m\r\n`);
  }
}
export { node };
