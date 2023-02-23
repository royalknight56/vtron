import { Eventer } from "./Eventer";
const eventer = new Eventer();
function initEventer() {
    return eventer;
}
function useEventer() {
    return eventer;
}
function emitEvent(event: string, data?: any) {
    let eventArray = event.split(".");
    eventArray.unshift("system")
    eventArray.forEach((item, index) => {
        let tempEvent = eventArray.slice(0, index + 1).join(".");
        eventer.emit(tempEvent,event,data);
    });
}
function mountEvent(event: string, callback: Function) {
    return eventer.on(event, callback);
}
export {
    Eventer,
    initEventer,
    useEventer,
    emitEvent,
    mountEvent
}