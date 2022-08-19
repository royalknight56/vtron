import { System } from '@libs/System';
function addEventListener(system:System,id: string, name: string, func: Function) {
  system.State.windowInfoMap[id].windowEventMap[name] = func
}
export {
  addEventListener
}