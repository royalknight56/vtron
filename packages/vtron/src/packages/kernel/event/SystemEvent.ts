import { RootState } from '@packages/kernel';
import { emitEvent, mountEvent } from './EventHook';

import { useSystem } from '@/packages/kernel/system';
import { throttle } from '@/packages/util/debounce';
import { join } from '../file/Path';

function initSizeEvent() {
  const rootState = useSystem()._rootState;
  function refreshDesktopSize(rootState: RootState) {
    rootState.info.screenWidth = window?.innerWidth || 0;
    rootState.info.screenHeight = window?.innerHeight || 0;
  }
  mountEvent('system.initSize', () => {
    refreshDesktopSize(rootState);
  });
  window?.addEventListener('resize', () => {
    emitEvent('system.resize');
  });

  mountEvent('system.mousemove', (_, events) => {
    const event = events[0];
    rootState.info.mouseX = event?.clientX || 0;
    rootState.info.mouseY = event?.clientY || 0;
    useSystem().rootRef?.style.setProperty('--mouseX', `${event?.clientX || 0}px`);
    useSystem().rootRef?.style.setProperty('--mouseY', `${event?.clientY || 0}px`);
  });
  window?.addEventListener(
    'mousemove',
    throttle((e) => {
      emitEvent('system.mousemove', e);
    }, 100)
  );
}

function initBatteryEvent() {
  const rootState = useSystem()._rootState;
  const nav = navigator as any;
  if (!nav || !nav.connection) {
    return;
  }

  nav
    .getBattery?.()
    .then((battery: any) => {
      rootState.info.battery.isCharging = battery.charging;
      rootState.info.battery.chargeLevel = battery.level;
      battery.onchargingchange = () => {
        rootState.info.battery.isCharging = battery.charging;
        rootState.info.battery.chargeLevel = battery.level;
      };
    })
    .catch(() => {
      rootState.info.battery.isCharging = false;
      rootState.info.battery.chargeLevel = 0;
    });
}
function initNetworkEvent() {
  const rootState = useSystem()._rootState;

  const nav = navigator as any;
  if (!nav || !nav.connection) {
    return;
  }

  const connection = nav.connection as any;
  rootState.info.connection = connection;
  connection.addEventListener('change', () => {
    rootState.info.connection = connection;
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
    join(sys._rootState.options.userLocation || '', '/Schedule', fileName)
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
