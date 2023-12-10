import { mountEvent, redirectEvent } from './EventHook';

import { useSystem } from '@feature/system';
import { initBatteryEvent, initSizeEvent, initNetworkEvent, initAlertEvent } from './SystemEvent';
function initEventListener() {
  initBatteryEvent();
  initSizeEvent();
  initNetworkEvent();
  initAlertEvent();
  mountEvent('system.shutdown', () => {
    useSystem()?.shutdown();
  });
  mountEvent('system.recover', () => {
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
  'desktop.app.open': ['uipop.hidden'],
  'system.resize': ['system.initSize'],
  'system.open': ['system.initSize'],
  'window.menubar.rightclick': ['contextMenu.show'],
  'window.content.click': ['uipop.hidden'],
  'startMenu.close.click': ['contextMenu.show'],
  'startMenu.click': ['contextMenu.hidden'],
  'magnet.item.click': ['uipop.hidden'],
  'menulist.item.click': ['uipop.hidden'],
  'startMenu.set.click': ['uipop.hidden'],
  'mycomputer.click': ['uipop.hidden'],
  'uipop.hidden': [
    'contextMenu.hidden',
    'startmenu.hidden',
    'datetime.hidden',
    'messagecenter.hidden',
    'edit.end',
    'computerpop.hidden',
    'tray.hidden',
  ],
  'datetime.show': ['messagecenter.hidden'],
  'messagecenter.show': ['datetime.hidden'],
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
