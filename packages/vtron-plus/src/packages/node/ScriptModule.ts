export interface ScriptModuleResolver {
  (request: string, parentFilename?: string): unknown;
  resolve?: (request: string, parentFilename?: string) => string;
  cache?: Record<string, unknown>;
  importModule?: (request: string, parentFilename?: string, options?: unknown) => Promise<unknown>;
  executeEntry?: (source: string) => Promise<boolean>;
  transformEntry?: (source: string) => string;
  dispose?: () => void;
}

export interface ScriptModuleContext {
  filename: string;
  source?: string;
  cwd: string;
  requireBuiltin: (name: string) => unknown;
  main: unknown;
  signal?: AbortSignal;
  track?: <T>(promise: Promise<T>) => Promise<T>;
  globals: {
    global: Record<string, unknown>;
    Buffer: typeof import('buffer/').Buffer;
    fs: unknown;
    process: unknown;
    console: Console;
    fetch: typeof globalThis.fetch;
    setTimeout: ReturnType<typeof import('./scriptTasks').createScriptTasks>['setTimeout'];
    setInterval: ReturnType<typeof import('./scriptTasks').createScriptTasks>['setInterval'];
    clearTimeout: ReturnType<typeof import('./scriptTasks').createScriptTasks>['clearTimeout'];
    clearInterval: ReturnType<typeof import('./scriptTasks').createScriptTasks>['clearInterval'];
  };
}

export type ScriptModuleLoader = (context: ScriptModuleContext) => ScriptModuleResolver | Promise<ScriptModuleResolver>;
