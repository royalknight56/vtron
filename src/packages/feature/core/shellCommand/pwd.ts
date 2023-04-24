import type { Shell } from "../Shell";
import * as vPath from '../Path';
async function pwd(input: string, output: (text: string) => void,shell:Shell) {
    output('\x1b[32m' + shell.router + '\x1b[0m\r\n')
}
export {
    pwd
}