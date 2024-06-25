# Menu

Menu 类可以创建右键菜单

## usage:

```ts
import { Menu } from 'vtron';
const menu = Menu.buildFromTemplate([
  {
    label: '测试',
    click: () => {
      console.log('测试');
    },
  },
]);

addEventListener('contextmenu', (e) => {
  e.preventDefault();
  menu.popup(e);
});
```

menu无法通过构造函数中传入参数创建，只能通过 Menu.buildFromTemplate 创建

创建之后，可以直接调用 menu.popup() 来显示右键菜单，也可以传入到Tray中，作为系统托盘图标的右键菜单

popup 中需要传入鼠标事件

## public static buildFromTemplate

```ts
Menu.buildFromTemplate([
  {
    label: '测试',
    click: () => {
      console.log('测试');
    },
  },
]);
```

参数：

```ts
 public static buildFromTemplate(template: Array<MenuItemConstructorOptions | MenuItem>):Menu
```

参数可以是一个 MenuItemConstructorOptions 数组，也可以是一个 MenuItem 数组

MenuItemConstructorOptions就是MenuItem的构造函数参数

## popup

```ts
popup: (e: MouseEvent) => void
```

usage:

```ts
menu.popup(e);
```

需要传入鼠标事件

会显示在鼠标位置

## closePopup

```ts
closePopup: () => void
```

通过js，手动关闭右键菜单

## append

```ts
append: (menuItem: MenuItem) => void
```

通过js，手动在右键菜单中添加一个菜单项

## MenuItem

MenuItem 是一个类，可以通过构造函数创建，每一个 MenuItem 对应右键菜单中的一个菜单项

```ts
export class MenuItem {
  click?: () => void;
  label: string;
  submenu?: MenuItemConstructorOptions[];
  constructor({ label, click, submenu }: MenuItemConstructorOptions) {}
}
```

## MenuItemConstructorOptions

MenuItemConstructorOptions 可以通过构造函数创建 MenuItem的对象

```ts
export interface MenuItemConstructorOptions {
  label: string;
  submenu?: MenuItemConstructorOptions[];
  click?: () => void;
}
```

label是菜单项的名称

click是点击菜单项的回调函数

submenu是子菜单项，是一个MenuItemConstructorOptions数组
