import { ScreenComponentVue } from '@packages/sys';
import WinButtonVue from './components/WinButton.vue';
import WinLoadingVue from './components/WinLoading.vue';
import WinLogoVue from './components/WinLogo.vue';
import WinSelect from './components/WinSelect.vue';
import WinInput from './components/WinInput.vue';
import WinProcess from './components/WinProcess.vue';
import WinCheckBox from './components/WinCheckBox.vue';
import WinUpButtonGroupVue from './components/WinUpButtonGroup.vue';

export {
  WinButtonVue,
  WinLoadingVue,
  WinLogoVue,
  WinSelect,
  WinInput,
  WinProcess,
  WinCheckBox,
  WinUpButtonGroupVue,
};

const plug = {
  install: function (app: any): any {
    app.component('Screen', ScreenComponentVue);
  },
};
export default plug;
export * from '@/packages/kernel/shell/Shell';
export * from '@/packages/kernel/file/Path';
export * from '@/packages/kernel/file/FileSystem';
export { System, useSystem } from '@/packages/system/index';
export { BrowserWindow } from '@/packages/sys/window/BrowserWindow';
export { Notify } from '@/packages/sys/notification/Notification';
export { Dialog } from '@/packages/sys/dialog/Dialog';
export type { SystemOptions, WinApp } from '@packages/type/type';
export { vDragable } from '@/packages/sys/window/MakeDragable';
export type { ShellInterface } from '@/packages/kernel/shell/ShellType';
export type { VtronFileInterface } from '@/packages/kernel/file/FIleInterface';
export { i18n } from '@/packages/sys/i18n';
export { Tray } from '@/packages/sys/tray/Tary';
export { dealIcon } from '@packages/util/Icon';
export { Menu } from '@/packages/sys/menu/Menu';
export { MenuItem } from '@/packages/sys/menu/MenuItem';
