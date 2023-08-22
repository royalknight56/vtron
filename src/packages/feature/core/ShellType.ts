export interface ShellInterface {
  prefix: string;
  router: string;
  on: (event: 'message', callback: (...args: any[]) => void) => void;
  emit: (event: 'start', router: string, user: string) => void;
  exec: (input: string) => Promise<void>;
}
