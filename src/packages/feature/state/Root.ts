import { SystemStateEnum } from "@/packages/type/enum";
import { RootState, SystemOptions } from "@/packages/type/type";
import { reactive, ref, UnwrapNestedRefs, watch } from "vue";
import { Tree } from "@packages/util/Tree"
import { BrowserWindow } from "../window/BrowserWindow";

const rootState:RootState = reactive({
    ref:undefined,
    system: {
        state:SystemStateEnum.close,
        apps:[],
        // 磁贴:magnet
        magnet:[],
        menulist:[],
        notify:[],
        windowTree:new Tree<BrowserWindow>(),
        windowOrder:Array<BrowserWindow>(),
        topWindow:undefined,
        winnum:0,
        info:{
            screenWidth:window?.innerWidth||0,
            screenHeight:window?.innerHeight||0,
            battery:{
                isCharging:false,
                chargeLevel:0
            }
        }
    }
})
function initRootState(options:SystemOptions):RootState{
    return rootState;
}
function useRootState():RootState{
    return rootState;
}
export {
    rootState,
    initRootState,
    useRootState
}