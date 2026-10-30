/** Import compatibility only; no command is executed and no ChildProcess is returned. */
export function createScriptChildProcess() {
  const unsupported = (name: string): never => {
    throw Object.assign(new Error(`child_process.${name} is not supported by the Vtron browser runtime; subprocess execution is unavailable`), { code: 'ERR_NOT_SUPPORTED' });
  };
  return {
    exec(..._args: unknown[]): never { return unsupported('exec'); },
    execFile(..._args: unknown[]): never { return unsupported('execFile'); },
    execSync(..._args: unknown[]): never { return unsupported('execSync'); },
    execFileSync(..._args: unknown[]): never { return unsupported('execFileSync'); },
    spawn(..._args: unknown[]): never { return unsupported('spawn'); },
  };
}
