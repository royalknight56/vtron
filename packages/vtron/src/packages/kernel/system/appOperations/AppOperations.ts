import { System } from '@/packages/plug';
import { WinAppOptions } from '@/packages/type/type';
import { markRaw, nextTick } from 'vue';
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
        .then(async (res) => {
          if (res) {
            const list = res;
            let tempList = [];
            let sortMap = {} as Record<string, number>;
            const DsStoreIndex = list.findIndex((item) => item.name === '.DS_Store');

            try {
              if (DsStoreIndex !== -1) {
                const DsStore = await system.fs.readFile(list[DsStoreIndex].path);
                if (DsStore) {
                  sortMap = JSON.parse(DsStore).sortMap;
                }
              }
            } catch (error) {}
            for (let j = 0; j < list.length; j++) {
              const item = list[j];
              tempList.push(item);
            }
            if (sortMap) {
              tempList = tempList.sort((a, b) => {
                if (sortMap[a.name] && sortMap[b.name]) {
                  return sortMap[a.name] - sortMap[b.name];
                } else {
                  return 0;
                }
              });
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

  async setAppOrder(loc: 'Desktop' | 'Magnet' | 'Menulist', orders: { name: string; order: number }[]) {
    let sortMap = {} as Record<string, number>;
    const store = await this.system.fs.readFile(`${this.system._options.userLocation}${loc}/.DS_Store`);

    try {
      if (store) {
        sortMap = JSON.parse(store).sortMap;
      }
    } catch (e) {
      console.error('setAppOrder', e);
    }
    orders.forEach((item) => {
      sortMap[item.name + '.exe'] = item.order;
    });
    await this.system.fs.writeFile(
      `${this.system._options.userLocation}${loc}/.DS_Store`,
      JSON.stringify({ sortMap })
    );
    console.log('setAppOrder', store, sortMap);
    this.refershApp();
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
