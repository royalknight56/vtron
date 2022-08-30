import {System} from '@libs/System'
function initResizeListener(system:System){
    if(!document){
        return
    }
    let $sys = document.getElementById(system.id);
    system.State.sysInfo.width = $sys?.clientWidth||0
    system.State.sysInfo.height = $sys?.clientHeight||0
    window?.addEventListener("resize",()=>{
        system.State.sysInfo.width = $sys?.clientWidth||0
        system.State.sysInfo.height = $sys?.clientHeight||0
    })
}
export {
    initResizeListener
}