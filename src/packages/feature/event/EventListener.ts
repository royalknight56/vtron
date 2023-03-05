
import { mountEvent, redirectEvent, emitEvent } from "./EventHook";

import { useSystem } from "@packages/feature/system"
import { initBatteryEvent, initSizeEvent, initNetworkEvent } from "./SystemEvent";
function initEventListener() {
    initBatteryEvent()
    initSizeEvent()
    initNetworkEvent()
    mountEvent("system.shutdown", (source: string, e: any) => {
        useSystem()?.shutdown();
    });
    mountEvent("system.reboot", (source: string, e: any) => {
        useSystem()?.reboot();
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
    'magnet.item.click': ['contextMenu.hidden', 'startmenu.hidden'],
    'menulist.item.click': ['contextMenu.hidden', 'startmenu.hidden'],
}
function eventTransitCenter() {
    for (let key in eventTranslateMap) {
        let targetArr = eventTranslateMap[key];
        for (let target of targetArr) {
            redirectEvent(key, target);
        }
    }
}
export {
    initEventListener
}