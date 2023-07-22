import { mountEvent, redirectEvent, emitEvent } from './EventHook';
import type { RootState } from '@packages/type/type';
import { useRootState } from '../state/Root';

function initSizeEvent() {
  let rootState = useRootState();
  function refreshDesktopSize(rootState: RootState) {
    rootState.system.info.screenWidth = window?.innerWidth || 0;
    rootState.system.info.screenHeight = window?.innerHeight || 0;
  }
  mountEvent('system.initSize', (source: string, e: any) => {
    refreshDesktopSize(rootState);
  });
  window?.addEventListener('resize', () => {
    emitEvent('system.resize');
  });
}

function initBatteryEvent() {
  let rootState = useRootState();
  let nav = navigator as any;
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
  let rootState = useRootState();

  let nav = navigator as any;
  if (!nav || !nav.connection) {
    return;
  }

  let connection = nav.connection as any;
  rootState.system.info.connection = connection.rtt;

  connection.addEventListener('change', () => {
    rootState.system.info.connection = connection.rtt;
  });
}

export { initSizeEvent, initBatteryEvent, initNetworkEvent };
