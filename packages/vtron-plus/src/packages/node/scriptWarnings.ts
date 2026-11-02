type Warning = Error & { code?: string; detail?: string };
type Options = { type?: string; code?: string; detail?: string; ctor?: Function };
type Process = {
  noDeprecation?: boolean; throwDeprecation?: boolean; traceDeprecation?: boolean;
  emit(event: string, warning: Warning): unknown;
  stderr: { write(text: string): unknown };
};
const invalid = (message: string): never => { throw Object.assign(new TypeError(message), { code: 'ERR_INVALID_ARG_TYPE' }); };

/** Process-local warnings use the actual terminal and process event queue. */
export function createScriptWarnings(process: Process, nextTick: (callback: () => void) => void) {
  function emitWarning(warning: string | Error, typeOrOptions?: string | Options | Function, codeOrCtor?: string | Function, ctor?: Function): void {
    let options: Options;
    if (typeOrOptions !== null && typeof typeOrOptions === 'object') options = typeOrOptions;
    else {
      if (codeOrCtor !== undefined && typeof codeOrCtor !== 'string' && typeof codeOrCtor !== 'function') invalid('warning.code must be a string');
      options = { type: typeof typeOrOptions === 'function' ? undefined : typeOrOptions ?? undefined, code: typeof codeOrCtor === 'string' ? codeOrCtor : undefined, ctor: typeof typeOrOptions === 'function' ? typeOrOptions : typeof codeOrCtor === 'function' ? codeOrCtor : ctor };
    }
    for (const key of ['type', 'code', 'detail'] as const) if (options[key] !== undefined && typeof options[key] !== 'string') invalid(`warning.${key} must be a string`);
    if (options.ctor !== undefined && typeof options.ctor !== 'function') invalid('warning.ctor must be a function');
    if (typeof warning !== 'string' && !(warning instanceof Error)) invalid('warning must be a string or Error');
    const error: Warning = typeof warning === 'string' ? Object.assign(new Error(warning), { name: options.type || 'Warning', ...(options.code === undefined ? {} : { code: options.code }), ...(options.detail === undefined ? {} : { detail: options.detail }) }) : warning;
    if (typeof warning === 'string') {
      const capture = (Error as ErrorConstructor & { captureStackTrace?: (error: Error, ctor: Function) => void }).captureStackTrace;
      capture?.(error, options.ctor ?? emitWarning);
    }
    if (error.name === 'DeprecationWarning' && process.noDeprecation) return;
    const throwWarning = error.name === 'DeprecationWarning' && process.throwDeprecation;
    nextTick(() => {
      if (throwWarning) throw error;
      const prefix = error.code ? `[${error.code}] ` : '';
      const text = error.name === 'DeprecationWarning' && process.traceDeprecation ? error.stack || `${error.name}: ${error.message}` : `${error.name}: ${error.message}`;
      process.stderr.write(prefix + text + (error.detail ? '\n' + error.detail : '') + '\n');
      process.emit('warning', error);
    });
  }
  return { emitWarning };
}
