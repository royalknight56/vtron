import vtronLogoIcon from "@/assets/vtron-icon-nobg.png?url";
import vtronStoreLogoIcon from "@/assets/vtron-stroe-icon-nobg.png?url";

import myComputerLogoIcon from "@/packages/assets/computer.ico?url";
import infoIcon from "@/packages/assets/info-icon.ico?url";
import termIcon from "@/packages/assets/term.ico?url";
import { Shell } from "@/packages/feature/core/Shell";
import FileViewer from "../builtin/FileViewer.vue";
import MyComputerVue from "../builtin/MyComputer.vue";
import UrlBrowser from "../builtin/UrlBrowser.vue";
import Terminal from "../builtin/Terminal.vue";
import AppStore from "../builtin/AppStore.vue";
import type { System } from "./System";
import { BrowserWindow } from "@packages/feature/window/BrowserWindow";

export function initBuiltinApp(system: System) {
    system.addApp({
        name: '此电脑',
        icon: myComputerLogoIcon,
        window: {
            width: 800,
            height: 600,
            center: true,
            title: '此电脑',
            icon: myComputerLogoIcon,
            content: MyComputerVue,
            config: {
                path: '/'
            }
        }
    });
    system.addApp({
        name: '终端',
        icon: termIcon,
        window: {
            width: 700,
            height: 470,
            center: true,
            title: '终端',
            icon: termIcon,
            content: Terminal,
            resizable: false,
            config: {
                path: '/'
            }
        }
    })
    system.addApp({
        name: '应用商店',
        icon: vtronStoreLogoIcon,
        window: {
            width: 700,
            height: 470,
            center: true,
            title: '应用商店',
            icon: vtronStoreLogoIcon,
            content: AppStore,
            config: {
                path: '/'
            }
        }
    })
}
export function initBuiltinFileOpener(system: System) {
    system.registerFileOpener('.exe', system.openLink.bind(system))

    system.registerFileOpener(".txt", (path, content) => {
        let pdfwindow = new BrowserWindow({
            width: 400,
            height: 400,
            center: true,
            title: '文本文档',
            content: FileViewer,
            config: {
                content: content,
                path: path
            }
        });
        pdfwindow.show()
    });

    system.registerFileOpener("dir", (path, content) => {
        let pdfwindow = new BrowserWindow({
            width: 800,
            height: 600,
            center: true,
            title: '此电脑',
            content: MyComputerVue,
            icon: myComputerLogoIcon,
            config: {
                content: content,
                path: path
            }
        });
        pdfwindow.show()
    });

    system.registerFileOpener('.url', (path, content) => {
        let imgwindow = new BrowserWindow({
            width: 800,
            height: 600,
            icon: infoIcon,
            center: true,
            title: '',
            content: UrlBrowser,
            config: {
                content: content,
                path: path
            }
        });
        imgwindow.show()
    })
}