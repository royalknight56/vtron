import { mountEvent, redirectEvent, emitEvent } from './EventHook';

import { useSystem } from '@feature/system';
import { initBatteryEvent, initSizeEvent, initNetworkEvent } from './SystemEvent';
function initEventListener() {
  initBatteryEvent();
  initSizeEvent();
  initNetworkEvent();
  mountEvent('system.shutdown', (source: string, e: any) => {
    useSystem()?.shutdown();
  });
  mountEvent('system.recover', (source: string, e: any) => {
    useSystem()?.recover();
  });
  eventTransitCenter();
}
const eventTranslateMap: {
  [key: string]: string[];
} = {
  'taskbar.startmenu.leftClick': ['startmenu.changeVisible', 'contextMenu.hidden'],
  'desktop.background.leftClick': ['uipop.hidden'],
  'desktop.background.rightClick': ['contextMenu.show', 'startmenu.hidden'],
  'system.resize': ['system.initSize'],
  'system.open': ['system.initSize'],
  'window.menubar.rightclick': ['contextMenu.show'],
  'window.content.click': ['uipop.hidden'],
  'startMenu.close.click': ['contextMenu.show'],
  'startMenu.click': ['contextMenu.hidden'],
  'magnet.item.click': ['uipop.hidden'],
  'menulist.item.click': ['uipop.hidden'],
  'startMenu.set.click': ['uipop.hidden'],
  'uipop.hidden': ['contextMenu.hidden', 'startmenu.hidden', 'datetime.hidden'],
};
function eventTransitCenter() {
  for (const key in eventTranslateMap) {
    const targetArr = eventTranslateMap[key];
    for (const target of targetArr) {
      redirectEvent(key, target);
    }
  }
}
export { initEventListener };
