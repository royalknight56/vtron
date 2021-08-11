/*
 * @Author: zhangweiyuan-Royal
 * @LastEditTime: 2021-08-05 17:23:44
 * @Description: 
 * @FilePath: /myindex/src/components/window/libs/consoleIPC.ts
 */
import { reactive } from "vue";

class consoleIPC {
    private static instance: consoleIPC;
    linelist: Array<{ text: string }>;
    private constructor() {
        this.linelist = reactive([]);
        this.linelist.push({ text: '' })
    }
    static getInstance() {
        if (this.instance == undefined) {
            this.instance = new consoleIPC()
        }
        return this.instance
    }
    openConsole() {
        this.linelist.splice(0, this.linelist.length)
        this.linelist.push({ text: "" });
    }
    input(str: string) {
        switch (str) {
            case "cls":
            case "clear":
                this.linelist.splice(0, this.linelist.length)
                this.linelist.push({ text: "" });
                break;
            default:
                this.linelist[this.linelist.length - 1].text = str;
                this.linelist.push({ text: "Error : cant find command" });
                this.linelist.push({ text: "" });
        }
        // if(str=="cls"||str=="clear"){
        //     this.linelist.splice(0,this.linelist.length)
        //     this.linelist.push({text:""});
        // }else{
        //     this.linelist[this.linelist.length-1].text=str;
        //     this.linelist.push({text:"Error : cant find command"});
        //     this.linelist.push({text:""});
        // }
    }


}
export {
    consoleIPC
}