import vtronStoreLogoIcon from '@/assets/vtron-stroe-icon-nobg.png?url';
import myComputerLogoIcon from '@packages/assets/computer.png?url';
import unknownIcon from '@packages/assets/unknown.png';
import imageicon from '@packages/assets/image.png';
import settingicon from '@packages/assets/setting.png';

import FileViewer from '@packages/application/FileViewer.vue';
import MyComputerVue from '@packages/application/MyComputer/MyComputer.vue';
import UrlBrowser from '@packages/application/UrlBrowser.vue';
import AppStore from '@packages/application/AppStore.vue';
import type { System } from '@packages/kernel';
import { BrowserWindow } from '@packages/sys';
import { i18n } from '@packages/sys';
import { WinAppOptions } from '@/packages/type/type';

import { dealIcon } from '@/packages/util/Icon';
import { basename, join } from '@packages/kernel';
import ImageViewerVue from '@packages/application/ImageViewer.vue';
import { Dialog } from '@packages/sys/dialog/Dialog';
import { Tray } from '@packages/sys/tray/Tary';
import BatteryVue from '@packages/sys/taskbar/barUnit/Battery.vue';
import BatteryPopVue from '@packages/sys/taskbar/popover/BatteryPop.vue';
import NetWorkVue from '@packages/sys/taskbar/barUnit/NetWork.vue';
import DateTimeVue from '@packages/sys/taskbar/barUnit/DateTime.vue';
import DateTimePopVue from '@packages/sys/taskbar/popover/DateTimePop.vue';
import NetworkPopVue from '@packages/sys/taskbar/popover/NetworkPop.vue';
import SettingVue from '@packages/application/Setting.vue';

export function initBuiltinApp(system: System) {
  const setting = {
    name: '设置',
    icon: settingicon,
    multiple: false,
    window: {
      content: SettingVue,
      icon: settingicon,
      width: 800,
      height: 600,
      title: i18n('setting'),
      frame: false,
      // resizable: false,
      center: true,
      backgroundColor: '#00000000',
    },
  };
  system.addMagnet(setting, true);
  system.addMenuList(setting, true);
  system.addBuiltInApp(setting);

  if (system._options.builtinFeature?.length === 0) return;
  if (system._options.builtinFeature?.includes('MyComputer')) {
    const myComputer = {
      name: '此电脑',
      icon: myComputerLogoIcon,
      window: {
        width: 800,
        height: 600,
        center: true,
        title: i18n('computer'),
        icon: myComputerLogoIcon,
        content: MyComputerVue,
        config: {
          path: '/',
        },
      },
    };
    system.addApp(myComputer);
    system.addMagnet(myComputer);
    system.addMenuList(myComputer);
  }

  if (system._options.builtinFeature?.includes('AppStore')) {
    const appStore: WinAppOptions = {
      name: '应用商店',
      icon: vtronStoreLogoIcon,
      window: {
        width: 900,
        height: 630,
        center: true,
        title: i18n('appstore'),
        icon: vtronStoreLogoIcon,
        content: AppStore,
        backgroundColor: '#ffffff00',
        frame: false,
        config: {
          path: '/',
        },
      },
    };
    system.addApp(appStore);
    system.addMagnet(appStore);
    system.addMenuList(appStore);
  }
}
export function initBuiltinFileOpener(system: System) {
  if (system._options.builtinFeature?.includes('ExeOpener')) {
    system.registerFileOpener('.exe', {
      name: '可执行程序',
      icon: unknownIcon,
      hiddenInChosen: true,
      func: (path: string, content: string) => {
        const exeContent = content.split('::');
        // exeContent[1]= loc
        // exeContent[2]= name
        // exeContent[3]= icon
        const winopt = system._rootState.windowMap[exeContent[1]].get(exeContent[2]);
        if (winopt) {
          if (winopt.multiple ?? true) {
            const win = new BrowserWindow(winopt.window);
            win.show();
          } else {
            if (winopt._hasShow) {
              return;
            } else {
              winopt._hasShow = true;
              const win = new BrowserWindow(winopt.window);
              win.show();
              win.on('close', () => {
                winopt._hasShow = false;
              });
            }
          }
        }
      },
    });
  }

  if (system._options.builtinFeature?.includes('ShortCutOpener')) {
    system.registerFileOpener('.ln', {
      name: '快捷方式',
      icon: unknownIcon,
      hiddenInChosen: true,
      func: async (path, content) => {
        if (await system.fs.exists(content)) {
          try {
            system.openFile(content);
          } catch (e) {
            Dialog.showMessageBox({
              title: '错误',
              message: '无法打开快捷方式',
              type: 'error',
            });
          }
        } else {
          Dialog.showMessageBox({
            title: '错误',
            message: '无法打开快捷方式，目标不存在',
            type: 'error',
          });
        }
      },
    });
  }

  if (system._options.builtinFeature?.includes('TextOpener')) {
    system.registerFileOpener(['.txt', '.js', '.json', ''], {
      name: '文本文件',
      icon: unknownIcon,
      func: (path, content) => {
        const tempwindow = new BrowserWindow({
          width: 400,
          height: 400,
          center: true,
          title: i18n('text.document'),
          content: FileViewer,
          config: {
            content: content,
            path: path,
          },
        });
        tempwindow.show();
      },
    });
  }

  system.registerFileOpener('dir', {
    name: '文件夹',
    icon: unknownIcon,
    hiddenInChosen: true,
    func: (path, content) => {
      const tempwindow = new BrowserWindow({
        width: 800,
        height: 600,
        center: true,
        title: i18n('computer'),
        content: MyComputerVue,
        icon: myComputerLogoIcon,
        config: {
          content: content,
          path: path,
        },
      });
      tempwindow.show();
    },
  });

  if (system._options.builtinFeature?.includes('UrlOpener')) {
    system.registerFileOpener('.url', {
      name: '网址',
      icon: unknownIcon,
      func: async (path, content) => {
        const imgwindow = new BrowserWindow({
          width: 900,
          height: 600,
          icon: await dealIcon(await system.fs.stat(path), system),
          center: true,
          title: basename(path),
          content: UrlBrowser,
          config: {
            content: content,
            path: path,
          },
        });
        imgwindow.show();
      },
    });
  }

  if (system._options.builtinFeature?.includes('ImageOpener')) {
    system.registerFileOpener(['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'], {
      name: '图片',
      icon: imageicon,
      func: (path: string, content: any) => {
        const imgwindow = new BrowserWindow({
          width: 400,
          height: 400,
          icon: imageicon,
          center: true,
          title: '图片预览',
          content: ImageViewerVue,
          config: {
            content: content,
            path: path,
          },
        });
        imgwindow.show();
      },
    });
  }

  if (system._options.builtinFeature?.includes('DataTimeTray')) {
    const dateTimeT = new Tray({
      image: DateTimeVue,
    });
    dateTimeT.setContextMenu(DateTimePopVue, 320, 700);
  }
  if (system._options.builtinFeature?.includes('NetworkTray')) {
    const networkT = new Tray({
      image: NetWorkVue,
    });
    networkT.setContextMenu(NetworkPopVue, 200, 80);
  }

  if (system._options.builtinFeature?.includes('BatteryTray')) {
    const batteryT = new Tray({
      image: BatteryVue,
    });
    batteryT.setContextMenu(BatteryPopVue, 200, 80);
  }
}

export async function initBackground(system: System) {
  const back = await system.fs.readFile(`${system._options.systemLocation}Vtron/background.txt`);
  if (back) {
    system._rootState.options.background = back;
  }
}

export async function initCheckVersion(system: System) {
  const programVersion = system.version;
  const systemVersion = await system.fs.readFile(
    join(system._options.systemLocation || '', 'Vtron/version.txt')
  );
  if (systemVersion && programVersion) {
    if (programVersion !== systemVersion) {
      system.createNotify({
        title: 'Vtron',
        content: '本地程序和文件版本不一致，请恢复出厂设置',
      });
    }
  }
}
