import vtronStoreLogoIcon from '@/assets/vtron-stroe-icon-nobg.png?url';
import myComputerLogoIcon from '@packages/assets/computer.png?url';
import infoIcon from '@packages/assets/info-icon.png?url';
import termIcon from '@packages/assets/term.png?url';
import unknownIcon from '@packages/assets/unknown.png';

import FileViewer from '@feature/builtin/FileViewer.vue';
import MyComputerVue from '@feature/builtin/MyComputer/MyComputer.vue';
import UrlBrowser from '@feature/builtin/UrlBrowser.vue';
import Terminal from '@feature/builtin/Terminal.vue';
import AppStore from '@feature/builtin/AppStore.vue';
import type { System } from '@feature/system';
import { BrowserWindow } from '@feature/window/BrowserWindow';
import { i18n } from '@feature/i18n';

export function initBuiltinApp(system: System) {
  const myComputer = {
    name: i18n('computer'),
    icon: myComputerLogoIcon,
    window: {
      width: 800,
      height: 600,
      center: true,
      title: i18n('computer'),
      icon: myComputerLogoIcon,
      content: MyComputerVue,
      config: {
        path: '/C',
      },
    },
  };
  system.addApp(myComputer);
  system.addMagnet(myComputer);
  system.addMenuList(myComputer);
  const terminal = {
    name: i18n('terminal'),
    icon: termIcon,
    window: {
      width: 700,
      height: 470,
      center: true,
      title: i18n('terminal'),
      icon: termIcon,
      content: Terminal,
      resizable: false,
      config: {
        path: '/',
      },
    },
  };
  system.addApp(terminal);
  system.addMagnet(terminal);
  system.addMenuList(terminal);
  const appStore = {
    name: i18n('appstore'),
    icon: vtronStoreLogoIcon,
    window: {
      width: 700,
      height: 470,
      // width: 900,
      // height: 600,
      center: true,
      title: i18n('appstore'),
      icon: vtronStoreLogoIcon,
      content: AppStore,
      config: {
        path: '/',
      },
    },
  };
  system.addApp(appStore);
  system.addMagnet(appStore);
  system.addMenuList(appStore);
}
export function initBuiltinFileOpener(system: System) {
  system.registerFileOpener('.exe', {
    icon: unknownIcon,
    func: system.openLink.bind(system),
  });
  system.registerFileOpener('.txt', {
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
    func: (path, content) => {
      const imgwindow = new BrowserWindow({
        width: 800,
        height: 600,
        icon: infoIcon,
        center: true,
        title: '',
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
