import type { App } from 'vue';
import { ScreenComponentVue } from '@feature/screen/Screen';
// import { Plugin } from 'vue'
import WinButtonVue from './components/WinButton.vue';
import WinLoadingVue from './components/WinLoading.vue';
import WinLogoVue from './components/WinLogo.vue';
import WinSelect from './components/WinSelect.vue';
import WinInput from './components/WinInput.vue';

export { WinButtonVue, WinLoadingVue, WinLogoVue, WinSelect, WinInput };

const plug = {
  install: function (app: any, ...options: any[]): any {
    app.component('Screen', ScreenComponentVue);
  },
};
export default plug;
export * from '@feature/core/Shell';
export * from '@feature/core/Path';
export { VtronFile } from '@feature/core/fileSystem';
export { System, useSystem } from '@feature/system/index';
export { BrowserWindow } from '@feature/window/BrowserWindow';
export { Notify } from '@feature/notification/Notification';
export { Dialog } from '@feature/dialog/Dialog';
export type { RootState, SystemOptions, WinApp } from '@packages/type/type';
export { makeDragable } from './feature/window/MakeDragable';
