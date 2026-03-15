<!--
 * @Author: Royal
 * @LastEditTime: 2022-07-14 19:17:09
 * @Description: 
 * @FilePath: /myindex/src/App.vue
-->
<template>
  <div class="outer">
    <!-- <div v-if="!started" class="pick-dir-overlay">
      <template v-if="!restoring">
        <button class="pick-dir-btn" @click="pickDirectory">选择本地目录并启动</button>
      </template>
    </div> -->
    <VtronComputer :system="sys"></VtronComputer>
  </div>
</template>

<script setup lang="ts">
import testicon from './assets/终端.png';
import TestButton from './apps/TestButton.vue';
import VtronTest from './apps/VtronTest.vue';
import VtronPerfTest from './apps/VtronPerfTest.vue';
import TestUiButton from './apps/TestUiButton.vue';
import {
  System,
  VtronFile,
  VtronComputer,
  VtronMemoryFileSystem,
  VtronLocalFileSystem,
} from './packages/plug';
import vtronLogoIcon from './assets/vtron-icon-nobg.png';
import { Tray, Menu } from '@/packages/services';
import { ref, onMounted } from 'vue';

const started = ref(false);
const restoring = ref(true);
const fs = new VtronMemoryFileSystem('/');

// onMounted(async () => {
//   const restored = await fs.tryRestore();
//   if (restored) {
//     started.value = true;
//   }
//   restoring.value = false;
// });

// async function pickDirectory() {
//   await fs.openDirectoryPicker();
//   started.value = true;
// }

const sys = new System({
  // lang: 'en-US',
  id: 0,
  // lang: "zh-CN",
  logo: vtronLogoIcon,
  // background: 'https://picsum.photos/1920/1080',

  fs,
  // shell: new TestShell(),
  desktop: [
    {
      name: '测试23232342',
      // icon: testicon,
      window: {
        content: TestButton,
        title: '测试按钮',
        icon: testicon,
        center: true,
        // frame: false,
        // backgroundColor: "rgba(0,0,0,1)",
      },
      order: 1,
    },

    {
      name: 'VtronGroup测试',
      type: 'group',
      group: [
        {
          name: 'Vtron1',
          icon: testicon,
          window: {
            content: VtronPerfTest,
            title: 'Vtron自动性能测试',
            icon: testicon,
            center: true,
          },
        },
        {
          name: '2',
          icon: testicon,
          window: {
            content: VtronPerfTest,
            title: 'Vtron自动性能测试',
            icon: testicon,
            center: true,
          },
        },
        {
          name: '3',
          icon: testicon,
          window: {
            content: VtronPerfTest,
            title: 'Vtron自动性能测试',
            icon: testicon,
            center: true,
          },
        },
        {
          name: '4',
          icon: testicon,
          window: {
            content: VtronPerfTest,
            title: 'Vtron自动性能测试',
            icon: testicon,
            center: true,
          },
        },
        {
          name: '5',
          icon: testicon,
          window: {
            content: VtronPerfTest,
            title: 'Vtron自动性能测试',
            icon: testicon,
            center: true,
          },
        },
      ],
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
    {
      name: 'Vtron测试UI-按钮',
      icon: testicon,
      window: {
        content: TestUiButton,
        title: 'Vtron测试UI-按钮',
        icon: testicon,
        center: true,
      },
    },
  ],
  magnet: [
    {
      name: '测试2',
      // icon: testicon,
      window: {
        content: TestButton,
        title: '测试按钮',
        icon: testicon,
        center: true,
        // frame: false,
        // backgroundColor: "rgba(0,0,0,1)",
      },
      order: 1,
    },

    {
      name: 'VtronGroup测试',
      type: 'group',
      group: [
        {
          name: 'Vtron1',
          icon: testicon,
          window: {
            content: VtronPerfTest,
            title: 'Vtron自动性能测试',
            icon: testicon,
            center: true,
          },
        },
        {
          name: '2',
          icon: testicon,
          window: {
            content: VtronPerfTest,
            title: 'Vtron自动性能测试',
            icon: testicon,
            center: true,
          },
        },
        {
          name: '3',
          icon: testicon,
          window: {
            content: VtronPerfTest,
            title: 'Vtron自动性能测试',
            icon: testicon,
            center: true,
          },
        },
        {
          name: '4',
          icon: testicon,
          window: {
            content: VtronPerfTest,
            title: 'Vtron自动性能测试',
            icon: testicon,
            center: true,
          },
        },
        {
          name: '5',
          icon: testicon,
          window: {
            content: VtronPerfTest,
            title: 'Vtron自动性能测试',
            icon: testicon,
            center: true,
          },
        },
      ],
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
    {
      name: 'Vtron测试UI-按钮',
      icon: testicon,
      window: {
        content: TestUiButton,
        title: 'Vtron测试UI-按钮',
        icon: testicon,
        center: true,
      },
    },
  ],
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
  readySys.setAppOrder('Desktop', [
    {
      name: '此电脑',
      order: 4,
    },
    {
      name: '应用商店',
      order: 2,
    },
  ]);

  const memoryFs: Record<string, VtronFile> = {
    '/': {
      name: '/',
      isDirectory: true,
      isFile: false,
      content: '',
      path: '/',
      parentPath: '',
      isSymlink: false,
      size: 0,
      mode: 0o777,
      rdev: 1,
      mtime: new Date(),
      atime: new Date(),
      birthtime: new Date(),
    },
    '/D': {
      name: 'D',
      isDirectory: true,
      isFile: false,
      content: '',
      path: '/D',
      parentPath: '/',
      isSymlink: false,
      size: 0,
      mode: 0o777,
      rdev: 1,
      mtime: new Date(),
      atime: new Date(),
      birthtime: new Date(),
    },
  };
  sys.registerSettingPanel({
    key: 'test',
    title: `测试`,
    desc: '测试',
    content: TestButton,
    icon: testicon,
  });
  const aTray = new Tray({
    image: '/C/ic.png',
  });
  aTray.setContextMenu(
    Menu.buildFromTemplate([
      {
        label: '测试',
        click: () => {
          console.log('测试');
        },
      },
    ])
  );

  new Tray({
    image: '/C/ic.png',
  }).setContextMenu(TestButton, 200, 200);
  const cT = new Tray({
    image: '/C/ic.png',
  });
  cT.setContextMenu(TestButton, 200, 200);

  setTimeout(() => {
    cT.destroy();
  }, 1000);

  // sys.mountVolume('/D', new VtronFileSystem('/D', '2'));
  sys.mountVolume('/D', {
    isFirstRun: false,
    name: 'exist',
    // mountVolume(path, volume) {},
    whenReady: async () => {
      return memoryFs as any;
    },
    on(event, callback) {
      console.log(event, callback);
    },
    copyFile: async (src: string, dest: string) => {
      console.log(src, dest);
    },
    readFile: async (path: string) => {
      return memoryFs[path]?.content;
    },
    writeFile: async (path: string, content: string) => {
      memoryFs[path] = {
        ...memoryFs[path],
        content,
        path,
        parentPath: path,
        isSymlink: false,
        isFile: true,
        isDirectory: false,
        size: 0,
        mtime: new Date(),
        atime: new Date(),
        birthtime: new Date(),
      };
      console.log('readFile', memoryFs);
    },
    appendFile: async (path: string, content: string) => {
      memoryFs[path] = {
        ...memoryFs[path],
        content: memoryFs[path].content + content,
      };
    },
    readdir: async (path: string) => {
      // console.log(path);
      return Object.keys(memoryFs)
        .filter((p) => memoryFs[p].parentPath === path)
        .map((p) => memoryFs[p]);
    },
    exists: async (path: string) => {
      return !!memoryFs[path];
    },
    stat: async (path: string) => {
      return memoryFs[path];
    },
    chmod: async (path, mode) => {
      console.log(path, mode);
    },
    unlink: async (path: string) => {
      delete memoryFs[path];
    },
    rename: async (oldPath: string, newPath: string) => {
      memoryFs[newPath] = memoryFs[oldPath];
      delete memoryFs[oldPath];
    },
    rmdir: async (path: string) => {
      delete memoryFs[path];
    },
    mkdir: async (path: string) => {
      memoryFs[path] = {
        name: path.split('/').pop() as string,
        isDirectory: true,
        isFile: false,
        content: '',
        path,
        parentPath: path,
        isSymlink: false,
        size: 0,
        mode: 0o777,
        rdev: 1,
        mtime: new Date(),
        atime: new Date(),
        birthtime: new Date(),
      };
    },
    async search(keyword) {
      console.log(keyword);
      return [];
    },
    serializeFileSystem: async () => {
      return memoryFs;
    },
    deserializeFileSystem: async (files: any) => {
      Object.keys(files).forEach((path) => {
        memoryFs[path] = files[path];
      });
    },
    removeFileSystem: async () => {
      Object.keys(memoryFs).forEach((path) => {
        delete memoryFs[path];
      });
    },
    registerWatcher: (path: RegExp, callback: (path: string, content: string) => void) => {
      console.log(path, callback);
    },
    rm: function (path: string): Promise<void> {
      throw new Error('Function not implemented.');
    },
  });
  for (let i = 0; i < 20; i++) {
    readySys.addMenuList({
      ...testapp,
      name: `测试按钮${i}`,
    });
  }
});
</script>
<style scoped>
.outer {
  position: relative;
  top: 0px;
  width: 100vw;
  height: 100vh;
}
.pick-dir-overlay {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background: #1a1a2e;
}
.pick-dir-btn {
  padding: 16px 40px;
  font-size: 18px;
  color: #fff;
  cursor: pointer;
  background: #0078d4;
  border: none;
  border-radius: 8px;
  transition: background 0.2s;
}
.pick-dir-btn:hover {
  background: #005a9e;
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
