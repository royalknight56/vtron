import { ScreenComponentVue } from '@feature/structure';
import WinButtonVue from './components/WinButton.vue';
import WinLoadingVue from './components/WinLoading.vue';
import WinLogoVue from './components/WinLogo.vue';
import WinSelect from './components/WinSelect.vue';
import WinInput from './components/WinInput.vue';
import WinUpButtonGroupVue from './components/WinUpButtonGroup.vue';

export { WinButtonVue, WinLoadingVue, WinLogoVue, WinSelect, WinInput, WinUpButtonGroupVue };

const plug = {
  install: function (app: any): any {
    app.component('Screen', ScreenComponentVue);
  },
};
export default plug;
export * from '@feature/core/Shell';
export * from '@feature/core/Path';
export * from '@/packages/feature/core/FileSystem';
export { System, useSystem } from '@feature/system/index';
export { BrowserWindow } from '@feature/window/BrowserWindow';
export { Notify } from '@feature/notification/Notification';
export { Dialog } from '@feature/dialog/Dialog';
export type { RootState, SystemOptions, WinApp } from '@packages/type/type';
export { vDragable } from '@feature/window/MakeDragable';
export type { ShellInterface } from '@feature/core/ShellType';
export type { VtronFileInterface } from '@feature/core/FIleInterface';
