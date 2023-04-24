import type { Shell } from "../Shell";
import * as vPath from '../Path';
async function echo(input: string, output: (text: string) => void,shell:Shell) {
    let path = input.split(' ')[1]
    if (path) {
        output('\x1b[32m' + path + '\x1b[0m\r\n')
    } else {
        output(`\x1b[31m echo: missing operand\x1b[0m\r\n`)
    }
}
export {
    echo
}