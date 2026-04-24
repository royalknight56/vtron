<!--
 * @author vtron-nas
 * NAS 系统根组件
 * 未登录时显示登录页，登录后显示 vtron 桌面
-->
<template>
  <div class="nas-root">
    <!-- 未登录 -->
    <LoginPage v-if="!loggedIn" @loginSuccess="onLoginSuccess" />
    <!-- 已登录 -- vtron 桌面 -->
    <VtronComputer v-else :system="system!" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, markRaw, shallowRef } from 'vue';
import { System, VtronComputer } from 'vtron';
import 'vtron/distlib/style.css';
import { RemoteFileSystem } from './fs/RemoteFileSystem';
import { getToken, removeToken } from './api/client';
import { getMe } from './api/auth';
import LoginPage from './components/LoginPage.vue';
import FileManager from './apps/FileManager.vue';
import TrashBin from './apps/TrashBin.vue';
import ShareManager from './apps/ShareManager.vue';
import StorageInfo from './apps/StorageInfo.vue';
import Terminal from './apps/Terminal.vue';
import UserSettings from './apps/UserSettings.vue';

const loggedIn = ref(false);
const system = shallowRef<System | null>(null);

/** 登录成功后初始化 vtron 系统 */
function onLoginSuccess(user: any) {
  loggedIn.value = true;
  initSystem();
}

/** 创建 vtron System 实例 */
function initSystem() {
  const remoteFs = new RemoteFileSystem();

  const sys = new System({
    id: 1,
    logo: undefined,
    background: undefined,
    fs: remoteFs,
    builtinFeature: [
      'MyComputer',
      'DataTimeTray',
      'NetworkTray',
      'ImageOpener',
      'TextOpener',
      'ShortCutOpener',
      'ExeOpener',
      'Power',
      'MessageCenter',
      'Setting',
    ],
    desktop: [
      {
        name: '文件管理器',
        icon: undefined,
        window: {
          content: markRaw(FileManager),
          title: '文件管理器',
          icon: undefined,
          width: 900,
          height: 600,
          center: true,
          resizable: true,
        },
      },
      {
        name: '回收站',
        icon: undefined,
        window: {
          content: markRaw(TrashBin),
          title: '回收站',
          icon: undefined,
          width: 700,
          height: 500,
          center: true,
          resizable: true,
        },
      },
      {
        name: '分享管理',
        icon: undefined,
        window: {
          content: markRaw(ShareManager),
          title: '分享管理',
          icon: undefined,
          width: 700,
          height: 500,
          center: true,
          resizable: true,
        },
      },
      {
        name: '存储空间',
        icon: undefined,
        window: {
          content: markRaw(StorageInfo),
          title: '存储空间',
          icon: undefined,
          width: 400,
          height: 480,
          center: true,
        },
      },
      {
        name: '终端',
        icon: undefined,
        window: {
          content: markRaw(Terminal),
          title: '终端',
          icon: undefined,
          width: 800,
          height: 500,
          center: true,
          resizable: true,
        },
      },
    ],
    menulist: [
      {
        name: '用户设置',
        icon: undefined,
        window: {
          content: markRaw(UserSettings),
          title: '用户设置',
          icon: undefined,
          width: 500,
          height: 400,
          center: true,
        },
      },
    ],
    loginCallback: async (username: string, password: string) => {
      /* vtron 内置登录回调，此处直接放行（已通过我们自己的登录页认证） */
      return true;
    },
    noPassword: true,
  });

  system.value = sys;
}

/** 监听全局登出事件 */
window.addEventListener('vtron-nas-logout', () => {
  loggedIn.value = false;
  system.value?.shutdown();
  system.value = null;
});

/** 启动时检查是否已有有效 token */
onMounted(async () => {
  const token = getToken();
  if (token) {
    try {
      await getMe();
      loggedIn.value = true;
      initSystem();
    } catch {
      removeToken();
    }
  }
});
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}
html, body, #app {
  width: 100%;
  height: 100%;
  overflow: hidden;
}
</style>

<style scoped>
.nas-root {
  width: 100%;
  height: 100%;
  position: relative;
}
</style>
