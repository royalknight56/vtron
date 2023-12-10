import vtronStoreLogoIcon from '@/assets/vtron-stroe-icon-nobg.png?url';
import myComputerLogoIcon from '@packages/assets/computer.png?url';
// import infoIcon from '@packages/assets/info-icon.png?url';
// import termIcon from '@packages/assets/term.png?url';
import unknownIcon from '@packages/assets/unknown.png';
import imageicon from '@packages/assets/image.png';

import FileViewer from '@feature/builtin/FileViewer.vue';
import MyComputerVue from '@feature/builtin/MyComputer/MyComputer.vue';
import UrlBrowser from '@feature/builtin/UrlBrowser.vue';
// import Terminal from '@feature/builtin/Terminal.vue';
import AppStore from '@feature/builtin/AppStore.vue';
import type { System } from '@feature/system';
import { BrowserWindow } from '@feature/window/BrowserWindow';
import { i18n } from '@feature/i18n';
import { WinAppOptions } from '@/packages/type/type';

import { dealIcon } from '@/packages/util/Icon';
import { basename } from '../core/Path';
import ImageViewerVue from '../builtin/ImageViewer.vue';
import { Dialog } from '../dialog/Dialog';
import { Tray } from '../tray/Tary';
import BatteryVue from '../structure/taskbar/barUnit/Battery.vue';
import BatteryPopVue from '../structure/taskbar/popover/BatteryPop.vue';
import NetWorkVue from '../structure/taskbar/barUnit/NetWork.vue';
import DateTimeVue from '../structure/taskbar/barUnit/DateTime.vue';
import DateTimePopVue from '../structure/taskbar/popover/DateTimePop.vue';

export function initBuiltinApp(system: System) {
  if (system._options.builtinApp?.length === 0) return;
  if (system._options.builtinApp?.includes('MyComputer')) {
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

  if (system._options.builtinApp?.includes('AppStore')) {
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
  system.registerFileOpener('.exe', {
    icon: unknownIcon,
    func: (path: string, content: string) => {
      const exeContent = content.split('::');
      // exeContent[1]= loc
      // exeContent[2]= name
      // exeContent[3]= icon
      const winopt = system._rootState.system.windowMap[exeContent[1]].get(exeContent[2]);
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
  system.registerFileOpener('.ln', {
    icon: unknownIcon,
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

  system.registerFileOpener(['.txt', '.js', '.json'], {
    icon: unknownIcon,
    func: (path, content) => {
      const pdfwindow = new BrowserWindow({
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
      pdfwindow.show();
    },
  });

  system.registerFileOpener('dir', {
    icon: unknownIcon,
    func: (path, content) => {
      const pdfwindow = new BrowserWindow({
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
      pdfwindow.show();
    },
  });

  system.registerFileOpener('.url', {
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

  system.registerFileOpener(['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'], {
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
  const dateTimeT = new Tray({
    image: DateTimeVue,
  });
  dateTimeT.setContextMenu(DateTimePopVue, 320, 700);

  new Tray({
    image: NetWorkVue,
  });
  const batteryT = new Tray({
    image: BatteryVue,
  });
  batteryT.setContextMenu(BatteryPopVue, 200, 80);
}
