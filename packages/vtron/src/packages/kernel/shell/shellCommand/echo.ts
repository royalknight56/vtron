import type { Shell } from '../Shell';
import { scriptArguments } from '../scriptRuntime';
async function echo(input: string, output: (text: string) => void, shell: Shell) {
  output(scriptArguments(input).slice(1).join(' ') + '\r\n');
}
export { echo };
