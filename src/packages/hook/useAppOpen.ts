import { useRootState } from '@packages/feature/state/Root';
import { WinApp } from '@packages/type/type';
import { UnwrapNestedRefs } from 'vue';

function useAppOpen(type: "apps" | "magnet"| "menulist") {
    let rootState = useRootState();
    let appList = rootState.system[type];
    function openapp(item: UnwrapNestedRefs<WinApp>) {
        item.window?.show();
    }
    return {
        appList,
        openapp
    }
}
export {
    useAppOpen
}