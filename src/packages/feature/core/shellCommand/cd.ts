import type { Shell } from "../Shell";
import * as vPath from '../Path';
async function cd(input: string, output: (text: string) => void,shell:Shell) {
    let path = input.split(' ')[1]
    if (path === '..') {
        let res = await shell.system.fs.stat(shell.router)
        if (res?.parentPath) {
            shell.setRouter(res.parentPath)
        }
    } else {
        let res = await shell.system.fs.stat(vPath.join(shell.router, path))
        if (res && res.type === 'dir') {
            shell.setRouter(vPath.join(shell.router, path))
        } else {
            output(`\x1b[31m${path}: Not a directory\x1b[0m\r\n`)
        }
    }
}
export {
    cd
}