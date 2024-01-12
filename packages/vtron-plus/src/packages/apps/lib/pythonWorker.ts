import { loadPyodide } from 'pyodide';

let preCommand = '';
const echo = (msg: string) => {
  if (!msg) {
    return;
  }
  postMessage(
    msg?.replaceAll(']]', '&rsqb;&rsqb;')?.replaceAll('[[', '&lsqb;&lsqb;')?.replaceAll('\n', '\r\n')
  );
  postMessage('\r\n');
  postMessage('>>> ');
};

const pyodide = await loadPyodide({
  indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full',
  fullStdLib: true,
  stdin: () => {
    return preCommand;
  },
  stdout: (s) => {
    postMessage(s);
  },
});

pyodide.setStdout({
  batched: (msg) => {
    postMessage(msg);
    postMessage('\r\n');
  },
});

pyodide.setStderr({
  batched: (msg) => {
    postMessage(msg);
  },
});

const mountDir = '/C';
pyodide.FS.mkdir(mountDir);
pyodide.FS.mount(pyodide.FS.filesystems.IDBFS, { root: '/C' }, mountDir);

const namespace = pyodide.globals.get('dict')();

let runCode = '';

let repr_shorten: any;
let await_fut: any;
let pyconsole;

let isInit = false;

self.onmessage = async function (event) {
  if (!isInit) {
    isInit = true;
    // 首次执行
    runCode = event.data;
    preCommand = runCode;

    try {
      pyodide.runPython(
        runCode ||
          `
                import sys
                from pyodide.ffi import to_js
                from pyodide.console import PyodideConsole, repr_shorten, BANNER
                import __main__
                BANNER = "Welcome to the vtron Pyodide(Python) terminal emulator 🐍\\n" + BANNER
                pyconsole = PyodideConsole(__main__.__dict__)
                import builtins
                
                async def await_fut(fut):
                  res = await fut
                  if res is not None:
                    builtins._ = res
                  return to_js([res], depth=1)
                def clear_console():
                  pyconsole.buffer = []
                        `,
        { globals: namespace }
      );
    } catch (e) {
      console.log(e);
      echo(String(e));
    }

    repr_shorten = namespace.get('repr_shorten');
    const banner = namespace.get('BANNER');
    await_fut = namespace.get('await_fut');
    pyconsole = namespace.get('pyconsole');

    namespace.destroy();

    echo(banner);
    return;
  } else {
    // 后续输入
    const command = event.data;
    preCommand = command;
    for (const c of command.split('\n')) {
      const escaped = c.replaceAll(/\u00a0/g, ' ');
      const fut = pyconsole.push(escaped);
      // term.set_prompt(fut.syntax_check === "incomplete" ? ps2 : ps1);
      switch (fut.syntax_check) {
        case 'syntax-error':
          // term.error(fut.formatted_error.trimEnd());
          continue;
        case 'incomplete':
          continue;
        case 'complete':
          break;
        default:
          throw new Error(`Unexpected type`);
      }
      const wrapped = await_fut(fut);

      try {
        const [value] = await wrapped;

        if (value !== undefined) {
          echo(
            repr_shorten.callKwargs(value, {
              separator: '\n<long output truncated>\n',
            })
          );
        }
        if (value instanceof pyodide.ffi.PyProxy) {
          value.destroy();
        }
      } catch (e: any) {
        if (e.constructor.name === 'PythonError') {
          const message = fut.formatted_error || e.message;
          echo(message.trimEnd());
        } else {
          throw e;
        }
      } finally {
        fut.destroy();
        wrapped.destroy();
      }
    }
  }
};

self.postMessage('pyodide loading...');
