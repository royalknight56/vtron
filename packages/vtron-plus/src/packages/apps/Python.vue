<template>
  <div class="outer">
    <div class="terminal" :id="'terminal' + browserWindow?.id"></div>
  </div>
</template>
<script setup lang="ts">
import { inject, onMounted, onUnmounted } from 'vue';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { BrowserWindow } from 'vtron';
// import PythonWorker from './lib/pythonWorker?worker&inline';
import workerUrl from './lib/pythonWorker?worker&url';
const worker = new Worker(workerUrl, { type: 'module' });

const browserWindow = inject<BrowserWindow>('browserWindow');

let term: Terminal;
onMounted(() => {
  const fitAddon = new FitAddon();

  term = new Terminal({});

  term.loadAddon(fitAddon);
  setTimeout(() => {
    fitAddon.fit();
  }, 100);
  browserWindow?.on('resize', () => {
    fitAddon.fit();
  });
  term.open(document.getElementById('terminal' + browserWindow?.id)!);
  onUnmounted(() => {
    term.dispose();
  });

  // const worker = new PythonWorker();
  let isInit = false;
  worker.onmessage = (e) => {
    if (!isInit) {
      isInit = true;
      // 初次执行
      worker.postMessage(
        browserWindow?.config.code ||
          `import sys
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
`
      );
    } else {
      term.write(e.data);
    }
  };
  worker.addEventListener('error', (e) => {
    console.log(e);
  });

  const handleInputText = async () => {
    // console.log(command);
    term.write('\r\n');
    term.write(prefix);

    inputTextList.push(inputText);
    currentIndex = inputTextList.length;
    worker.postMessage(inputText);
  };

  const TERMINAL_INPUT_KEY = {
    BACK: 8, // 退格删除键
    ENTER: 13, // 回车键
    UP: 38, // 方向盘上键
    DOWN: 40, // 方向盘键
    LEFT: 37, // 方向盘左键
    RIGHT: 39, // 方向盘右键
  };
  let inputText = '';
  let currentIndex = 0;
  const inputTextList: string[] = [];

  const getCursorOffsetLength = (offsetLength: number, subString = '') => {
    let cursorOffsetLength = '';
    for (let offset = 0; offset < offsetLength; offset++) {
      cursorOffsetLength += subString;
    }
    return cursorOffsetLength;
  };

  term.clear();
  const prefix = '>>> ';
  // term.write('Welcome to the vtron Pyodide(Python) terminal emulator 🐍\r\n');
  // term.write(prefix);

  term.onKey(async (e) => {
    const { key, domEvent } = e;
    const { keyCode, altKey, ctrlKey, metaKey } = domEvent;
    const printAble = !(altKey || ctrlKey || metaKey); // 禁止相关按键
    const totalOffsetLength = inputText.length + prefix.length; // 总偏移量
    const currentOffsetLength = term.buffer.active.cursorX; // 当前x偏移量

    switch (keyCode) {
      case TERMINAL_INPUT_KEY.BACK:
        if (currentOffsetLength > prefix.length) {
          const cursorOffSetLength = getCursorOffsetLength(totalOffsetLength - currentOffsetLength, '\x1b[D'); // 保留原来光标位置
          term.write('\x1b[D');
          term.write('\x1b[?K' + inputText.slice(currentOffsetLength - prefix.length));
          term.write(cursorOffSetLength);
          inputText = `${inputText.slice(0, currentOffsetLength - prefix.length - 1)}${inputText.slice(
            currentOffsetLength - prefix.length
          )}`;
        }
        break;
      case TERMINAL_INPUT_KEY.ENTER:
        handleInputText();
        inputText = '';
        break;
      case TERMINAL_INPUT_KEY.UP: {
        if (!inputTextList[currentIndex - 1]) break;
        const offsetLength = getCursorOffsetLength(inputText.length, '\x1b[D');
        inputText = inputTextList[currentIndex - 1];
        term.write(offsetLength + '\x1b[?K');
        term.write(inputTextList[currentIndex - 1]);
        currentIndex--;
        break;
      }
      case TERMINAL_INPUT_KEY.DOWN: {
        if (!inputTextList[currentIndex + 1]) break;
        const offsetLength = getCursorOffsetLength(inputText.length, '\x1b[D');
        inputText = inputTextList[currentIndex + 1];
        term.write(offsetLength + '\x1b[?K');
        term.write(inputTextList[currentIndex + 1]);
        currentIndex++;
        break;
      }

      case TERMINAL_INPUT_KEY.LEFT:
        if (currentOffsetLength > prefix.length) {
          term.write(key); // '\x1b[D'
        }
        break;

      case TERMINAL_INPUT_KEY.RIGHT:
        if (currentOffsetLength < totalOffsetLength) {
          term.write(key); // '\x1b[C'
        }
        break;
      // tab:
      case 9:
        break;
      default: {
        if (!printAble) break;
        if (totalOffsetLength >= term.cols) break;
        if (currentOffsetLength >= totalOffsetLength) {
          term.write(key);
          inputText += key;
          break;
        }
        const cursorOffSetLength = getCursorOffsetLength(totalOffsetLength - currentOffsetLength, '\x1b[D');
        // 在当前的坐标写上 key 和坐标后面的字符
        // term.write('\x1b[?K' + `${key}${inputText.slice(currentOffsetLength - prefix.length)}`)
        term.write('\x1b[?K' + key + inputText.slice(currentOffsetLength - prefix.length));
        term.write(cursorOffSetLength); // 移动停留在当前位置的光标
        inputText =
          inputText.slice(0, currentOffsetLength - prefix.length) +
          key +
          inputText.slice(currentOffsetLength - prefix.length);
      }
    }
  });
});
</script>

<style scoped>
.outer {
  width: 100%;
  height: 100%;
}

.terminal {
  width: 100%;
  height: 100%;
  background-color: black;
}
</style>

<style>
@import 'xterm/css/xterm.css';
</style>
