import { System } from '@libs/System';
function addEventListener(system:System,id: string, name: string, func: Function) {
  system.DWM.getWindow(id).windowInfo.windowEventMap[name] = func
}

function on(system:System,ev: string, func: Function) {
  system.State.eventMap[ev] = func
}
function emit(system:System,ev: string, ...args: any) {
  system.State.eventMap[ev]?.(...args)
}
export {
  addEventListener,
  on,
  emit
}