import { System } from '@/packages/kernel';
import { initAppFileFromOption } from './initAppFileFromOption';
import { initBuiltinFileOpener } from './initBuiltinFileOpener';
import { initEventListener } from './initEventListener';
import { initPlugin } from './initPlugin';

export function initComputer(system: System) {
  initBuiltinFileOpener(system);
  initAppFileFromOption(system);
  initPlugin(system);
  initEventListener(system);
}
