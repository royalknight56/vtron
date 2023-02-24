import { mountEvent,redirectEvent } from "./EventHook";

function initEventListener() {
    mountEvent("system", (source:string,e:any) => {

    });
    redirectEvent("taskbar.startmenu.leftClick","startmenu.changeVisible");
    redirectEvent("desktop.background.leftClick","startmenu.hidden");
    // mountEvent("taskbar.startmenu.leftClick", (source:string,e:any) => {

    // });
}
export {
    initEventListener
}