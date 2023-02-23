import { mountEvent } from "./EventHook";

function initEventListener() {
    mountEvent("system", (source:string,e:any) => {
        console.log("system",source,e);
    });
}
export {
    initEventListener
}