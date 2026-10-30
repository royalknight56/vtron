import { System } from '@/packages/kernel/system';
import * as fspath from '@/packages/util/Path';
import { ShellInterface, ShellTerminal } from './ShellType';
import { commandMap } from './shellCommand/commandMap';

function redirectPosition(input: string) {
  let quote = '';
  for (let index = 0; index < input.length; index++) {
    const char = input[index];
    if (char === '\\' && quote !== "'" && input[index + 1]) { index++; continue; }
    if (quote) { if (char === quote) quote = ''; continue; }
    if (char === '"' || char === "'") { quote = char; continue; }
    if (char === '>' && input[index - 1] === ' ' && input[index + 1] === ' ') return index;
  }
  return -1;
}

class Shell implements ShellInterface {
  system: System;
  router: string;
  user: string;
  exitCode = 0;
  env: Record<string, string> = {};

  prefix: string;
  terminal?: ShellTerminal;
  private executionController?: AbortController;

  get executionSignal() { return this.executionController?.signal; }
  setTerminal(terminal?: ShellTerminal) { this.terminal = terminal; }

  private output: (message: string) => void;
  // private innerCommand: string[] = ['ls', 'cd', 'pwd', 'clear', 'help'];
  private innerCommand: {
    name: string;
    description: string;
    usage: string;
    callback: (input: string, output: (text: string) => void, shell: Shell) => void;
  }[] = commandMap;

  constructor(system: System, router = '/C', user = 'root', readonly parentShell?: Shell) {
    this.system = system;
    this.router = router;
    this.user = user;

    this.prefix = `${user} ${router}>`;

    this.output = (message: string) => {
      console.log(message);
    };
  }
  setRouter(router: string) {
    this.router = router;
    this.prefix = `${this.user} ${router}>`;
  }
  hasCommand(name: string) { return !!this.system.getShellCommand(name) || this.innerCommand.some(command => command.name === name); }
  private async handleCommand(input: string) {
    input = input.trim();
    if (!input) return;
    const redirect = redirectPosition(input);
    const commandInput = redirect < 0 ? input : input.slice(0, redirect).trim();
    const name = commandInput.split(/\s/)[0];
    const command = this.system.getShellCommand(name) || this.innerCommand.find((item) => item.name === name);
    if (command) {
      if (redirect >= 0) {
        let outPath = input.slice(redirect + 1).trim();
        outPath = fspath.join(this.router, outPath);
        const res = await this.system.fs.stat(outPath);
        if (res) {
          if (res.isDirectory) {
            this.exitCode = 1;
            this.output(`\x1b[31m${outPath}: Not a file\x1b[0m\r\n`);
            return;
          } else {
            await command.callback(
              commandInput,
              (text: string) => {
                this.system.fs.appendFile(outPath, text);
              },
              this
            );
          }
        } else {
          await command.callback(commandInput, this.output, this);
          return;
        }
      } else {
        await command.callback(commandInput, this.output, this);
      }
    } else {
      this.exitCode = 127;
      this.output(`\x1b[31m${input}: command not found\x1b[0m\r\n`);
    }
  }
  emit(event: 'start' | 'key' | 'interrupt') {
    if (event === 'interrupt') {
      this.executionController?.abort();
      this.parentShell?.emit('interrupt');
    }
    if (event === 'start') {
      this.output('\x1b[2m' + 'Welcome to Vtron Terminal' + '\x1b[0m\r\n');
      this.output('\x1b[2m' + 'Type "help" for more information.' + '\x1b[0m\r\n');
      this.output(this.prefix);
    }
  }
  on(event: 'message', callback: (message: string) => void) {
    this.output = callback;
  }
  async exec(input: string, options?: { signal?: AbortSignal }) {
    const previous = this.executionController;
    const controller = new AbortController();
    const abort = () => controller.abort(options?.signal?.reason);
    if (options?.signal?.aborted) abort();
    else options?.signal?.addEventListener('abort', abort, { once: true });
    this.executionController = controller;
    this.exitCode = 0;
    try {
      if (!controller.signal.aborted) await this.handleCommand(input);
      if (controller.signal.aborted) this.exitCode = 130;
    } catch (error) { this.exitCode = controller.signal.aborted ? 130 : 1; throw error; }
    finally {
      options?.signal?.removeEventListener('abort', abort);
      if (this.executionController === controller) this.executionController = previous;
    }
  }
}

export { Shell };
