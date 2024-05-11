import { Menu } from '@/packages/services';
import { ref } from 'vue';

export class ContextMenuState {
  current = ref<Menu | null>(null);
  constructor() {}
  setContextMenu(menu: Menu | null) {
    this.current.value = menu;
  }
}
