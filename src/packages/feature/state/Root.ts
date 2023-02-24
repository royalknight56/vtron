import { SystemStateEnum } from "@/packages/type/enum";
// import { RootState, SystemOptions } from "@/packages/type/type";
import { reactive, ref, UnwrapNestedRefs, watch } from "vue";

const rootState:UnwrapNestedRefs<RootState> = reactive({
    system: {
        state:SystemStateEnum.close,
        apps:[],
        windowInfoMap:{},
        zIndexIdArray:[],
        winnum:0
    }
})
function initRootState(options:SystemOptions){
    return rootState;
}
function useRootState(){
    return rootState;
}
export {
    rootState,
    initRootState,
    useRootState
}