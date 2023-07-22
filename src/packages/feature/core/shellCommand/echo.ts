import type { Shell } from '../Shell';
import * as vPath from '../Path';
async function echo(input: string, output: (text: string) => void, shell: Shell) {
  let content = input.split(' ')[1];
  if (content) {
    output(content + '\r\n');
  } else {
    output(`\x1b[31m echo: missing operand\x1b[0m\r\n`);
  }
}
export { echo };
