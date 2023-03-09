import { useRootState } from '@packages/feature/state/Root';
import { WinApp } from '@packages/type/type';
import { UnwrapNestedRefs } from 'vue';
import { useSystem } from '../plug';
function initAppList() {
    const APP_TYPE = ['apps', 'magnet', 'menulist']
    let system = useSystem();
    for (let i = 0; i < APP_TYPE.length; i++) {
        const element = APP_TYPE[i];
        system?.fs.readDirectory(`/C/Users/${{
            apps: 'Desktop',
            magnet: 'Magnet',
            menulist: 'Menulist'
        }[element]}`).then((res) => {
            if (res) {
                let list = res;
                console.log(list);
                let tempList = [];
                for (let j = 0; j < list.length; j++) {
                    const item = list[j];
                    if (item.type === 'link') {
                        let app: WinApp = {
                            name: item.name,
                            icon: item.icon,
                        }
                        tempList.push(app);
                    }
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
    function openapp(item: UnwrapNestedRefs<WinApp>) {
        system?.openFile(`/C/Users/${{
            apps: 'Desktop',
            magnet: 'Magnet',
            menulist: 'Menulist'
        }[type]}/${item.name}`);
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