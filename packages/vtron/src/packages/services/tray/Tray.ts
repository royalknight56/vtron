import { System } from '@/packages/kernel';
import { Menu } from '@/packages/services';
import { defineComponent, markRaw } from 'vue';

export interface TrayOptions {
  image: string | ReturnType<typeof defineComponent>;
}
export class Tray {
  image: string | ReturnType<typeof defineComponent>;
  _id: string;
  _contextMenu: ReturnType<typeof defineComponent> | Menu;
  _contextMenuShow = false;
  _contextMenuWidth = 100;
  _contextMenuHeight = 100;
  // public static trayList: Ref<Tray[]> = ref<Tray[]>([]);
  public static system: System;
  constructor(options: TrayOptions) {
    const rootState = Tray.system.stateManager;
    if (typeof options.image === 'string') {
      this.image = options.image;
    } else {
      this.image = markRaw(options.image);
    }
    rootState.trayState.push(this);
    this._id = rootState.trayState.current.length.toString();
    // Tray.trayList.value.push(this);
    // this._id = Tray.trayList.value.length.toString();
  }
  setContextMenu(content: ReturnType<typeof defineComponent> | Menu, width = 100, height = 100) {
    this._contextMenu = markRaw(content);
    this._contextMenuWidth = width;
    this._contextMenuHeight = height;
  }
  setImage(image: string | ReturnType<typeof defineComponent>) {
    if (typeof image === 'string') {
      this.image = image;
    } else {
      this.image = markRaw(image);
    }
    // Tray.system.stateManager.trayState.current = Tray.system.stateManager.trayState.current.slice();
    // Tray.trayList.value = Tray.trayList.value.slice();
  }
  destroy() {
    const rootState = Tray.system.stateManager;
    const index = rootState.trayState.current.findIndex((item) => item._id === this._id);
    if (index !== -1) {
      rootState.trayState.current.splice(index, 1);
    }
  }
}
