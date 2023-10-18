<!--
 * @Author: Royal
 * @LastEditTime: 2022-07-14 19:17:09
 * @Description: 
 * @FilePath: /myindex/src/App.vue
-->
<template>
  <div class="outer">
    <Screen></Screen>
  </div>
</template>

<script setup lang="ts">
// import brow from './assets/浏览器.png';
import testicon from './assets/终端.png';
import TestButton from './apps/TestButton.vue';
import VtronTest from './apps/VtronTest.vue';
import VtronPerfTest from './apps/VtronPerfTest.vue';

import { onMounted } from 'vue';
import { System } from './packages/plug';
import vtronLogoIcon from './assets/vtron-icon-nobg.png';
// class TestShell {
//   prefix = 'vtron@vtron:~$ ';
//   router = '/';
//   user = 'root';
//   messageCallBack: (msg: string) => void;
//   constructor() {
//     this.messageCallBack = (msg: string) => {
//       console.log(msg);
//     };
//   }
//   on = (event: string, callback: (msg: string) => void) => {
//     if (event === 'message') {
//       this.messageCallBack = callback;
//     }
//   };
//   emit(event: string, router: string, user: string) {
//     if (event === 'start') {
//       this.router = router;
//       this.user = user;
//       this.messageCallBack('hello world');
//     }
//   }
//   async exec(input: string) {
//     console.log(input);
//     this.messageCallBack('hello world\r\n');
//   }
// }
// async function save() {
//   const state = await sys?.serializeState();
//   localStorage.setItem('vtron-state', JSON.stringify(state));
// }
// async function restore() {
//   const state = localStorage.getItem('vtron-state');
//   if (state) {
//     await sys?.deserializeState(JSON.parse(state));
//   }
// }
// const memoryFs: Record<string, VtronFile> = {};
onMounted(() => {
  const sys = new System({
    // lang: 'en-US',
    // lang: "zh-CN",
    logo: vtronLogoIcon,
    background: 'https://picsum.photos/1920/1080',
    // background: '#779',
    // userLocation: '/C/TestUser/',
    // login: {
    //   username: '323dmin',
    //   password: 'admin',
    // },
    // async loginCallback() {
    //   await new Promise((resolve) => {
    //     setTimeout(() => {
    //       resolve(true);
    //     }, 200);
    //   });
    //   return true;
    // },
    // builtinApp: ['MyComputer', 'AppStore'],
    // noPassword: true,
    // fs: {
    //   readFile: async (path: string) => {
    //     return memoryFs[path]?.content;
    //   },
    //   writeFile: async (
    //     path: string,
    //     par: {
    //       content: string;
    //     }
    //   ) => {
    //     memoryFs[path] = {
    //       ...memoryFs[path],
    //       ...par,
    //       path,
    //       parentPath: path,
    //       isSymlink: false,
    //       isFile: true,
    //       isDirectory: false,
    //       size: 0,
    //       mtime: new Date(),
    //       atime: new Date(),
    //       birthtime: new Date(),
    //     };
    //     console.log('readFile', memoryFs);
    //   },
    //   appendFile: async (path: string, content: string) => {
    //     memoryFs[path] = {
    //       ...memoryFs[path],
    //       content: memoryFs[path].content + content,
    //     };
    //   },
    //   readdir: async (path: string) => {
    //     return Object.keys(memoryFs)
    //       .filter((p) => p.startsWith(path))
    //       .map((p) => memoryFs[p]);
    //   },
    //   exists: async (path: string) => {
    //     return !!memoryFs[path];
    //   },
    //   stat: async (path: string) => {
    //     return memoryFs[path];
    //   },
    //   unlink: async (path: string) => {
    //     delete memoryFs[path];
    //   },
    //   rename: async (oldPath: string, newPath: string) => {
    //     memoryFs[newPath] = memoryFs[oldPath];
    //     delete memoryFs[oldPath];
    //   },
    //   rmdir: async (path: string) => {
    //     delete memoryFs[path];
    //   },
    //   mkdir: async (path: string) => {
    //     memoryFs[path] = {
    //       isDirectory: true,
    //       isFile: false,
    //       content: '',
    //       path,
    //       parentPath: path,
    //       isSymlink: false,
    //       size: 0,
    //       mtime: new Date(),
    //       atime: new Date(),
    //       birthtime: new Date(),
    //     };
    //   },
    //   serializeFileSystem: async () => {
    //     return memoryFs;
    //   },
    //   deserializeFileSystem: async (files: any) => {
    //     Object.keys(files).forEach((path) => {
    //       memoryFs[path] = files[path];
    //     });
    //   },
    //   removeFileSystem: async () => {
    //     Object.keys(memoryFs).forEach((path) => {
    //       delete memoryFs[path];
    //     });
    //   },
    //   registerWatcher: (path: RegExp, callback: (path: string, content: string) => void) => {
    //     // console.log(path, callback);
    //   },
    // },
    // shell: new TestShell(),
    desktop: [
      {
        name: '测试Url',
        icon: testicon,
        window: {
          content: 'https://shimo.im/desktop',
          title: '测试按钮',
          icon: testicon,
          center: true,
          // backgroundColor: "rgba(0,0,0,1)",
        },
      },
      {
        name: '测试无边框拖动2',
        // icon: testicon,
        window: {
          content: TestButton,
          title: '测试按钮',
          icon: testicon,
          center: true,
          frame: false,
          // backgroundColor: "rgba(0,0,0,1)",
        },
      },
      {
        name: '测试按钮3',
        // icon: testicon,
        window: {
          content: TestButton,
          title: '测试按钮',
          icon: testicon,
          center: true,
          // backgroundColor: "rgba(0,0,0,1)",
        },
      },
      {
        name: '测试按钮4',
        // icon: testicon,
        window: {
          content: TestButton,
          title: '测试按钮',
          icon: testicon,
          center: true,
          // backgroundColor: "rgba(0,0,0,1)",
        },
      },
      {
        name: '测试不可缩放',
        icon: testicon,
        window: {
          content: TestButton,
          title: '测试不可缩放',
          icon: testicon,
          center: true,
          frame: false,
          fullscreen: true,
          resizable: false,
          backgroundColor: 'rgba(0,0,0,0)',
        },
      },
      {
        name: 'Vtron自动测试',
        icon: testicon,
        window: {
          content: VtronTest,
          title: 'Vtron自动测试',
          icon: testicon,
          center: true,
        },
      },
      {
        name: 'Vtron自动性能测试',
        icon: testicon,
        window: {
          content: VtronPerfTest,
          title: 'Vtron自动性能测试',
          icon: testicon,
          center: true,
        },
      },
    ],

    // rootStyle: {
    //   // '--color-ui-desk-item-title': '#a30',
    //   // '--window-border-radius': '4px',
    //   // '--menu-bar-height':'100px'
    // },
  });
  // sys.onOuterFileDrop((files) => {
  //   console.log(files);
  // });
  const testapp = {
    name: '测试按钮4',
    // icon: testicon,
    window: {
      content: TestButton,
      title: '测试按钮',
      icon: testicon,
      center: true,
      // backgroundColor: "rgba(0,0,0,1)",
    },
  };
  sys.whenReady().then((readySys) => {
    for (let i = 0; i < 20; i++) {
      readySys.addMenuList({
        ...testapp,
        name: `测试按钮${i}`,
      });
    }
  });
});
</script>
<style scoped>
.outer {
  position: relative;
  top: 0px;
  width: 100vw;
  height: 100vh;
}
</style>
<style>
img,
svg {
  display: block;
  vertical-align: middle;
}

body {
  padding: 0;
  margin: 0;
  /* overflow: hidden; */
}
</style>
