import type { Shell } from './Shell';

export interface ShellCommand {
  name: string;
  description: string;
  usage: string;
  callback(input: string, output: (text: string) => void, shell: Shell): void | Promise<void>;
}
