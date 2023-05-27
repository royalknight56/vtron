import { useRootState } from '@packages/feature/state/Root';
import { WinApp } from '@packages/type/type';
import { nextTick, UnwrapNestedRefs } from 'vue';
import { useSystem } from '../plug';
import { VtronFileInfo,VtronFile } from '../feature/core/fileSystem';
let isReadyUpdateAppList = false;
function initAppList() {

    isReadyUpdateAppList = true;
    nextTick(() => {
        if (isReadyUpdateAppList) {
            isReadyUpdateAppList = false;
            refershAppList();
        }
    })
}
function refershAppList() {
    const APP_TYPE = ['apps', 'magnet', 'menulist']
    let system = useSystem();
    for (let i = 0; i < APP_TYPE.length; i++) {
        const element = APP_TYPE[i];
        system?.fs.readdir(`/C/Users/${{
            apps: 'Desktop',
            magnet: 'Magnet',
            menulist: 'Menulist'
        }[element]}`).then((res) => {
            if (res) {
                let list = res;
                let tempList = [];
                for (let j = 0; j < list.length; j++) {
                    const item = list[j];

                    tempList.push(item);
                }

                switch (element) {
                    case 'apps':
                        useRootState().system.apps.splice(0, useRootState().system.apps.length, ...tempList);
                        break;
                    case 'magnet':
                        useRootState().system.magnet.splice(0, useRootState().system.magnet.length, ...tempList);
                        break;
                    case 'menulist':
                        useRootState().system.menulist.splice(0, useRootState().system.menulist.length, ...tempList);
                        break;
                    default:
                        break;
                }
            }
        })
    }

}
function useAppOpen(type: "apps" | "magnet" | "menulist") {
    let rootState = useRootState();
    let system = useSystem();
    let appList = rootState.system[type];
    function openapp(item: VtronFile) {
        system?.openFile(item.path);
    }
    return {
        appList,
        openapp
    }
}
export {
    useAppOpen,
    initAppList
}