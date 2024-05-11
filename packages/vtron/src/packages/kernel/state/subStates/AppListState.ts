import { VtronFileWithoutContent } from '@/packages/plug';
import { reactive } from 'vue';

export class AppListState {
  apps: VtronFileWithoutContent[] = reactive([]);
  magnet: VtronFileWithoutContent[] = reactive([]);
  menulist: VtronFileWithoutContent[] = reactive([]);
  constructor() {}

  getAppList(type: 'apps' | 'magnet' | 'menulist') {
    return this[type];
  }
  refreshAppList(type: 'apps' | 'magnet' | 'menulist', list: VtronFileWithoutContent[]) {
    this[type].splice(0, this[type].length, ...list);
  }
}
