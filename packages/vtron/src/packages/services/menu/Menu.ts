import { useSystem } from '../../kernel/system';
import { MenuItem, MenuItemConstructorOptions } from './MenuItem';
export class Menu {
  public static buildFromTemplate(template: Array<MenuItemConstructorOptions | MenuItem>) {
    const menu = new Menu();
    template.map((item) => {
      if (item instanceof MenuItem) {
        menu.append(item);
      } else {
        menu.append(new MenuItem(item));
      }
    });
    return menu;
  }
  _mouse: MouseEvent | null = null;
  items: MenuItem[] = [];
  popup: (e: MouseEvent) => void = (e) => {
    this._mouse = e;
    useSystem().stateManager.contextMenu.setContextMenu(this);
  };
  closePopup: () => void = () => {
    useSystem().stateManager.contextMenu.setContextMenu(null);
  };
  append: (item: MenuItem) => void = (item: MenuItem) => {
    this.items.push(item);
  };

  constructor() {
    //
  }
}
