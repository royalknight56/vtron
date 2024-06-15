import { System } from '@/packages/kernel';
import { throttle } from '@/packages/util/debounce';
import { join } from '../../util/Path';

function initSizeEvent(system: System) {
  const rootState = system.stateManager;
  function refreshDesktopSize() {
    rootState.rect.setScreenSize(window?.innerWidth || 0, window?.innerHeight || 0);
  }
  system.mountEvent('system.initSize', () => {
    refreshDesktopSize();
  });
  window?.addEventListener('resize', () => {
    system.emitEvent('system.resize');
  });

  system.mountEvent('system.mousemove', (_, events) => {
    const event = events[0];
    rootState.rect.setMousePosition(event?.clientX || 0, event?.clientY || 0);
    system.rootRef?.style.setProperty('--mouseX', `${event?.clientX || 0}px`);
    system.rootRef?.style.setProperty('--mouseY', `${event?.clientY || 0}px`);
  });
  window?.addEventListener(
    'mousemove',
    throttle((e) => {
      system.emitEvent('system.mousemove', e);
    }, 100)
  );
}

function initBatteryEvent(system: System) {
  const rootState = system.stateManager;
  const nav = navigator as any;
  if (!nav || !nav.connection) {
    return;
  }

  nav
    .getBattery?.()
    .then((battery: any) => {
      rootState.navigator.setBattery(battery.charging, battery.level);
      battery.onchargingchange = () => {
        rootState.navigator.setBattery(battery.charging, battery.level);
      };
    })
    .catch(() => {
      rootState.navigator.setBattery(false, 0);
    });
}
function initNetworkEvent(system: System) {
  const rootState = system.stateManager;

  const nav = navigator as any;
  if (!nav || !nav.connection) {
    return;
  }

  const connection = nav.connection as any;
  rootState.navigator.setConnection(connection);
  connection.addEventListener('change', () => {
    rootState.navigator.setConnection(connection);
  });
}
function setAlertTask(time: number, callback: any) {
  const date = new Date(); //现在时刻
  const dateIntegralPoint = new Date(time);

  setTimeout(() => {
    callback();
  }, dateIntegralPoint.getTime() - date.getTime()); //用户登录后的下一个整点执行。
}
export async function initAlertEvent(system: System) {
  const sys = system;

  const chosenDay = new Date();
  const fileName = `${chosenDay.getFullYear()}-${chosenDay.getMonth() + 1}-${chosenDay.getDate()}.json`;
  const alredyNotes = await sys.fs.readFile(
    join(sys.stateManager.options.getOptions('userLocation') || '', '/Schedule', fileName)
  );
  if (alredyNotes) {
    const alertList = JSON.parse(alredyNotes);
    alertList.forEach((item: any) => {
      if (item.time < Date.now()) return;
      setAlertTask(item.time, () => {
        sys.createNotify({
          title: '日程提醒',
          content: `今日${new Date(item.time).getHours()}时${new Date(item.time).getMinutes()}分 的提醒： ${
            item.text
          }`,
        });
      });
    });
  }
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
    'messagecenter.hidden',
    'edit.end',
    'computerpop.hidden',
    'tray.hidden',
  ],
  'tray.show': ['messagecenter.hidden'],
  'messagecenter.show': ['tray.hidden'],
};

function redirectEvent(system: System, source: string, target: string) {
  system.mountEvent(source, (source: string, data: any) => {
    system.emitEvent(target, data);
  });
}

function eventTransitCenter(system: System) {
  for (const key in eventTranslateMap) {
    const targetArr = eventTranslateMap[key];
    for (const target of targetArr) {
      redirectEvent(system, key, target);
    }
  }
}
export function initEventListener(system: System) {
  initBatteryEvent(system);
  initSizeEvent(system);
  initNetworkEvent(system);
  initAlertEvent(system);
  system.mountEvent('system.shutdown', () => {
    system?.shutdown();
  });
  system.mountEvent('system.recover', () => {
    system?.recover();
  });
  eventTransitCenter(system);
}
