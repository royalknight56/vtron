import { toRaw } from "vue";
import { useRootState } from "../state/Root";
import { BrowserWindow } from "../window/BrowserWindow";
import DialogVue from "./DialogTemp.vue";
class Dialog{
    constructor(){
    }
    public static showMessageBox(option:{
        message?: string;
        type?: 'info' | 'error' | 'question' | 'warning';
        title?: string;
        buttons?: string[];
    }):Promise<{
        response: number;
    }>{

        let opt = Object.assign({
            message: '',
            type: 'info',
            title: '提示',
            buttons: ['OK']
        }, option);

        let promres: (value: {
            response: number;
        }) => void = ()=>{};
        
        let porm = new Promise<{
            response: number;
        }>((resolve, reject)=>{
            promres = resolve
        });

        let dialogwin = new BrowserWindow({
            width: 300,
            height: 150,
            content:DialogVue,
            title:opt.title,
            resizable:false,
            minimizable:false,
            center:true,
            skipTaskbar:true,
            config:{
                res:promres,
                option:opt
            },
            alwaysOnTop: true,
        })
        dialogwin.show();
        useRootState().system.windowOrder.forEach((win)=>{
            if(!(toRaw(win)===dialogwin)){
                win.setDisable(true)
            }
        })
        dialogwin.on('closed', ()=>{
            useRootState().system.windowOrder.forEach((win)=>{
                if(!(toRaw(win)===dialogwin)){
                    win.setDisable(false)
                }
            })
            promres({
                response: -1
            })
        })


        return porm
    }
}

export {
    Dialog
}