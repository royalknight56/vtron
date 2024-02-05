import { ScreenComponentVue } from '@packages/ui';
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
export { BrowserWindow } from '@/packages/ui/window/BrowserWindow';
export { Notify } from '@/packages/ui/notification/Notification';
export { Dialog } from '@/packages/ui/dialog/Dialog';
export type { SystemOptions, WinApp } from '@packages/type/type';
export { vDragable } from '@/packages/ui/window/MakeDragable';
export type { ShellInterface } from '@/packages/kernel/shell/ShellType';
export type { VtronFileInterface } from '@/packages/kernel/file/FIleInterface';
export { i18n } from '@/packages/ui/i18n';
export { Tray } from '@/packages/ui/tray/Tary';
export { dealIcon } from '@packages/util/Icon';
export { Menu } from '@/packages/ui/menu/Menu';
export { MenuItem } from '@/packages/ui/menu/MenuItem';
