export interface ShellTerminal {
  columns: number;
  rows: number;
  onData: (listener: (data: string) => void) => () => void;
  onResize?: (listener: (columns: number, rows: number) => void) => () => void;
}

export interface ShellInterface {
  prefix: string;
  router: string;
  exitCode?: number;
  env?: Record<string, string>;
  setRouter?: (path: string) => void;
  setTerminal?: (terminal?: ShellTerminal) => void;
  on: (event: 'message', callback: (...args: any[]) => void) => void;
  emit: (event: 'start' | 'key' | 'interrupt', message?: string) => void;
  exec: (input: string, options?: { signal?: AbortSignal }) => Promise<void>;
}
