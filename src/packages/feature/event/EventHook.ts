import { Eventer } from "./Eventer";
const eventer = new Eventer();
function initEventer() {
    return eventer;
}
function useEventer() {
    return eventer;
}
function emitEvent(event: string, data?: any) {
    return eventer.emit(event, data);
}
export {
    Eventer,
    initEventer,
    useEventer,
    emitEvent
}