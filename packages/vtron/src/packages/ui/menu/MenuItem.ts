export interface MenuItemConstructorOptions {
  label: string;
  submenu?: MenuItemConstructorOptions[];
  click?: () => void;
}
export class MenuItem {
  click?: () => void;
  label: string;
  submenu?: MenuItemConstructorOptions[];
  constructor({ label, click, submenu }: MenuItemConstructorOptions) {
    this.label = label;
    this.click = click;
    this.submenu = submenu;
  }
}
