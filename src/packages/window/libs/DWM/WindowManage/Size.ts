
import { System } from '@libs/System';
function maxWindow(system: System, id: string) {
    system.getWindow(id).windowInfo.isMaximize = !system.getWindow(id).windowInfo.isMaximize
}
export {
    maxWindow
}