import { System, VtronFileWithoutContent } from '@packages/kernel';
function useAppOpen(type: 'apps' | 'magnet' | 'menulist', sys: System) {
  const appList = sys.stateManager.appList.getAppList(type);

  function openapp(item: VtronFileWithoutContent) {
    sys?.openFile(item.path);
  }
  return {
    appList,
    openapp,
  };
}
export { useAppOpen };
