import type { Shell } from "../Shell";
import * as vPath from '../Path';
import * as ivue from 'vue'
async function node(input: string, output: (text: string) => void, shell: Shell) {
    let path = input.split(' ')[1]
    if (path) {
        let res = await shell.system.fs.stat(vPath.join(shell.router, path))
        if (res) {
            if (res.isFile) {
                let file = await shell.system.fs.readFile(vPath.join(shell.router, path))
                if (file) {
                    new Function('system', 'vue', file + '\nmain(system)')(shell.system, ivue)
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
    node
}