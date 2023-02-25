import { SystemStateEnum } from "@/packages/type/enum";
import { RootState, SystemOptions } from "@/packages/type/type";
import { reactive, ref, UnwrapNestedRefs, watch } from "vue";
import { Tree } from "@packages/util/Tree"
import { BrowserWindow } from "../window/BrowserWindow";

const rootState:RootState = reactive({
    system: {
        state:SystemStateEnum.close,
        apps:[],
        windowTree:new Tree<BrowserWindow>(),
        winnum:0
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