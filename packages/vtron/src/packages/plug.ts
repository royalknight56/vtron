import { ScreenComponentVue } from '@packages/ui';
import WinButtonVue from './components/WinButton.vue';
import WinCheckBox from './components/WinCheckBox.vue';
import WinInput from './components/WinInput.vue';
import WinLoadingVue from './components/WinLoading.vue';
import WinLogoVue from './components/WinLogo.vue';
import WinProcess from './components/WinProcess.vue';
import WinSelect from './components/WinSelect.vue';
import WinUpButtonGroupVue from './components/WinUpButtonGroup.vue';

export {
  WinButtonVue,
  WinCheckBox,
  WinInput,
  WinLoadingVue,
  WinLogoVue,
  WinProcess,
  WinSelect,
  WinUpButtonGroupVue,
};

const plug = {
  install: function (app: any): any {
    app.component('VtronScreen', ScreenComponentVue);
  },
};
export default plug;
export type { VtronFileInterface } from '@/packages/kernel/file/FIleInterface';
export * from '@/packages/kernel/file/FileSystem';
export * from '@/packages/kernel/file/Path';
export * from '@/packages/kernel/shell/Shell';
export type { ShellInterface } from '@/packages/kernel/shell/ShellType';
export { System, useSystem } from '@/packages/kernel/system';
export { Notify } from '@/packages/services/notification/Notification';
export { i18n } from '@/packages/ui/i18n';

export { Dialog, Tray, Menu, MenuItem } from '@/packages/services';
export { BrowserWindow } from '@/packages/ui/window/BrowserWindow';
export { vDragable } from '@/packages/ui/window/MakeDragable';
export type { SystemOptions, WinApp } from '@packages/type/type';
export { dealIcon } from '@packages/util/Icon';
