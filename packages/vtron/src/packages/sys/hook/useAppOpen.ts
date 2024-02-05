import { useSystem, VtronFileWithoutContent } from '@packages/kernel';
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
