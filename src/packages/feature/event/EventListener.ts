import { useRootState } from "../state/Root";
import { mountEvent, redirectEvent, emitEvent } from "./EventHook";
import type { RootState } from "@/packages/type/type";
import {useSystem} from "@packages/feature/system"
function initEventListener() {
    mountEvent("system", (source: string, e: any) => {
        console.log(source);
    });
    let rootState = useRootState();
    mountEvent("system.initSize", (source: string, e: any) => {
        refreshDesktopSize(rootState)
    });
    mountEvent("system.shutdown", (source: string, e: any) => {
        useSystem()?.shutdown();
    });
    mountEvent("system.reboot", (source: string, e: any) => {
        useSystem()?.reboot();
    });
    window?.addEventListener("resize", () => {
        emitEvent("system.resize");
    });
    eventTransitCenter();
}
const eventTranslateMap: {
    [key: string]: string[]
} = {
    "taskbar.startmenu.leftClick": ["startmenu.changeVisible", "contextMenu.hidden"],
    "desktop.background.leftClick": ["startmenu.hidden", "contextMenu.hidden"],
    "desktop.background.rightClick": ["contextMenu.show", "startmenu.hidden"],
    "system.resize": ["system.initSize"],
    "system.open": ["system.initSize"],
    'window.menubar.rightclick': ['contextMenu.show'],
    "window.content.click": ["startmenu.hidden", "contextMenu.hidden"],
    "startMenu.close.click": ["contextMenu.show"],
    'startMenu.click': ['contextMenu.hidden'],
}
function eventTransitCenter() {
    for (let key in eventTranslateMap) {
        let targetArr = eventTranslateMap[key];
        for (let target of targetArr) {
            redirectEvent(key, target);
        }
    }
}
function refreshDesktopSize(rootState: RootState) {
    rootState.system.info.screenWidth = window?.innerWidth || 0;
    rootState.system.info.screenHeight = window?.innerHeight || 0;
}
export {
    initEventListener
}