import { BrowserWindow } from "../feature/window/BrowserWindow";
import { Tree } from "@packages/util/Tree";

import { DefineComponent } from "vue";
import { reactive, ref, UnwrapNestedRefs, watch } from "vue";
import { SystemStateEnum } from "./enum";
import { Notify } from "../feature/notification/Notification";
export interface SystemOptions {
    logo?:"default"|string;
    background?:string;
}
export interface WinApp {
    name:string;
    icon:string;
}
export interface WinAppOptions {
    name:string;
    icon?:string;
    window: BrowserWindow
}

export type RootState =UnwrapNestedRefs<{
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
            Desktop:Map<string,BrowserWindow>,
            Magnet:Map<string,BrowserWindow>,
            Menulist:Map<string,BrowserWindow>,
            [key:string]:Map<string,BrowserWindow>
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
}>
