<!--
 * @Author: Royal
 * @LastEditTime: 2022-09-26 17:06:14
 * @Description: 1
-->
<template>
  <div class="outer">
    <VtronComputer :system="system"></VtronComputer>
    <!-- 一定需要引入Win10组件，组件已经在use时注册了 -->
  </div>
  <a style="display: none" href="https://beian.miit.gov.cn/">豫ICP备19041315号</a>
</template>

<script lang="ts" setup>
import { desktopConfig, magnetConfig } from './DesktopSet';

import { System, BrowserWindow, Notify, VtronComputer } from 'vtron';
import { vtronPlus } from 'vtron-plus';
import MarkDown from './components/apps/MarkDown.vue';
import 'vtron-plus/distlib/style.css';
import backimg from './assets/back.jpg';
import beaticon from './assets/beat.ico';
import markdownicon from './assets/markdown.png';
import onetocicon from './assets/onetoc.png';
import signalicon from './assets/signal.png';
import OpenSource from './components/apps/OpenSource.vue';
import CreateUrl from './components/apps/CreateUrl.vue';

import { mountWebdav } from './hook/mountWebdav';
// import { mountOpener } from './hook/mountOpener';
// 在App中组织桌面图标t
// 先清空再添加，防止热更新加入多重图标

const system = new System({
  id: 0,
  desktop: [
    ...addListToDesktop(desktopConfig),
    {
      name: '小工具',
      type: 'group',
      group: [...addListToDesktop(magnetConfig)],
    },
  ],
  magnet: [...addListToDesktop(magnetConfig)],
  menulist: [
    {
      name: '开源项目',
      icon: beaticon,
      window: {
        title: '开源项目',
        width: 500,
        height: 400,
        center: true,
        content: OpenSource,
        resizable: false,
      },
    },
  ],
  background: backimg,
  lang: 'zh-CN',
});

system.whenReady().then((readySystem) => {
  // if (readySystem.version !== "0.4.4") {
  //   system.recover();
  // }

  readySystem.use(vtronPlus());

  readySystem.fs.writeFile(
    '/C/Users/Desktop/使用教程.md',
    `# hello, 欢迎使用Vtron WebOS!

这可能是目前最具扩展性的webos!

## 欢迎加入qq群 712921211

## 已经更新至 ${readySystem.version}

#### 更新之后建议开始菜单->恢复。请自己保留重要数据

  本地上传的文件不会存储在服务端，文件都在本地保存

## 更新系统备份，和文件导入！
在系统设置-备份和恢复中，可以下载整个系统的文件，或者导入zip文件中的文件到系统中!

## 更新Python

可以执行Python脚本和创建Python文件


## 更新日程

在右下角日历中可以添加日程，到时间时会提醒

## 更新图库和音乐库

可以简单的管理图片和音乐

## NoteMd

NoteMd是和vtron契合的笔记软件

可以快捷的管理文档

## 他可以记录你的文档

自带文件系统，只要你的电脑还在，这份文件就保存着

支持拖拽上传mp4，mp3，xls，txt，docx文件

（不包括一些破坏性的操作）


## 终端

和linux一致的体验

输入经典的命令，ls，cd，help，sh，甚至node

## 万能的文件类型

右键打开文件的属性，就能修改文件的名称

也可以使用ppt，markdown 应用创建新的文件

## 遇到文件问题？

尝试点击电源->恢复

进行恢复出厂设置，必要时清空浏览器缓存

## 想要更多的功能？

如果你熟悉Vue3开发，请和我们一起建设

如果你不太熟悉开发，但是有想要的功能，就在Github评论区中留言吧

[https://github.com/royalknight56/vtron](https://github.com/royalknight56/vtron)`
  );

  //   readySystem.fs.writeFile(
  //     '/C/Users/Desktop/Webdav使用教程.md',
  //     `# Webdav使用教程
  // ## 设置

  // 点击左下角开始菜单->设置->Webdav设置

  // 需要填写webdav的链接，用户名，密码

  // 推荐使用alist客户端

  // 挂载路径推荐写一级路径，如：/D

  // 挂载路径必须与webdav的文件夹相同

  // 填写好信息后，点击确定，重启

  // ## 使用

  // 挂载成功后，可以在文件管理器（我的电脑）中看到挂载的文件夹
  //     `
  //   );
  setTimeout(() => {
    if (readySystem.isFirstRun) {
      readySystem.openFile('/C/Users/Desktop/使用教程.md');
    }
  }, 1200);

  mountWebdav(system);
  localStorage.getItem('user') || localStorage.setItem('user', new Date().getTime().toString());

  // mountOpener(system);
  readySystem.setConfig('contextMenus', [
    {
      label: '新建.py文件',
      async click() {
        const ifstat = await readySystem.fs.stat('/C/Users/Desktop/新建文件.py');
        if (ifstat) {
          let i = 1;
          while (i < 10) {
            const ifstat = await readySystem.fs.stat(`/C/Users/Desktop/新建文件(${i}).py`);
            if (ifstat) {
              i++;
            } else {
              readySystem.fs.writeFile(`/C/Users/Desktop/新建文件(${i}).py`, `print('hello, world')`);
              break;
            }
          }
          return;
        } else {
          readySystem.fs.writeFile(`/C/Users/Desktop/新建文件.py`, `print('hello, world')`);
        }
      },
    },

    {
      label: '新建.md文件',
      async click() {
        const ifstat = await readySystem.fs.stat('/C/Users/Desktop/新建文件.md');
        if (ifstat) {
          let i = 1;
          while (i < 10) {
            const ifstat = await readySystem.fs.stat(`/C/Users/Desktop/新建文件(${i}).md`);
            if (ifstat) {
              i++;
            } else {
              readySystem.fs.writeFile(`/C/Users/Desktop/新建文件(${i}).md`, `# 新建文件`);
              break;
            }
          }
          return;
        } else {
          readySystem.fs.writeFile(`/C/Users/Desktop/新建文件.md`, `# 新建文件`);
        }
      },
    },
    {
      label: '新建网络链接',
      click() {
        new BrowserWindow({
          title: '创建网络链接',
          icon: signalicon,
          width: 500,
          height: 400,
          center: true,
          content: CreateUrl,
          resizable: false,
        }).show();
      },
    },
  ]);
  readySystem.registerFileOpener('.md', {
    icon: onetocicon,
    func: async (path) => {
      const content = (await readySystem.fs.readFile(path)) || '';
      new BrowserWindow({
        title: path,
        icon: markdownicon,
        width: 800,
        height: 600,
        resizable: true,
        center: true,
        content: MarkDown,
        config: {
          path: path,
          content: content,
        },
      }).show();
    },
  });

  setTimeout(() => {
    new Notify({
      title: `已经更新至 ${readySystem.version}`,
      content: `欢迎加入qq群 712921211`,
      timeout: 10000,
    });
  }, 100);
});
function addListToDesktop(list: any[]) {
  const res: any[] = [];
  list.forEach((item) => {
    res.push({
      name: item.title,
      icon: item.icon,
      window: {
        title: item.title,
        icon: item.icon,
        width: item.width,
        height: item.height,
        resizable: item.resizable,
        center: item.center,
        backgroundColor: item.backgroundColor,
        content: item.content,
        textColor: item.textColor,
      },
    });
  });
  return res;
}
</script>

<style>
body {
  margin: 0;
  padding: 0;
}
</style>
<style scoped>
.outer {
  width: 100vw;
  height: 100vh;
}
</style>
