import { VtronFileWithoutContent } from '../feature/core/FileSystem';
import { useSystem } from '@feature/system';
function useAppOpen(type: 'apps' | 'magnet' | 'menulist') {
  const rootState = useSystem()._rootState;
  const system = useSystem();
  const appList = rootState[type];
  function openapp(item: VtronFileWithoutContent) {
    system?.openFile(item.path);
  }
  return {
    appList,
    openapp,
  };
}
export { useAppOpen };
