import { System } from "../system";
import { VtronFileSystem } from "./fileSystem";
import { commandMap } from "./shellCommand/commandMap";
class Shell {
    system: System;
    router: string;
    user: string;

    prefix: string;

    private inputTextList: string[];
    private childrenDir: string[];
    private output: (message: string) => void;
    // private innerCommand: string[] = ['ls', 'cd', 'pwd', 'clear', 'help'];
    private innerCommand: {
        name: string,
        description: string,
        usage: string,
        callback: (input: string, output: (text: string) => void,shell:Shell) => void
    }[] = commandMap;

    constructor(system:System,router: string = '/C',user: string = 'root') {
        this.system = system;
        this.router = router;
        this.user = user;

        this.prefix = `${user} ${router}>`;

        this.inputTextList = [];
        this.childrenDir = [];
        this.output = (message: string) => {
            console.log(message);
        }
    }
    setRouter(router: string) {
        this.router = router;
        this.prefix = `${this.user} ${router}>`;
    }
    private async handleCommand(input: string) {
        input = input.trim();
        if (!input) return;
        let command = this.innerCommand.find(item => item.name === input.split(' ')[0]);
        if (command) {
            await command.callback(input, this.output,this)
        } else {
            this.output(`\x1b[31m${input}: command not found\x1b[0m\r\n`)
        }
    }
    on(event: 'message', callback: (message: string) => void) {
        this.output = callback;
    }
    async exec(input: string) {
        await this.handleCommand(input);
    }
}

export {
    Shell
}
// let router = '/C';
// let prefix = `${router}>`;

// let currentIndex = 0
// let inputText = ''
// let inputTextList: string[] = [];

// let childrenDir: string[] = [];
// async function handleCommand(input: string, output: (text: string) => void) {
//     input = input.trim();
//     if (!input) return;
//     if (input.startsWith('ls')) {
//         let res = await sys?.fs.readdir(router)
//         childrenDir = [];
//         res?.forEach((item) => {
//             childrenDir.push(item.name)
//             if (item.type === 'dir') {
//                 output(`\x1b[34m${item.name}\x1b[0m\r\n`)
//             } else {
//                 output(`\x1b[32m${item.name}\x1b[0m\r\n`)
//             }
//         })
//     } else if (input.startsWith('cd')) {
//         let path = input.split(' ')[1]
//         if (path === '..') {
//             let res = await sys?.fs.stat(router)
//             if (res?.parentPath) {
//                 router = res.parentPath
//                 prefix = `${router}>`
//             }
//         } else {
//             let res = await sys?.fs.stat(pathJoin(router, path))
//             if (res && res.type === 'dir') {
//                 router = pathJoin(router, path)
//                 prefix = `${router}>`
//             } else {
//                 output(`\x1b[31m${path}: Not a directory\x1b[0m\r\n`)
//             }
//         }
//     } else if (input.startsWith('open')) {
//         let fileName = input.split(' ')[1]
//         let res = await sys?.fs.stat(pathJoin(router, fileName))
//         if (res) {
//             sys?.openFile(res.path)
//         }
//     } else if (input.startsWith('touch')) {
//         let fileName = input.split(' ')[1].trim();
//         let res = await sys?.fs.stat(pathJoin(router, fileName))
//         if (res) {
//             output(`\x1b[31m${fileName}: File exists\x1b[0m\r\n`)
//         } else {
//             await sys?.fs.mkdir(pathJoin(router, fileName))
//         }
//     } else if (input.startsWith('cat')) {
//         let fileName = input.split(' ')[1].trim();
//         let res = await sys?.fs.stat(pathJoin(router, fileName))
//         if (res?.type !== 'dir') {
//             output(`\x1b[?K${res?.content}\r\n`)
//         }
//     } else if (input.startsWith('echo')) {
//         // echo hello > test.txt
//         let fileName = /echo(.*)>\s*(.*)/.exec(input)?.[2].trim();
//         let content = /echo\s+(.*)\s+>/.exec(input)?.[1];
//         let res = await sys?.fs.stat(pathJoin(router, fileName || ''))
//         if (fileName) {
//             if (res) {
//                 await sys?.fs.unlink(pathJoin(router, fileName || ''))
//                 await sys?.fs.writeFile(pathJoin(router, fileName || ''), {
//                     content: content || "",
//                     type: res.path,
//                     name: fileName,
//                     icon: res.icon,
//                 })
//             } else {
//                 await sys?.fs.writeFile(pathJoin(router, fileName || ''), {
//                     content: content || "",
//                     type: 'file',
//                     name: fileName,
//                     icon: 'file',
//                 })
//             }
//         }
//     } else if (input.startsWith('rm')) {
//         // rm -f test.txt
//         // rm -rf testdir
//         let fileName = /rm\s+-\w+\s*(.*)/.exec(input)?.[1].trim();
//         let mode = /rm\s+-(\w+)\s*(.*)/.exec(input)?.[1].trim();
//         if (mode === 'f') {
//             sys?.fs.unlink(pathJoin(router, fileName || ''))
//         } else if (mode === 'rf') {
//             sys?.fs.rmdir(pathJoin(router, fileName || ''))
//         }

//     } else if (input.startsWith('sh')) {
//         let fileName = input.split(' ')[1].trim();
//         let res = await sys?.fs.stat(pathJoin(router, fileName))
//         if (res?.type === 'dir') {
//             output(`\x1b[31m${fileName}: Is a directory\x1b[0m\r\n`)
//         } else {
//             let content = res?.content || ''
//             let lines = content.split('\n')
//             for (let line of lines) {
//                 output(`\x1b[?Ksh: ${line}\r\n`)
//                 await handleCommand(line, term)
//             }
//         }
//     } else if (input.startsWith('help')) {
//         output('');
//         output('ls: list directory contents');
//         output('cd: change directory');
//         output('open: open file');
//         output('touch: create a new file');
//         output('cat: print file content');
//         output('echo: write content to file');
//         output('rm: remove file or directory');
//         output('sh: run shell script');
//         output('help: display help information');
//         output('test: test');
//         output('cls: clear screen');
//         output('clear: clear screen and command history');
//         output('');
//     } else if (input.startsWith('test')) {
//         term.clear();
//     } else if (input.startsWith('cls')) {
//         term.clear();
//     } else if (input.startsWith('clear')) {
//         term.clear();
//         localStorage.setItem('vtronCommandHistory', JSON.stringify([]))
//     } else {
//         output(`\x1b[31m${input}: command not found\x1b[0m\r\n`)
//     }

// }