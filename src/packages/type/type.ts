import { BrowserWindow } from "../feature/window/BrowserWindow";
import { Tree } from "@packages/util/Tree";

import { DefineComponent } from "vue";
import { reactive, ref, UnwrapNestedRefs, watch } from "vue";
import { SystemStateEnum } from "./enum";
export interface SystemOptions {
    logo?:"default"|string;
    backgroud?:string;
}
export interface WinApp {
    name?:string;
    icon?:string;
    url?:string;
    window?: BrowserWindow
}
export type RootState =UnwrapNestedRefs<{
    system: {
        state:SystemStateEnum;
        apps:Array<WinApp>;
        magnet:Array<WinApp>;
        menulist:Array<WinApp>;
        windowTree:Tree<BrowserWindow>,
        windowOrder:Array<BrowserWindow>,
        winnum:number;
        info:{
            screenWidth:number;
            screenHeight:number;
        }
    };
}>
