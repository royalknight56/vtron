import type { Shell } from "../Shell";
import * as path from '../Path';
import { basename } from "@/packages/feature/core/Path"
async function ls(input: string, output: (text: string) => void, shell: Shell) {
    let path = input.split(' ')[1]
    if (path) {
        let res = await shell.system.fs.stat(path)
        if (res) {
            if (res.isDirectory) {
                let children = await shell.system.fs.readdir(path)
                children?.forEach((item) => {
                    if (item.isDirectory) {
                        output(`\x1b[34m${basename(item.path)}\x1b[0m\r\n`)
                    } else {
                        output(`\x1b[32m${basename(item.path)}\x1b[0m\r\n`)
                    }
                })
            } else {
                output(`\x1b[31m${path}: Not a directory\x1b[0m\r\n`)
            }
        } else {
            output(`\x1b[31m${path}: No such file or directory\x1b[0m\r\n`)
        }
    } else {
        let res = await shell.system.fs.readdir(shell.router)
        res?.forEach((item) => {
            if (item.isDirectory) {
                output(`\x1b[34m${basename(item.path)}\x1b[0m\r\n`)
            } else {
                output(`\x1b[32m${basename(item.path)}\x1b[0m\r\n`)
            }
        })
    }
}
export {
    ls
}