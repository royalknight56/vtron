import myComputerLogoIcon from '@packages/assets/computer.png?url';
import imageicon from '@packages/assets/image.png';
import unknownIcon from '@packages/assets/unknown.png';

import FileViewer from '@/packages/computer/application/FileViewer.vue';
import ImageViewerVue from '@/packages/computer/application/ImageViewer.vue';
import MyComputerVue from '@/packages/computer/application/MyComputer/MyComputer.vue';
import UrlBrowser from '@/packages/computer/application/UrlBrowser.vue';
import BatteryVue from '@/packages/computer/application/trayItems/Battery.vue';
import BatteryPopVue from '@/packages/computer/application/trayItems/BatteryPop.vue';
import DateTimeVue from '@/packages/computer/application/trayItems/DateTime.vue';
import DateTimePopVue from '@/packages/computer/application/trayItems/DateTimePop.vue';
import NetWorkVue from '@/packages/computer/application/trayItems/NetWork.vue';
import NetworkPopVue from '@/packages/computer/application/trayItems/NetworkPop.vue';
import { dealIcon } from '@/packages/computer/utils/dealIcon';
import { BrowserWindow, Dialog, Tray } from '@/packages/services';
import { i18n } from '@packages/computer';
import type { System } from '@packages/kernel';
import { basename } from '@packages/kernel';

export function initBuiltinFileOpener(system: System) {
  if (system._options.builtinFeature?.includes('ExeOpener')) {
    system.registerFileOpener('.exe', {
      name: i18n('exe.document'),
      icon: unknownIcon,
      hiddenInChosen: true,
      func: (path: string, content: string) => {
        const exeContent = content.split('::');
        if (!exeContent[1] || !exeContent[2]) {
          Dialog.showMessageBox({
            title: i18n('error'),
            message: i18n('exe.error'),
            type: 'error',
          });
          return;
        }
        // exeContent[1]= loc
        // exeContent[2]= name
        // exeContent[3]= icon
        const winopt = system.stateManager.windowMap.get(
          exeContent[1] as 'Desktop' | 'Magnet' | 'Menulist' | 'Builtin',
          exeContent[2]
        );
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
