import { mountEvent, emitEvent } from './EventHook';
import type { RootState } from '@packages/type/type';
import { useRootState } from '../state/Root';
import { useSystem } from '../system';
import { join } from '../core/Path';

function initSizeEvent() {
  const rootState = useRootState();
  function refreshDesktopSize(rootState: RootState) {
    rootState.system.info.screenWidth = window?.innerWidth || 0;
    rootState.system.info.screenHeight = window?.innerHeight || 0;
  }
  mountEvent('system.initSize', () => {
    refreshDesktopSize(rootState);
  });
  window?.addEventListener('resize', () => {
    emitEvent('system.resize');
  });
}

function initBatteryEvent() {
  const rootState = useRootState();
  const nav = navigator as any;
  if (!nav || !nav.connection) {
    return;
  }

  nav
    .getBattery?.()
    .then((battery: any) => {
      rootState.system.info.battery.isCharging = battery.charging;
      rootState.system.info.battery.chargeLevel = battery.level;
      battery.onchargingchange = () => {
        rootState.system.info.battery.isCharging = battery.charging;
        rootState.system.info.battery.chargeLevel = battery.level;
      };
    })
    .catch(() => {
      rootState.system.info.battery.isCharging = false;
      rootState.system.info.battery.chargeLevel = 0;
    });
}
function initNetworkEvent() {
  const rootState = useRootState();

  const nav = navigator as any;
  if (!nav || !nav.connection) {
    return;
  }

  const connection = nav.connection as any;
  rootState.system.info.connection = connection;
  connection.addEventListener('change', () => {
    rootState.system.info.connection = connection;
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
    join(sys._rootState.system.options.userLocation || '', '/Schedule', fileName)
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
export { initSizeEvent, initBatteryEvent, initNetworkEvent, initAlertEvent };
