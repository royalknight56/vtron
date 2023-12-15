import { nextTick } from 'vue';
import { VtronFileWithoutContent } from '../feature/core/FileSystem';
import { useSystem } from '@feature/system';

let isReadyUpdateAppList = false;
function initAppList() {
  isReadyUpdateAppList = true;
  nextTick(() => {
    if (isReadyUpdateAppList) {
      isReadyUpdateAppList = false;
      refershAppList();
    }
  });
}
function refershAppList() {
  const APP_TYPE = ['apps', 'magnet', 'menulist'];
  const system = useSystem();
  for (let i = 0; i < APP_TYPE.length; i++) {
    const element = APP_TYPE[i];
    system?.fs
      .readdir(
        `${system._options.userLocation}${
          {
            apps: 'Desktop',
            magnet: 'Magnet',
            menulist: 'Menulist',
          }[element]
        }`
      )
      .then((res) => {
        if (res) {
          const list = res;
          const tempList = [];
          for (let j = 0; j < list.length; j++) {
            const item = list[j];

            tempList.push(item);
          }

          switch (element) {
            case 'apps':
              useSystem()._rootState.system.apps.splice(
                0,
                useSystem()._rootState.system.apps.length,
                ...tempList
              );
              break;
            case 'magnet':
              useSystem()._rootState.system.magnet.splice(
                0,
                useSystem()._rootState.system.magnet.length,
                ...tempList
              );
              break;
            case 'menulist':
              useSystem()._rootState.system.menulist.splice(
                0,
                useSystem()._rootState.system.menulist.length,
                ...tempList
              );
              break;
            default:
              break;
          }
        }
      });
  }
}
function useAppOpen(type: 'apps' | 'magnet' | 'menulist') {
  const rootState = useSystem()._rootState;
  const system = useSystem();
  const appList = rootState.system[type];
  function openapp(item: VtronFileWithoutContent) {
    system?.openFile(item.path);
  }
  return {
    appList,
    openapp,
  };
}
export { useAppOpen, initAppList };
