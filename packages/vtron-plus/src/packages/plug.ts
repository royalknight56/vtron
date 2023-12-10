import { BrowserWindow, System } from 'vtron';
import type { RootState } from 'vtron';
import Browser from './apps/Browser.vue';
// import ImageViewer from "./apps/ImageViewer.vue";
import PdfViewer from './apps/PdfViewer.vue';
// import MarkDown from "./apps/MarkDown.vue";
import UrlBrowser from './apps/UrlBrowser.vue';
import PPT from './apps/PPT.vue';

import Version from './apps/Version.vue';
// @ts-ignore
import Calculator from './apps/Calculator.vue';
import mycomicon from './assets/computer.ico';
import helpicon from './assets/help.ico';
import termIcon from './assets/term.png';
// import markdownicon from "./assets/markdown.png";
import chromeicon from './assets/chromeicon.png';
import calcicon from './assets/calcicon.png';
import ppticon from './assets/ppt.png';
import pptxIcon from './assets/pptx.png';
import pdfIcon from './assets/pdf.png';
import docxIcon from './assets/docx.png';
import xlsxIcon from './assets/xlsx.png';
import musicAppIcon from './assets/musicApp.png';
import galleryIcon from './assets/gallery.png';

import audioIcon from './assets/audio.png';
import videoIcon from './assets/video.png';
import MusicViewerVue from './apps/MusicViewer.vue';
import VideoViewerVue from './apps/VideoViewer.vue';
import DocxViewerVue from './apps/DocxViewer.vue';
import ExeclViewerVue from './apps/ExeclViewer.vue';
import Terminal from './apps/Terminal.vue';
import MusicStoreVue from './apps/MusicStore.vue';
import PictureStoreVue from './apps/PictureStore.vue';

function vtronPlus(system: System, rootState: RootState) {
  /**------------------ 桌面右键菜单--------------- */
  //#region
  //#endregion

  /**------------------ 打开器区--------------- */
  //#region

  system.registerFileOpener(['.doc', '.docx'], {
    icon: docxIcon,
    func: (path, content) => {
      new BrowserWindow({
        title: path,
        icon: docxIcon,
        width: 900,
        height: 600,
        resizable: true,
        center: true,
        content: DocxViewerVue,
        config: {
          path: path,
          content: content,
        },
      }).show();
    },
  });

  system.registerFileOpener(['.xls', '.xlsx'], {
    icon: xlsxIcon,
    func: (path, content) => {
      new BrowserWindow({
        title: path,
        icon: xlsxIcon,
        width: 800,
        height: 600,
        resizable: true,
        center: true,
        content: ExeclViewerVue,
        config: {
          path: path,
          content: content,
        },
      }).show();
    },
  });

  system.registerFileOpener('.pdf', {
    icon: pdfIcon,
    func: (path, content) => {
      const pdfwindow = new BrowserWindow({
        width: 800,
        height: 600,
        icon: pdfIcon,
        center: true,
        title: 'PDF预览',
        content: PdfViewer,
        config: {
          content: content,
          path: path,
        },
      });
      pdfwindow.maximize();
      pdfwindow.show();
    },
  });
  // const imgType = ["jpg", "jpeg", "png", "gif", "bmp", "webp"];
  // const imgOpener = (path: string, content: any) => {
  //   let imgwindow = new BrowserWindow({
  //     width: 400,
  //     height: 400,
  //     icon: mycomicon,
  //     center: true,
  //     title: "图片预览",
  //     content: ImageViewer,
  //     config: {
  //       content: content,
  //       path: path,
  //     },
  //   });
  //   imgwindow.show();
  // };
  // imgType.forEach((type) => {
  //   system.registerFileOpener("." + type, {
  //     icon: mycomicon,
  //     func: imgOpener,
  //   });
  // });

  system.registerFileOpener('.ink', {
    icon: mycomicon,
    func: (path, content) => {
      const imgwindow = new BrowserWindow({
        width: 800,
        height: 600,
        icon: mycomicon,
        center: true,
        title: '浏览器',
        content: UrlBrowser,
        config: {
          content: content,
          path: path,
        },
      });
      imgwindow.show();
    },
  });

  system.registerFileOpener('.mp3', {
    icon: audioIcon,
    func: (path, content) => {
      new BrowserWindow({
        title: path,
        icon: audioIcon,
        width: 600,
        height: 300,
        resizable: false,
        center: true,
        content: MusicViewerVue,
        config: {
          path: path,
          content: content,
        },
      }).show();
    },
  });
  system.registerFileOpener('.mp4', {
    icon: videoIcon,
    func: (path, content) => {
      new BrowserWindow({
        title: path,
        icon: videoIcon,
        width: 800,
        height: 600,
        resizable: true,
        center: true,
        content: VideoViewerVue,
        config: {
          path: path,
          content: content,
        },
      }).show();
    },
  });

  system.registerFileOpener(['.ppt', '.pptx'], {
    icon: pptxIcon,
    func: (path, content) => {
      new BrowserWindow({
        title: path,
        icon: ppticon,
        width: 800,
        height: 800,
        resizable: true,
        center: true,
        content: PPT,
        config: {
          path: path,
          content: content,
        },
      }).show();
    },
  });

  //#endregion

  /**------------------ 应用区--------------- */
  //#region
  const terminal = {
    name: 'Terminal',
    icon: termIcon,
    window: {
      width: 700,
      height: 470,
      center: true,
      title: 'Terminal',
      icon: termIcon,
      content: Terminal,
      // resizable: false,
      config: {
        path: '/',
      },
    },
  };
  system.addApp(terminal);
  system.addMagnet(terminal);
  system.addMenuList(terminal);

  system.addApp({
    name: 'Chrome',
    icon: chromeicon,
    window: {
      width: 800,
      height: 600,
      icon: chromeicon,
      center: true,
      content: Browser,
    },
  });
  system.addApp({
    name: 'PPTist',
    icon: ppticon,
    window: {
      width: 800,
      height: 600,
      icon: ppticon,
      center: true,
      content: PPT,
    },
  });
  system.addMagnet({
    name: '计算器',
    icon: calcicon,
    window: {
      width: 400,
      height: 520,
      content: Calculator,
      resizable: false,
      title: '计算器',
      icon: calcicon,
    },
  });
  system.addMagnet({
    name: '版本信息',
    icon: helpicon,
    window: {
      width: 300,
      height: 200,
      content: Version,
      resizable: false,
      center: true,
      title: '版本信息',
      icon: helpicon,
    },
  });

  system.addApp({
    name: '音乐库',
    icon: musicAppIcon,
    multiple: false,
    window: {
      title: '音乐库',
      width: 800,
      height: 600,
      icon: musicAppIcon,
      center: true,
      content: MusicStoreVue,
    },
  });

  system.addApp({
    name: '图库',
    icon: galleryIcon,
    multiple: false,
    window: {
      title: '图库',
      width: 800,
      height: 600,
      icon: galleryIcon,
      center: true,
      content: PictureStoreVue,
    },
  });

  //#endregion
}
export { vtronPlus };
