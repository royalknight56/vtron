import type { Shell } from "../Shell";
import * as vPath from '../Path';
async function touch(input: string, output: (text: string) => void,shell:Shell) {
    let fileName = input.split(' ')[1].trim();
    let res = await shell.system.fs.stat(vPath.join(shell.router, fileName))
    if (res) {
        output(`\x1b[31m${fileName}: File exists\x1b[0m\r\n`)
    } else {
        await shell.system.fs.writeFile(vPath.join(shell.router, fileName), {
            type: 'file',
            content: '',
            icon: 'file'
        })
    }
}
export {
    touch
}