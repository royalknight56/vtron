import { Shell } from "../Shell";
import * as vPath from '../Path';
async function sh(input: string, output: (text: string) => void,shell:Shell) {
    let path = input.split(' ')[1]
    if (path) {
        let res = await shell.system.fs.stat(vPath.join(shell.router, path))
        if (res) {
            if (res.type !== 'dir') {
                let file = await shell.system.fs.readFile(vPath.join(shell.router, path))
                if (file) {
                    let subShell = new Shell(shell.system, shell.router, shell.user);
                    // subShell.run(file, output)
                    subShell.on('message', (text) => {
                        output(text)
                    })
                    let lines = file.split('\n')
                    for (let i = 0; i < lines.length; i++) {
                        let line = lines[i];
                        await subShell.exec(line)
                    }
                }
            } else {
                output(`\x1b[31m${path}: Not a file\x1b[0m\r\n`)
            }
        } else {
            output(`\x1b[31m${path}: No such file or directory\x1b[0m\r\n`)
        }
    } else {
        output(`\x1b[31m${path}: No such file or directory\x1b[0m\r\n`)
    }
}
export {
    sh
}