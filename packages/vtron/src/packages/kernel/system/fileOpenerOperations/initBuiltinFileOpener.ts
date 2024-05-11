import myComputerLogoIcon from '@packages/assets/computer.png?url';
import imageicon from '@packages/assets/image.png';
import unknownIcon from '@packages/assets/unknown.png';

import FileViewer from '@packages/application/FileViewer.vue';
import MyComputerVue from '@packages/application/MyComputer/MyComputer.vue';
import UrlBrowser from '@packages/application/UrlBrowser.vue';
import type { System } from '@packages/kernel';
import { BrowserWindow, i18n } from '@packages/ui';

import { dealIcon } from '@/packages/util/Icon';
import ImageViewerVue from '@packages/application/ImageViewer.vue';
import { basename } from '@packages/kernel';
import { Dialog } from '@packages/ui/dialog/Dialog';
import BatteryVue from '@packages/ui/taskbar/barUnit/Battery.vue';
import DateTimeVue from '@packages/ui/taskbar/barUnit/DateTime.vue';
import NetWorkVue from '@packages/ui/taskbar/barUnit/NetWork.vue';
import BatteryPopVue from '@packages/ui/taskbar/popover/BatteryPop.vue';
import DateTimePopVue from '@packages/ui/taskbar/popover/DateTimePop.vue';
import NetworkPopVue from '@packages/ui/taskbar/popover/NetworkPop.vue';
import { Tray } from '@packages/ui/tray/Tary';

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
