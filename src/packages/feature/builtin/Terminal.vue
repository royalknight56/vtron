<template>
    <div class="outer">
        <div id="terminal"></div>
    </div>
</template>

<script lang="ts" setup>
import { onMounted, onUnmounted, ref } from 'vue';
import { Terminal } from "xterm";
// @ts-ignore
import { FitAddon } from 'xterm-addon-fit';
import { useSystem } from '../system';
import { Shell } from '../core/Shell';

let sys = useSystem();


let currentIndex = 0
let inputText = ''
let inputTextList: string[] = [];

let childrenDir: string[] = [];

const TERMINAL_INPUT_KEY = {
    BACK: 8, // 退格删除键
    ENTER: 13, // 回车键
    UP: 38, // 方向盘上键
    DOWN: 40, // 方向盘键
    LEFT: 37, // 方向盘左键
    RIGHT: 39 // 方向盘右键
}

const getCursorOffsetLength = (offsetLength: number, subString: string = '') => {
    let cursorOffsetLength = ''
    for (let offset = 0; offset < offsetLength; offset++) {
        cursorOffsetLength += subString
    }
    return cursorOffsetLength
}

onMounted(() => {
    if (sys) {
        let shell = new Shell(sys);
        shell.on('message', (msg) => {
            // term.write(`\x1b[?K${msg}\r\n`);
            term.write(`${msg}`)

        });
        let router = shell.router;

        inputTextList = (JSON.parse(localStorage.getItem('vtronCommandHistory') || '[]') as string[]) || []
        currentIndex = inputTextList.length
        const fitAddon = new FitAddon();
        var term = new Terminal({
            cols: 70,
        });
        term.loadAddon(fitAddon);
        term.open(document.getElementById('terminal')!);
        term.write('\x1b[2m' + "Welcome to Vtron Terminal" + '\x1b[0m\r\n');


        term.write(shell.prefix);
        onUnmounted(() => {
            term.dispose()
        })
        async function prompt(term: any) {
            currentIndex = inputTextList.length
            // await handleCommand(inputText, term);
            await shell.exec(inputText)
            term.write(shell.prefix);
        }


        const handleInputText = () => {
            term.write('\r\n')
            if (!inputText.trim()) {
                prompt(term)
                return
            }

            if (inputTextList.indexOf(inputText) === -1) {
                inputTextList.push(inputText);
                localStorage.setItem('vtronCommandHistory', JSON.stringify(inputTextList))
                currentIndex = inputTextList.length
            }

            prompt(term)
        }

        term.clear();
        term.onKey(async e => {
            const { key, domEvent } = e
            const { keyCode, altKey, ctrlKey, metaKey } = domEvent

            const printAble = !(altKey || ctrlKey || metaKey) // 禁止相关按键
            const totalOffsetLength = inputText.length + shell.prefix.length   // 总偏移量
            const currentOffsetLength = term.buffer.active.cursorX     // 当前x偏移量

            switch (keyCode) {
                case TERMINAL_INPUT_KEY.BACK:
                    if (currentOffsetLength > shell.prefix.length) {
                        const cursorOffSetLength = getCursorOffsetLength(totalOffsetLength - currentOffsetLength, '\x1b[D') // 保留原来光标位置
                        term.write('\x1b[D')
                        term.write('\x1b[?K' + inputText.slice(currentOffsetLength - shell.prefix.length))
                        term.write(cursorOffSetLength)
                        inputText = `${inputText.slice(0, currentOffsetLength - shell.prefix.length - 1)}${inputText.slice(currentOffsetLength - shell.prefix.length)}`
                    }
                    break;
                case TERMINAL_INPUT_KEY.ENTER:
                    handleInputText()
                    inputText = ''
                    break;
                case TERMINAL_INPUT_KEY.UP: {
                    if (!inputTextList[currentIndex - 1]) break
                    const offsetLength = getCursorOffsetLength(inputText.length, '\x1b[D')
                    inputText = inputTextList[currentIndex - 1]
                    term.write(offsetLength + '\x1b[?K')
                    term.write(inputTextList[currentIndex - 1])
                    currentIndex--
                    break
                }
                case TERMINAL_INPUT_KEY.DOWN: {
                    if (!inputTextList[currentIndex + 1]) break
                    const offsetLength = getCursorOffsetLength(inputText.length, '\x1b[D')
                    inputText = inputTextList[currentIndex + 1]
                    term.write(offsetLength + '\x1b[?K')
                    term.write(inputTextList[currentIndex + 1])
                    currentIndex++
                    break
                }

                case TERMINAL_INPUT_KEY.LEFT:
                    if (currentOffsetLength > shell.prefix.length) {
                        term.write(key) // '\x1b[D'
                    }
                    break

                case TERMINAL_INPUT_KEY.RIGHT:
                    if (currentOffsetLength < totalOffsetLength) {
                        term.write(key) // '\x1b[C'
                    }
                    break
                // tab:
                case 9:
                    let splitArr = inputText.split(' ');
                    let unready = splitArr[splitArr.length - 1] || inputText;
                    let res = await sys?.fs.readdir(shell.router)
                    let list: string[] = [];
                    res?.forEach((item) => {
                        list.push(item.name)
                    })
                    let matchList = list.filter((item: any) => {
                        return item.startsWith(unready)
                    })
                    if (matchList.length) {
                        inputText += matchList[0].slice(unready.length)
                        term.write('\x1b[?K' + matchList[0].slice(unready.length))
                    }
                    break
                default:
                    if (!printAble) break
                    if (totalOffsetLength >= term.cols) break
                    if (currentOffsetLength >= totalOffsetLength) {
                        term.write(key);
                        inputText += key
                        break
                    }
                    const cursorOffSetLength = getCursorOffsetLength(totalOffsetLength - currentOffsetLength, '\x1b[D')
                    // 在当前的坐标写上 key 和坐标后面的字符
                    // term.write('\x1b[?K' + `${key}${inputText.slice(currentOffsetLength - prefix.length)}`) 
                    term.write('\x1b[?K' + key + inputText.slice(currentOffsetLength - shell.prefix.length))
                    term.write(cursorOffSetLength)  // 移动停留在当前位置的光标
                    inputText = inputText.slice(0, currentOffsetLength - shell.prefix.length) + key + inputText.slice(currentOffsetLength - shell.prefix.length)
            }
        });
    }
})

</script>

<style scoped>
.outer {
    width: 100%;
    height: 100%;
}

#terminal {
    width: 100%;
    height: 100%;
    background-color: black;
}
</style>

<style>
@import "xterm/css/xterm.css";
</style>