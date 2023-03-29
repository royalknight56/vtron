import { BrowserWindow, BrowserWindowOption } from "../feature/window/BrowserWindow";
import { Tree } from "@packages/util/Tree";

import { DefineComponent } from "vue";
import { reactive, ref, UnwrapNestedRefs, watch } from "vue";
import { SystemStateEnum } from "./enum";
import { Notify } from "../feature/notification/Notification";
export interface SystemOptions {
    logo?:string;
    background?:string;
    desktop?:WinAppOptions[];
    magnet?:WinAppOptions[];
    menulist?:WinAppOptions[];
}
export interface WinApp {
    name:string;
    icon:string;
    path:string;
}
export interface WinAppOptions {
    name:string;
    icon?:string;
    window: BrowserWindowOption
}

export type RootState ={
    ref:HTMLElement|undefined;
    system: {
        state:SystemStateEnum;
        apps:Array<WinApp>;
        magnet:Array<WinApp>;
        menulist:Array<WinApp>;
        notify:Array<Notify>;
        windowTree:Tree<BrowserWindow>,
        windowOrder:Array<BrowserWindow>,
        windowMap:{
            Desktop:Map<string,BrowserWindowOption>,
            Magnet:Map<string,BrowserWindowOption>,
            Menulist:Map<string,BrowserWindowOption>,
            [key:string]:Map<string,BrowserWindowOption>
        },
        winnum:number;
        topWindow:BrowserWindow|undefined;
        info:{
            screenWidth:number;
            screenHeight:number;
            battery:{
                isCharging:boolean;
                chargeLevel:number;
            },
            connection:number;
        },
        options:SystemOptions
    };
}
