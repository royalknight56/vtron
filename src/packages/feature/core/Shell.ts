import { System } from "../system";
import * as vPath from "./Path";
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
            if(input.split('>').length>1){
                let outPath = input.split('>')[1].trim();
                outPath = vPath.join(this.router,outPath);
                let res = await this.system.fs.stat(outPath);
                if(res){
                    if(res.isDirectory){
                        this.output(`\x1b[31m${outPath}: Not a file\x1b[0m\r\n`)
                        return;
                    }else{
                        let _this = this;
                        function pipeoutput(text:string){
                            _this.system.fs.appendFile(outPath,text);
                        }
                        await command.callback(input, pipeoutput,this)
                    }
                }else{
                    this.output(`\x1b[31m${outPath}: No such file or directory\x1b[0m\r\n`)
                    return;
                }
            }else{
                await command.callback(input, this.output,this)
            }
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