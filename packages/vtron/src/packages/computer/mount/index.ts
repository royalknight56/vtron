import { System } from '@/packages/kernel';
import { initAppFileFromOption } from './initAppFileFromOption';
import { initBuiltinFileOpener } from './initBuiltinFileOpener';

export function initComputer(system: System) {
  initBuiltinFileOpener(system);
  initAppFileFromOption(system);
}
