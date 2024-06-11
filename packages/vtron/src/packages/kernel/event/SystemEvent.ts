import { mountEvent } from './EventHook';

import { useSystem } from '@/packages/kernel/system';
import { throttle } from '@/packages/util/debounce';
import { join } from '../../util/Path';

function initSizeEvent() {
  const sys = useSystem();
  const rootState = sys.stateManager;
  function refreshDesktopSize() {
    rootState.rect.setScreenSize(window?.innerWidth || 0, window?.innerHeight || 0);
  }
  mountEvent('system.initSize', () => {
    refreshDesktopSize();
  });
  window?.addEventListener('resize', () => {
    sys.emitEvent('system.resize');
  });

  mountEvent('system.mousemove', (_, events) => {
    const event = events[0];
    rootState.rect.setMousePosition(event?.clientX || 0, event?.clientY || 0);
    sys.rootRef?.style.setProperty('--mouseX', `${event?.clientX || 0}px`);
    sys.rootRef?.style.setProperty('--mouseY', `${event?.clientY || 0}px`);
  });
  window?.addEventListener(
    'mousemove',
    throttle((e) => {
      sys.emitEvent('system.mousemove', e);
    }, 100)
  );
}

function initBatteryEvent() {
  const rootState = useSystem().stateManager;
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
function initNetworkEvent() {
  const rootState = useSystem().stateManager;

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
async function initAlertEvent() {
  const sys = useSystem();

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
export { initAlertEvent, initBatteryEvent, initNetworkEvent, initSizeEvent };
