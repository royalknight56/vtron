import { System } from '@libs/System';

function upSetWindowIndex(system:System,id: string): number {
  for (let key in system.State.windowInfoMap) {
      system.State.windowInfoMap[key].windowInfo.istop = false
  }
  system.getWindow(id).windowInfo.istop = true

  let ind = system.State.zIndexIdArray.indexOf(id);
  system.State.zIndexIdArray.splice(ind, 1);
  system.State.zIndexIdArray.push(id);
  for (let i = 0; i < system.State.zIndexIdArray.length; i++) {
      system.State.windowInfoMap[system.State.zIndexIdArray[i]].windowInfo.zindex = i + 10
  }
  return system.State.zIndexIdArray.length
}
function hideWindow(system:System,id: string) {
  system.getWindow(id).windowInfo.isVisible = false
}
function showWindow(system:System,id: string) {
  system.getWindow(id).windowInfo.isVisible = true
}
function createWindow(system:System,id: string) {
  system.getWindow(id).windowInfo.isCreate = true
}
function destroyWindow(system:System,id: string) {

  system.getWindow(id).windowInfo.isCreate = false
  system.getWindow(id).windowInfo.windowEventMap['destroy']?.()

}
export {
  upSetWindowIndex,
  hideWindow,
  showWindow,
  createWindow,
  destroyWindow,
}