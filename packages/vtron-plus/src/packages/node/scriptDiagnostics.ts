export type ScriptPosition = { line: number; column?: number };
const parameters = ['system', 'vue', 'fs', 'process', 'require', 'console', '__filename', '__dirname', 'module', 'exports', '__vtronRunMain', 'fetch', 'setTimeout', 'setInterval', 'clearTimeout', 'clearInterval', '__vtronImport', 'global', 'globalThis', 'Buffer'];
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor as new (...args: string[]) => (...values: unknown[]) => Promise<unknown>;
let stackOffsetPromise: Promise<number> | undefined;

export function scriptSourceURL(filename: string) {
  return 'vtron://script/' + filename.replace(/^\//, '').split('/').map(encodeURIComponent).join('/');
}

export function scriptBody(code: string, filename: string) {
  // A hashbang is valid at the start of a Node file, but not inside a function body.
  // Keep its length and line breaks so diagnostics still refer to the original source.
  const source = code.replace(/^\uFEFF?#![^\r\n\u2028\u2029]*/, text => ' '.repeat(text.length));
  return '{\n' + source + '\n;if (typeof main === "function") await __vtronRunMain(main, system, vue);\n}\n//# sourceURL=' + scriptSourceURL(filename);
}

export function compileScript(body: string) { return new AsyncFunction(...parameters, body); }

function escaped(value: string) { return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
function sourceLines(code: string) { return code.split(/\r\n|[\n\r\u2028\u2029]/); }

export function scriptStackOffset(): Promise<number> {
  // Function constructors add different wrapper lines in different browser engines.
  return stackOffsetPromise ??= (async () => {
    const filename = '[vtron-line-check]';
    try { await compileScript(scriptBody('throw new Error("line check");', filename))(); }
    catch (error) {
      const match = error instanceof Error && error.stack?.match(new RegExp(escaped(scriptSourceURL(filename)) + ':(\\d+):\\d+'));
      if (match) return Number(match[1]) - 1;
    }
    return 3;
  })();
}

export function locateSyntaxError(body: string, code: string): Promise<ScriptPosition | undefined> {
  if (typeof Worker === 'undefined' || typeof URL.createObjectURL !== 'function') return Promise.resolve(undefined);
  return new Promise(resolve => {
    let worker: Worker | undefined;
    let url: string | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let settled = false;
    const finish = (position?: ScriptPosition) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      worker?.terminate();
      if (url) URL.revokeObjectURL(url);
      resolve(position);
    };
    try {
      // The browser parses this declaration but never calls it or runs the user's code.
      const source = `async function __vtron_syntax_check__(${parameters.join(',')}) {\n${body}\n}\npostMessage(null);`;
      url = URL.createObjectURL(new Blob([source], { type: 'text/javascript' }));
      worker = new Worker(url);
      worker.onerror = event => {
        event.preventDefault();
        if (!event.lineno) { finish(); return; }
        const lines = sourceLines(code);
        const line = Math.max(1, Math.min(lines.length, event.lineno - 2));
        const column = event.lineno - 2 > lines.length ? lines[line - 1].length + 1 : event.colno || undefined;
        finish({ line, column });
      };
      worker.onmessage = () => finish();
      timer = setTimeout(() => finish(), 1500);
    } catch { finish(); }
  });
}

function codeFrame(code: string, position: ScriptPosition) {
  const lines = sourceLines(code);
  const first = Math.max(1, position.line - 2);
  const last = Math.min(lines.length, position.line + 2);
  const width = String(last).length;
  const frame: string[] = [];
  for (let line = first; line <= last; line++) {
    const text = lines[line - 1];
    const offset = line === position.line && position.column ? Math.max(0, position.column - 75) : 0;
    const prefix = offset ? '…' : '';
    const excerpt = prefix + text.slice(offset, offset + 160).replace(/\t/g, '  ') + (text.length > offset + 160 ? '…' : '');
    frame.push(`${line === position.line ? '>' : ' '} ${String(line).padStart(width)} | ${excerpt}`);
    if (line === position.line && position.column) {
      const before = prefix + text.slice(offset, position.column - 1).replace(/\t/g, '  ');
      frame.push(' '.repeat(width + 5 + before.length) + '^');
    }
  }
  return frame.join('\n');
}

export function formatScriptError(error: unknown, code: string, filename: string, stackOffset: number, syntaxPosition?: ScriptPosition) {
  const detail = error && typeof error === 'object' ? error as {
    scriptSource?: { filename?: unknown; code?: unknown; stackOffset?: number; position?: ScriptPosition };
    loc?: { line?: number; column?: number };
  } : undefined;
  const source = detail?.scriptSource;
  if (typeof source?.filename === 'string' && typeof source.code === 'string') {
    filename = source.filename;
    code = source.code;
    if (error instanceof SyntaxError && detail?.loc?.line) {
      syntaxPosition = { line: detail.loc.line, column: (detail.loc.column ?? 0) + 1 };
    }
  }
  const title = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
  const result = [title, `文件: ${filename}`];
  let position = syntaxPosition ?? source?.position;
  const count = sourceLines(code).length;
  const stack = (error instanceof Error ? error.stack || '' : '').replace(
    new RegExp('vtron://(script|esm|module)/' + escaped(filename.replace(/^\//, '').split('/').map(encodeURIComponent).join('/')) + ':(\\d+):(\\d+)', 'g'),
    (_match, kind: string, rawLine: string, rawColumn: string) => {
      const line = Number(rawLine) - (kind === 'script' ? stackOffset : source?.stackOffset ?? 2);
      if (line < 1 || line > count) return filename + ' [运行入口]';
      // Without a source map, ESM columns describe generated code.
      position ??= { line, column: kind === 'esm' ? undefined : Number(rawColumn) };
      return `${filename}:${line}${kind === 'esm' ? '' : ':' + rawColumn}`;
    }
  );
  if (position) {
    result.push(`位置: 第 ${position.line} 行${position.column ? `，第 ${position.column} 列` : ''}`, '', codeFrame(code, position));
    if (syntaxPosition?.column) {
      const point = sourceLines(code)[syntaxPosition.line - 1]?.codePointAt(syntaxPosition.column - 1);
      if (point !== undefined) result.push(`位置字符: ${JSON.stringify(String.fromCodePoint(point))} (U+${point.toString(16).toUpperCase().padStart(4, '0')})`);
    }
  } else result.push('位置: 浏览器未提供行列号');
  if (error && typeof error === 'object' && 'code' in error) result.push(`错误代码: ${String(error.code)}`);
  if (error && typeof error === 'object' && 'cause' in error && error.cause !== undefined) result.push(`原因: ${String(error.cause)}`);
  if (stack) result.push('', '调用栈:', stack);
  return result.join('\n');
}

export class ScriptFailure extends Error {
  constructor(readonly diagnostic: string, readonly original: unknown) {
    super(original instanceof Error ? original.message : String(original));
    this.name = original instanceof Error ? original.name : 'Error';
  }
}
