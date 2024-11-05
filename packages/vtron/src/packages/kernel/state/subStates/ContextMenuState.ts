import { Menu } from '@/packages/services';
import { Ref, ref } from 'vue';

export class ContextMenuState {
  public readonly current: Ref<Menu | null> = ref<Menu | null>(null);
  constructor() {}
  setContextMenu(menu: Menu | null) {
    this.current.value = menu;
  }
}
