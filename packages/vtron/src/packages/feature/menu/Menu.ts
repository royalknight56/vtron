// main
// ipcMain.on('show-context-menu', (event) => {
//     const template = [
//       {
//         label: 'Menu Item 1',
//         click: () => { event.sender.send('context-menu-command', 'menu-item-1') }
//       },
//       { type: 'separator' },
//       { label: 'Menu Item 2', type: 'checkbox', checked: true }
//     ]
//     const menu = Menu.buildFromTemplate(template)
//     menu.popup({ window: BrowserWindow.fromWebContents(event.sender) })

//   })

import { useSystem } from '../system';
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
  }
  items: MenuItem[] = [];
  popup: (e: MouseEvent) => void = () => {
    console.log('popup');
    useSystem();
  };
  closePopup: () => void = () => {
    console.log('closePopup');
  };
  append: (item: MenuItem) => void = (item: MenuItem) => {
    this.items.push(item);
  };

  constructor() {
    throw new Error('Method not implemented.');
  }
}
