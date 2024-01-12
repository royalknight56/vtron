import { loadPyodide } from 'pyodide';

class PythonCall {
  constructor() {
    //
  }
  pyodide!: ReturnType<typeof loadPyodide> extends Promise<infer P> ? P : unknown;
  async create() {
    this.pyodide = await loadPyodide({
      indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full',
      fullStdLib: true,
      stdin: () => {
        return '';
      },
      stdout: (s) => {
        this.postTermMessage(s);
      },
    });

    this.pyodide.setStdout({
      batched: (msg) => {
        this.postTermMessage(msg);
        this.postTermMessage('\r\n');
      },
    });

    this.pyodide.setStderr({
      batched: (msg) => {
        this.postTermMessage(msg);
      },
    });

    const mountDir = '/C';
    this.pyodide.FS.mkdir(mountDir);
    this.pyodide.FS.mount(this.pyodide.FS.filesystems.IDBFS, { root: '/C' }, mountDir);
    this.postTermMessage('finish');
  }
  postTermMessage: (e: string) => void = (e) => {
    e;
  };

  onmessage(fn: (e: string) => void) {
    this.postTermMessage = fn;
  }

  isInit = false;
  pyconsole: any;
  await_fut: any;
  repr_shorten: any;
  async postMessage(data: string) {
    const echo = (msg: string) => {
      if (!msg) {
        return;
      }
      this.postTermMessage(
        msg?.replaceAll(']]', '&rsqb;&rsqb;')?.replaceAll('[[', '&lsqb;&lsqb;')?.replaceAll('\n', '\r\n')
      );
      this.postTermMessage('\r\n');
      this.postTermMessage('>>> ');
    };

    if (!this.isInit) {
      this.isInit = true;
      // 首次执行

      const namespace = this.pyodide.globals.get('dict')();

      let runCode = '';

      runCode = data;

      try {
        this.pyodide.runPython(
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

      this.repr_shorten = namespace.get('repr_shorten');
      const banner = namespace.get('BANNER');
      this.await_fut = namespace.get('await_fut');
      this.pyconsole = namespace.get('pyconsole');

      namespace.destroy();

      echo(banner);
      return;
    } else {
      // 后续输入
      const command = data;

      for (const c of command.split('\n')) {
        const escaped = c.replaceAll(/\u00a0/g, ' ');
        if (!this.pyconsole) {
          return;
        }
        const fut = this.pyconsole.push(escaped);
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
        const wrapped = this.await_fut(fut);

        try {
          const [value] = await wrapped;

          if (value !== undefined) {
            echo(
              this.repr_shorten.callKwargs(value, {
                separator: '\n<long output truncated>\n',
              })
            );
          }
          if (value instanceof this.pyodide.ffi.PyProxy) {
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
  }
}
export { PythonCall };
