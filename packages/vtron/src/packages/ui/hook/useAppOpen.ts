import { useSystem, VtronFileWithoutContent } from '@packages/kernel';
function useAppOpen(type: 'apps' | 'magnet' | 'menulist') {
  const system = useSystem();
  const appList = system.stateManager.appList.getAppList(type);

  function openapp(item: VtronFileWithoutContent) {
    system?.openFile(item.path);
  }
  return {
    appList,
    openapp,
  };
}
export { useAppOpen };
