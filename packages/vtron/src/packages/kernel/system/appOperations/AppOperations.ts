import { System } from '@/packages/plug';
import { WinAppOptions } from '@/packages/type/type';
import { markRaw, nextTick } from 'vue';
import { initBuiltinApp } from './initBuiltinApp';

export class AppOperations {
  system: System;
  constructor(system: System) {
    this.system = system;
    this.system.fs.registerWatcher(new RegExp(`^${this.system._options.userLocation}`), () => {
      this.refershApp();
    });
  }

  private refershAppList() {
    const APP_TYPE = ['apps', 'magnet', 'menulist'];
    const system = this.system;
    for (let i = 0; i < APP_TYPE.length; i++) {
      const element = APP_TYPE[i];
      system?.fs
        .readdir(
          `${system._options.userLocation}${
            {
              apps: 'Desktop',
              magnet: 'Magnet',
              menulist: 'Menulist',
            }[element]
          }`
        )
        .then((res) => {
          if (res) {
            const list = res;
            const tempList = [];
            for (let j = 0; j < list.length; j++) {
              const item = list[j];

              tempList.push(item);
            }

            switch (element) {
              case 'apps':
                system.stateManager.appList.refreshAppList('apps', tempList);
                break;
              case 'magnet':
                system.stateManager.appList.refreshAppList('magnet', tempList);
                break;
              case 'menulist':
                system.stateManager.appList.refreshAppList('menulist', tempList);
                break;
              default:
                break;
            }
          }
        });
    }
  }

  isReadyUpdateAppList = false;
  refershApp() {
    this.isReadyUpdateAppList = true;
    nextTick(() => {
      if (this.isReadyUpdateAppList) {
        this.isReadyUpdateAppList = false;
        this.refershAppList();
      }
    });
  }

  initAppFileFromOption() {
    initBuiltinApp(this.system); // 初始化内建应用
    this.system.stateManager.options.getOptions('desktop')?.forEach((item) => {
      this.addApp(item);
    });
    this.system.stateManager.options.getOptions('magnet')?.forEach((item) => {
      this.addMagnet(item);
    });
    this.system.stateManager.options.getOptions('menulist')?.forEach((item) => {
      this.addMenuList(item);
    });
  }

  /**
   * @description: 添加应用
   * force 表示强制，在每次启动时都会添加
   */
  addApp(options: WinAppOptions, force = false) {
    this.addWindowSysLink('Desktop', options, force);
  }
  addMagnet(options: WinAppOptions, force = false) {
    this.addWindowSysLink('Magnet', options, force);
  }
  addMenuList(options: WinAppOptions, force = false) {
    this.addWindowSysLink('Menulist', options, force);
  }

  private addWindowSysLink(
    loc: 'Desktop' | 'Magnet' | 'Menulist' | 'Builtin',
    options: WinAppOptions,
    force = false
  ) {
    if (this.system.isFirstRun || force) {
      this.system.fs.writeFile(
        `${this.system._options.userLocation}${loc}/` + options.name + '.exe',
        `link::${loc}::${options.name}::${options.icon}`
      );
    } else {
      this.refershApp();
    }
    if (typeof options.window.content === 'string') {
      // TODO: 当content是string的时候
    } else {
      options.window.content = markRaw(options.window.content);
    }
    this.system.stateManager.windowMap.set(loc, options.name, options);
  }
}
