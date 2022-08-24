
import { System } from '@libs/System';
function maxWindow(system: System, id: string) {
    system.DWM.getWindow(id).windowInfo.isMaximize = !system.DWM.getWindow(id).windowInfo.isMaximize
}
export {
    maxWindow
}