<!--
 * @Author: Royal
 * @LastEditTime: 2022-01-27 15:13:59
 * @Description: 
 * @FilePath: /publishTest/src/components/apps/MyComputer.vue
-->
<template>
  <div class="uper">
    <div class="group">
      <!-- <div class="button">文件</div> -->
      <!-- <div class="button">计算机</div> -->

      <div class="button" @click="createFolderStart()">{{ i18n('new') }}</div>
      <div class="button" @click="backFolder()">{{ i18n('back') }}</div>
      <!-- 查看 -->
      <div class="button" @click="popoverChange()">{{ i18n('view') }}</div>
      <!-- <div class="button" @click="newFolder()">新建</div> -->
    </div>
    <div v-if="isView" class="up-pop">
      <UpPopover v-model="chosenView"></UpPopover>
    </div>
    <div class="uper_nav">
      <div class="uper_nav_button" @click="backFolder()">
        <svg
          t="1632984723698"
          class="icon"
          viewBox="0 0 1024 1024"
          version="1.1"
          xmlns="http://www.w3.org/2000/svg"
          p-id="10100"
        >
          <path
            d="M862.485 481.154H234.126l203.3-203.3c12.497-12.497 12.497-32.758 0-45.255s-32.758-12.497-45.255 0L135.397 489.373c-12.497 12.497-12.497 32.758 0 45.254l256.774 256.775c6.249 6.248 14.438 9.372 22.627 9.372s16.379-3.124 22.627-9.372c12.497-12.497 12.497-32.759 0-45.255l-203.3-203.301h628.36c17.036 0 30.846-13.81 30.846-30.846s-13.81-30.846-30.846-30.846z"
            p-id="10101"
          />
        </svg>
      </div>
      <div class="uper_nav_button" @click="backFolder()">
        <svg
          t="1632984737821"
          class="icon"
          viewBox="0 0 1024 1024"
          version="1.1"
          xmlns="http://www.w3.org/2000/svg"
          p-id="10249"
        >
          <path
            d="M885.113 489.373L628.338 232.599c-12.496-12.497-32.758-12.497-45.254 0-12.497 12.497-12.497 32.758 0 45.255l203.3 203.3H158.025c-17.036 0-30.846 13.811-30.846 30.846 0 17.036 13.811 30.846 30.846 30.846h628.36L583.084 746.147c-12.497 12.496-12.497 32.758 0 45.255 6.248 6.248 14.438 9.372 22.627 9.372s16.379-3.124 22.627-9.372l256.775-256.775a31.999 31.999 0 0 0 0-45.254z"
            p-id="10250"
          />
        </svg>
      </div>
      <div class="uper_nav_button uper_nav_button_small" @click="backFolder()">
        <svg
          t="1639145779758"
          class="icon"
          viewBox="0 0 1024 1024"
          version="1.1"
          xmlns="http://www.w3.org/2000/svg"
          p-id="3080"
        >
          <path
            d="M533.333333 516.266667l-174.933333-170.666667-64 59.733333 234.666667 234.666667L768 405.333333l-59.733333-59.733333-174.933334 170.666667z"
            fill="#444444"
            p-id="3081"
          />
        </svg>
      </div>
      <div class="uper_nav_button" @click="backFolder()">
        <svg
          t="1639145815176"
          class="icon"
          viewBox="0 0 1024 1024"
          version="1.1"
          xmlns="http://www.w3.org/2000/svg"
          p-id="3860"
        >
          <path
            d="M554.666667 268.8v601.6h-85.333334V268.8L337.066667 401.066667 277.333333 341.333333 512 106.666667 746.666667 341.333333l-59.733334 59.733334L554.666667 268.8z"
            fill="#444444"
            p-id="3861"
          />
        </svg>
      </div>

      <div @click="start_input()" v-if="path_state == 'pendding'" class="path">
        <span>{{ router_url }}</span>
      </div>
      <div @focusout="end_input()" v-if="path_state == 'inputing'" class="path_inputing">
        <input v-model="router_url" @blur="isVia(router_url)" />
      </div>
    </div>
  </div>
  <div class="main">
    <div class="left-tree">
      <FileTree
        :chosen-path="chosenTreePath"
        mode="list"
        :on-open="onTreeOpen"
        :on-refresh="onListRefresh"
        :file-list="rootFileList"
        :key="random"
      >
      </FileTree>
    </div>
    <div
      class="desk-outer"
      @contextmenu.self="showOuterMenu($event)"
      @dragenter.prevent
      @dragover.prevent
      @drop.stop="refFileDrop($event, router_url)"
      @click.self="onBackClick"
      @mousedown="backgroundDown"
    >
      <FileList
        :on-chosen="onChosen"
        :on-refresh="onListRefresh"
        :on-open="openFolder"
        :file-list="currentList"
        theme="blue"
        :mode="chosenView"
      >
      </FileList>

      <div draggable="true" class="desk-item" v-if="creating">
        <div class="item_img">
          <img draggable="false" width="50" :src="foldericon" />
        </div>
        <input class="item_input" v-model="createInput" @blur="creatingEditEnd" />
      </div>
      <Chosen></Chosen>
    </div>
  </div>
</template>
<script lang="ts" setup>
import { ref, onMounted, inject } from 'vue';
import foldericon from '@packages/assets/folder.png';

import FileList from '@feature/structure/share/FileList.vue';
import FileTree from '@feature/structure/share/FileTree.vue';
import UpPopover from './components/UpPopover.vue';
import { Notify } from '@feature/notification/Notification';
import { useSystem } from '@feature/system';
import { BrowserWindow, VtronFileWithoutContent } from '@packages/plug';
import { useContextMenu } from '@packages/hook/useContextMenu';
import { mountEvent } from '@feature/event';
import { i18n } from '@feature/i18n';
import { useFileDrag } from '@packages/hook/useFileDrag';
import { useComputer } from './hooks/useComputer';
import { Rect, useRectChosen } from '@/packages/hook/useRectChosen';

const { choseStart, chosing, choseEnd, getRect, Chosen } = useRectChosen();

const browserWindow: BrowserWindow | undefined = inject('browserWindow');
const config = browserWindow?.config;

const router_url = ref('');
const currentList = ref<Array<VtronFileWithoutContent>>([]);

const system = useSystem();
const { refFileDrop } = useFileDrag(system);
const { createNewFile, createNewDir, pasteFile } = useContextMenu();
const { isVia, refersh, createFolder, backFolder, openFolder, onComputerMount } = useComputer({
  setRouter(path) {
    router_url.value = path;
  },
  getRouter() {
    return router_url.value;
  },
  setFileList(list) {
    currentList.value = list;
  },
  openFile(path) {
    system?.openFile(path);
  },
  rmdir(path) {
    return system.fs.rmdir(path);
  },
  mkdir(path) {
    return system.fs.mkdir(path);
  },
  readdir(path) {
    return system.fs.readdir(path);
  },
  exists(path) {
    return system.fs.exists(path);
  },
  isDirectory(file) {
    return file.isDirectory;
  },
  notify(title, content) {
    new Notify({
      title,
      content,
    });
  },
});

const rootFileList = ref<Array<VtronFileWithoutContent>>([]);
const random = ref(0);
onMounted(() => {
  if (config) {
    router_url.value = config.path;
  } else {
    router_url.value = '/C';
  }
  onComputerMount();
  mountEvent('file.props.edit', async () => {
    refersh();
  });
  system.fs.readdir('/').then((file) => {
    if (file) {
      rootFileList.value = [...file];
      random.value = random.value + 1;
    }
  });
});

function onListRefresh() {
  refersh();
  system.fs.readdir('/').then((file) => {
    if (file) {
      rootFileList.value = [...file];
    }
  });
}

/**------视图切换------ */
const isView = ref(false);
function popoverChange() {
  isView.value = !isView.value;
}

const chosenView = ref('icon');

/**------树状列表打开------ */
const chosenTreePath = ref('');
async function onTreeOpen(path: string) {
  chosenTreePath.value = path;
  const file = await system.fs.stat(path);
  if (file) {
    openFolder(file);
  }
}

/**------框选--------- */
let chosenCallback: (rect: Rect) => void = () => {
  //
};
function onChosen(callback: (rect: Rect) => void) {
  chosenCallback = callback;
}

function backgroundDown(e: MouseEvent) {
  choseStart(e);
  addEventListener('mousemove', backgroundMove);
  addEventListener('mouseup', backgroundUp);
}
function backgroundMove(e: MouseEvent) {
  chosing(e);
  const rectValue = getRect();
  if (rectValue) {
    chosenCallback(rectValue);
  }
}
function backgroundUp() {
  choseEnd();
  const rectValue = getRect();
  if (rectValue) {
    chosenCallback(rectValue);
  }
  removeEventListener('mousemove', backgroundMove);
  removeEventListener('mouseup', backgroundUp);
}

/* ------------ 新建文件夹 ------------*/
const createInput = ref(i18n('new.folder'));
const creating = ref(false);
function createFolderStart() {
  // creating.value = true;
  createNewFile(router_url.value).then(() => {
    refersh();
  });
}
function creatingEditEnd() {
  if (creating.value) {
    createFolder(createInput.value);
    creating.value = false;
    createInput.value = i18n('new.folder');
  }
}
function onBackClick() {
  creatingEditEnd();
}
/* ------------ 新建文件夹end ---------*/

function showOuterMenu(e: MouseEvent) {
  system?.emitEvent('contextMenu.show', {
    mouse: e,
    menuList: [
      {
        name: i18n('new.file'),
        click: () => {
          createNewFile(router_url.value).then(() => {
            refersh();
          });
        },
      },
      {
        name: i18n('new.folder'),
        click: () => {
          createNewDir(router_url.value).then(() => {
            refersh();
          });
        },
      },
      {
        name: i18n('paste'),
        click: () => {
          pasteFile(router_url.value)?.then(() => {
            refersh();
          });
        },
      },
    ],
  });
}
/* ------------ 路径输入框 ------------*/
const path_state = ref('pendding');
function start_input() {
  path_state.value = 'inputing';
}
function end_input() {
  path_state.value = 'pendding';
  refersh();
}
/* ------------ 路径输入框end ---------*/
</script>
<style lang="scss" scoped>
.uper {
  /* height: 40px; */
  background-color: rgba(255, 235, 205, 0);
  font-size: 12px;
  font-weight: 300;
  /* border-bottom: 1px solid black; */
  --button-item-height: 30px;

  .uper_nav {
    height: var(--button-item-height);
    display: flex;
  }

  .uper_nav_button {
    width: calc(var(--button-item-height) - 10px);
    height: var(--button-item-height);
    line-height: var(--button-item-height);
    padding: 0px 4px;
    margin: 0 auto;
    flex-shrink: 0;
    text-align: center;
    filter: brightness(230%);
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .uper_nav_button_small {
    width: calc(var(--button-item-height) - 16px);
  }

  .uper_nav_button svg {
    width: calc(var(--button-item-height) - 16px);
    height: calc(var(--button-item-height) - 16px);
  }

  .path {
    height: calc(var(--button-item-height));
    width: 100%;
    line-height: calc(var(--button-item-height) - 6px);
    padding: 0px 5px;
    margin: 0px 2px;
    border: 1px solid rgba(134, 134, 134, 0.267);
    transition: all 0.1s;
    /* text-align: center; */
    overflow: auto;
    user-select: none;
  }

  .path span {
    height: var(--button-item-height);
    /* text-align: center; */
    line-height: var(--button-item-height);
  }

  .path_inputing {
    height: calc(var(--button-item-height));
    width: 100%;
    line-height: calc(var(--button-item-height) - 6px);
    padding: 0px 5px;
    margin: 0px 2px;
    border: 1px solid rgba(134, 134, 134, 0.267);
    transition: all 0.1s;
    user-select: text;
  }

  .path_inputing input {
    height: 100%;
    width: 100%;
    /* padding: 1px 5px; */
    /* text-align: center; */
    line-height: var(--button-item-height);
    background: none;
    border: none;
    outline: none;
  }

  .path:hover {
    border: 1px solid rgb(0, 102, 255);
  }
}
.main {
  display: flex;
  height: 100%;
  position: relative;
  top: 4px;
  .left-tree {
    overflow-x: hidden;
    overflow-y: auto;
    width: var(--menulist-width);
    height: 100%;
    background-color: rgba(255, 255, 255, 0.1);
    border-right: 1px solid rgba(134, 134, 134, 0.267);
  }
  .desk-outer {
    flex: 1;
    height: 100%;
    width: 100%;
    display: flex;
    flex-direction: row;
    align-items: flex-start;
    align-content: flex-start;
    flex-wrap: wrap;
    position: relative;
  }
}

.desk-item {
  position: relative;
  cursor: default;
  box-sizing: border-box;
  width: 70px;
  height: 100px;
  background-color: rgba(119, 119, 119, 0);
  color: white;
  border: 1px solid rgba(0, 0, 0, 0);
}
.chosen {
  border: 1px dashed #3bdbff3d;
  background-color: #b9e3fd90;
}
.desk-item:hover {
  border: 1px solid rgba(149, 149, 149, 0.233);
  background-color: #b9e3fd5a;
}

.item_img {
  width: 50px;
  height: 40px;
  overflow: hidden;
  padding: 10px;
  text-align: center;
}

.item_img img {
  user-select: none;
}

.item_name {
  overflow: hidden;
  max-width: 200px;
  color: rgba(0, 0, 0, 0.664);
  text-align: center;
  font-size: 14px;
  font-weight: 400;
  line-height: 20px;
  user-select: none;
  overflow: hidden;
  text-overflow: ellipsis;
  word-break: break-all;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.item_input {
  width: 100%;
}

.group {
  display: flex;
  border-bottom: 1px solid rgba(134, 134, 134, 0.267);

  user-select: none;
}

.button {
  cursor: pointer;
  text-align: center;
  width: 50px;
  transition: all 0.1s;
  background: #ffffff;
  font-family: sans-serif;
  font-size: 12px;
  padding: 0px 4px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: 0.1s;
  white-space: nowrap;
  user-select: none;
}

.button:hover {
  /* background-color: #137bd2; */
  background-color: #1b6bad;
  color: white;
}
</style>
