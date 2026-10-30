import type { Shell } from '../Shell';
import { parseShellArguments } from '../shellArguments';
async function echo(input: string, output: (text: string) => void, shell: Shell) {
  output(parseShellArguments(input).slice(1).join(' ') + '\r\n');
}
export { echo };
