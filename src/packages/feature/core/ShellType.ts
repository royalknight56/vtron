export interface ShellInterface {
  prefix: string;
  router: string;
  on: (event: 'message', callback: (...args: any[]) => void) => void;
  emit: (event: 'start' | 'key', message: string) => void;
  exec: (input: string) => Promise<void>;
}
