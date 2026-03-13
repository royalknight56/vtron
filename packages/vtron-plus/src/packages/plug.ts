import { BrowserWindow, System } from 'vtron';
import Browser from './apps/Browser.vue';
// import ImageViewer from "./apps/ImageViewer.vue";
import PdfViewer from './apps/PdfViewer.vue';
// import MarkDown from "./apps/MarkDown.vue";
import UrlBrowser from './apps/UrlBrowser.vue';

import Version from './apps/Version.vue';
// @ts-ignore
import Calculator from './apps/Calculator.vue';
import mycomicon from './assets/computer.ico';
import helpicon from './assets/help.ico';
import termIcon from './assets/term.png';
// import markdownicon from "./assets/markdown.png";
import pythonIcon from './assets/Python.png';
import calcicon from './assets/calcicon.png';
import chromeicon from './assets/chromeicon.png';
import docxIcon from './assets/docx.png';
import backupIcon from './assets/e895.png';
import galleryIcon from './assets/gallery.png';
import storeIcon from './assets/vtron-stroe-icon-nobg.png';
import musicAppIcon from './assets/musicApp.png';
import pdfIcon from './assets/pdf.png';
import ppticon from './assets/ppt.png';
import pptxIcon from './assets/pptx.png';
import xlsxIcon from './assets/xlsx.png';

import DocxViewerVue from './apps/DocxViewer.vue';
import ExeclViewerVue from './apps/ExeclViewer.vue';
import ExcelEditorVue from './apps/ExcelEditor.vue';
import WordEditorVue from './apps/WordEditor.vue';
import PPTEditorVue from './apps/PPTEditor.vue';
// import MusicStoreVue from './apps/MusicStore.vue';
import MusicViewerVue from './apps/MusicViewer.vue';
import PictureStoreVue from './apps/PictureStore.vue';
import PythonVue from './apps/Python.vue';
import Terminal from './apps/Terminal.vue';
import VideoViewerVue from './apps/VideoViewer.vue';
import ZipBackupVue from './apps/ZipBackup.vue';
import audioIcon from './assets/audio.png';
import videoIcon from './assets/video.png';
import AppStore from './apps/AppStore.vue';
import AiChat from './apps/AiChat.vue';
import aiChatIcon from './assets/ai-chat.svg';
type VtronFeature =
  | 'doc'
  | 'xls'
  | 'pdf'
  | 'py'
  | 'ink'
  | 'mp3'
  | 'mp4'
  | 'term'
  | 'chrome'
  | 'calc'
  | 'help'
  | 'music'
  | 'gallery'
  | 'store'
  | 'ai'
  | 'excel'
  | 'word'
  | 'pptEditor';
function vtronPlus(configIn?: { features: VtronFeature[] }) {
  const config = {
    features: configIn?.features || [
      'doc',
      'xls',
      'pdf',
      'py',
      'ink',
      'mp3',
      'mp4',
      'term',
      'chrome',
      'calc',
      'help',
      'music',
      'gallery',
      'store',
      'ai',
      'excel',
      'word',
      'pptEditor',
    ],
  };
  return function vtronPlusPlugin(system: System) {
    /**------------------ 桌面右键菜单--------------- */
    //#region
    //#endregion

    /**------------------ 打开器区--------------- */
    //#region
    config.features.includes('doc') &&
      system.registerFileOpener(['.doc', '.docx'], {
        icon: docxIcon,
        func: async (path) => {
          const content = (await system.fs.readFile(path)) || '';
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

    config.features.includes('xls') &&
      system.registerFileOpener(['.xls', '.xlsx'], {
        icon: xlsxIcon,
        func: async (path) => {
          const content = (await system.fs.readFile(path)) || '';
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

    config.features.includes('pdf') &&
      system.registerFileOpener('.pdf', {
        icon: pdfIcon,
        func: async (path) => {
          const content = (await system.fs.readFile(path)) || '';
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
    config.features.includes('py') &&
      system.registerFileOpener('.py', {
        name: 'Python',
        icon: pythonIcon,
        func: async (path) => {
          const content = (await system.fs.readFile(path)) || '';
          new BrowserWindow({
            title: path,
            icon: pythonIcon,
            width: 800,
            height: 600,
            resizable: true,
            center: true,
            content: PythonVue,
            config: {
              path: path,
              code: content,
            },
          }).show();
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
    config.features.includes('ink') &&
      system.registerFileOpener('.ink', {
        icon: mycomicon,
        func: async (path) => {
          const content = (await system.fs.readFile(path)) || '';
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
    config.features.includes('mp3') &&
      system.registerFileOpener('.mp3', {
        icon: audioIcon,
        func: async (path) => {
          const content = (await system.fs.readFile(path)) || '';
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
    config.features.includes('mp4') &&
      system.registerFileOpener('.mp4', {
        icon: videoIcon,
        func: async (path) => {
          const content = (await system.fs.readFile(path)) || '';
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
    //#endregion

    /**------------------ 应用区--------------- */
    //#region

    const pythonTerminal = {
      name: 'Python',
      icon: pythonIcon,
      window: {
        width: 700,
        height: 470,
        center: true,
        title: 'Python',
        icon: pythonIcon,
        content: PythonVue,
        // resizable: false,
        config: {
          path: '/',
        },
      },
    };
    (system as any).runPython = (code: string) => {
      new BrowserWindow({
        width: 700,
        height: 470,
        center: true,
        title: 'Python',
        icon: pythonIcon,
        content: PythonVue,
        // resizable: false,
        config: {
          path: '/',
          code,
        },
      }).show();
    };

    config.features.includes('py') && system.addApp(pythonTerminal);

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
    if (config.features.includes('term')) {
      system.addApp(terminal);
      system.addMagnet(terminal);
      system.addMenuList(terminal);
    }

    config.features.includes('chrome') &&
      system.addApp({
        name: 'Chrome',
        icon: chromeicon,
        window: {
          width: 800,
          height: 600,
          title: '浏览器',
          icon: chromeicon,
          center: true,
          content: Browser,
          frame: false,
          backgroundColor: '#ffffff00',
        },
      });
    config.features.includes('calc') &&
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
    config.features.includes('help') &&
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
    // config.features.includes('music') &&
    //   system.addApp({
    //     name: '音乐库',
    //     icon: musicAppIcon,
    //     multiple: false,
    //     window: {
    //       title: '音乐库',
    //       width: 800,
    //       height: 600,
    //       icon: musicAppIcon,
    //       center: true,
    //       content: MusicStoreVue,
    //     },
    //   });
    config.features.includes('gallery') &&
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

    config.features.includes('store') &&
      system.addApp({
        name: 'AppStore',
        icon: storeIcon,
        multiple: false,
        window: {
          width: 900,
          height: 630,
          center: true,
          title: 'AppStore',
          icon: storeIcon,
          content: AppStore,
          backgroundColor: '#ffffff00',
          frame: false,
          config: {
            path: '/',
          },
        },
      });

    config.features.includes('word') &&
      system.registerFileOpener('.vtdoc', {
        icon: docxIcon,
        func: async (path) => {
          new BrowserWindow({
            title: path,
            icon: docxIcon,
            width: 900,
            height: 700,
            resizable: true,
            center: true,
            content: WordEditorVue,
            config: { path },
          }).show();
        },
      });

    config.features.includes('word') &&
      system.addApp({
        name: 'Word',
        icon: docxIcon,
        window: {
          title: 'Word',
          width: 900,
          height: 700,
          icon: docxIcon,
          center: true,
          content: WordEditorVue,
          resizable: true,
        },
      });

    config.features.includes('pptEditor') &&
      system.registerFileOpener('.vtppt', {
        icon: pptxIcon,
        func: async (path) => {
          new BrowserWindow({
            title: path,
            icon: pptxIcon,
            width: 1000,
            height: 700,
            resizable: true,
            center: true,
            content: PPTEditorVue,
            config: { path },
          }).show();
        },
      });

    config.features.includes('pptEditor') &&
      system.addApp({
        name: 'PPT',
        icon: pptxIcon,
        window: {
          title: 'PPT',
          width: 1000,
          height: 700,
          icon: pptxIcon,
          center: true,
          content: PPTEditorVue,
          resizable: true,
        },
      });

    config.features.includes('excel') &&
      system.registerFileOpener('.vtxls', {
        icon: xlsxIcon,
        func: async (path) => {
          new BrowserWindow({
            title: path,
            icon: xlsxIcon,
            width: 900,
            height: 600,
            resizable: true,
            center: true,
            content: ExcelEditorVue,
            config: { path },
          }).show();
        },
      });

    config.features.includes('excel') &&
      system.addApp({
        name: 'Excel',
        icon: xlsxIcon,
        window: {
          title: 'Excel',
          width: 900,
          height: 600,
          icon: xlsxIcon,
          center: true,
          content: ExcelEditorVue,
          resizable: true,
        },
      });

    config.features.includes('ai') &&
      system.addApp({
        name: 'AI Chat',
        icon: aiChatIcon,
        multiple: false,
        window: {
          width: 56,
          height: 56,
          title: 'AI Assistant',
          icon: aiChatIcon,
          content: AiChat,
          frame: false,
          backgroundColor: '#ffffff00',
          radius: 28,
          skipTaskbar: true,
          alwaysOnTop: true,
          resizable: false,
        },
      });

    //#endregion

    /**------------------ 设置面板 ------------ */
    //#region
    system.registerSettingPanel({
      key: '备份与恢复',
      title: `备份与恢复`,
      desc: '备份和恢复系统文件',
      content: ZipBackupVue,
      icon: backupIcon,
    });
    //#endregion
  };
}

export { vtronPlus };
