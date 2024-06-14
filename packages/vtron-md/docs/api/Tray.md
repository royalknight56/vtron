# Tray

Tray 指代 系统托盘图标

usage:

```ts
import { Tray } from 'vtron';
import { BatteryVue } from './path/to/BatteryVue.vue';
import { BatteryPopVue } from './path/to/BatteryPopVue.vue';

const batteryTray = new Tray({
  image: BatteryVue,
});
batteryTray.setContextMenu(BatteryPopVue, 200, 80);
```

### image

image 可以是一个图片路径，也可以是一个 Vue 组件

### setContextMenu

设置右键菜单

```ts
tray.setContextMenu(BatteryPopVue, 200, 80);
```

- BatteryPopVue: 右键菜单的 Vue 组件

- 200: 右键菜单的宽度

- 80: 右键菜单的高度

setContextMenu 也可以传入 Menu 创建出的右键菜单

### destroy

销毁

```ts
tray.destroy();
```
