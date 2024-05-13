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
      <div class="button" @click="backFolder()">{{ i18n('back') }}</div>
      <!-- 查看 -->
      <div class="button" @click="popoverChange()">{{ i18n('view') }}</div>
      <!-- <div class="button" @click="newFolder()">新建</div> -->
    </div>
    <div v-if="isPopoverView" class="up-pop">
      <UpPopover v-model="chosenView"></UpPopover>
    </div>
    <NavBar
      v-model="router_url"
      @backFolder="backFolder()"
      @refresh="handleNavRefresh"
      @search="handleNavSearch"
      @changeHistory="handleHistoryChange"
    ></NavBar>
  </div>
  <div class="main" @click="handleOuterClick">
    <div
      class="left-tree"
      :style="{
        width: leftWidth + 'px',
      }"
    >
      <QuickLink :on-open="onTreeOpen"></QuickLink>
      <FileTree
        :chosen-path="chosenTreePath"
        mode="list"
        :on-open="onTreeOpen"
        :on-refresh="onListRefresh"
        :file-list="rootFileList"
        :key="random"
      >
      </FileTree>
      <div class="left-handle" @mousedown="leftHandleDown"></div>
    </div>
    <div
      class="desk-outer"
      @contextmenu.self="showOuterMenu($event)"
      @dragenter.prevent
      @dragover.prevent
      @drop.stop="dragFileToDrop($event, router_url)"
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
import FileList from '@packages/application/components/FileList.vue';
import FileTree from '@packages/application/components/FileTree.vue';
import UpPopover from './components/UpPopover.vue';
import { VtronFileWithoutContent, dirname, useSystem, emitEvent, mountEvent } from '@packages/kernel';
import { i18n } from '@packages/ui';
import { useContextMenu } from '@packages/hook/useContextMenu';
import { Notify } from '@/packages/services/notification/Notification';
import { useFileDrag } from '@packages/hook/useFileDrag';
import { useComputer } from './hooks/useComputer';
import { Rect, useRectChosen } from '@/packages/hook/useRectChosen';
import { BrowserWindow } from '@/packages/services';
import NavBar from './components/NavBar.vue';
import QuickLink from './components/QuickLink.vue';

const { choseStart, chosing, choseEnd, getRect, Chosen } = useRectChosen();

const browserWindow: BrowserWindow | undefined = inject('browserWindow');
const config = browserWindow?.config;

const router_url = ref('');
const router_url_history = ref<Array<string>>([]);
const router_url_history_index = ref(0);
const currentList = ref<Array<VtronFileWithoutContent>>([]);

const system = useSystem();
const { dragFileToDrop } = useFileDrag(system);
const { createDesktopContextMenu } = useContextMenu();
const setRouter = function (path: string) {
  router_url.value = path;
  if (router_url_history_index.value <= router_url_history.value.length - 1) {
    router_url_history.value = router_url_history.value.slice(0, router_url_history_index.value + 1);
  }
  router_url_history_index.value = router_url_history.value.length;
  router_url_history.value.push(path);
};
const { refersh, createFolder, backFolder, openFolder, onComputerMount } = useComputer({
  setRouter: setRouter,
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
  search(keyword) {
    return system.fs.search(keyword);
  },
});
function handleHistoryChange(offset: number) {
  if (router_url_history_index.value + offset < 0) return;
  if (router_url_history_index.value + offset > router_url_history.value.length - 1) return;
  router_url_history_index.value = router_url_history_index.value + offset;
  router_url.value = router_url_history.value[router_url_history_index.value];

  refersh();
}
const leftWidth = ref(200);
function leftHandleDown(e: MouseEvent) {
  const startX = e.clientX;
  const startWidth = leftWidth.value;
  addEventListener('mousemove', leftHandleMove);
  addEventListener('mouseup', leftHandleUp);
  function leftHandleMove(e: MouseEvent) {
    const moveX = e.clientX - startX;
    if (startWidth + moveX < 100) return;
    if (startWidth + moveX > 500) return;
    leftWidth.value = startWidth + moveX;
  }
  function leftHandleUp() {
    removeEventListener('mousemove', leftHandleMove);
    removeEventListener('mouseup', leftHandleUp);
  }
}

const rootFileList = ref<Array<VtronFileWithoutContent>>([]);
const random = ref(0);
onMounted(() => {
  if (config) {
    router_url.value = config.path;
  } else {
    router_url.value = '/';
  }
  onComputerMount();
  mountEvent('file.props.edit', async () => {
    refersh();
  });
  mountEvent('computerpop.hidden', () => {
    isPopoverView.value = false;
  });
  system.fs.readdir('/').then((file) => {
    if (file) {
      rootFileList.value = [...file];
      random.value = random.value + 1;
    }
  });
});

function handleOuterClick() {
  emitEvent('mycomputer.click');
}

function onListRefresh() {
  refersh();
  system.fs.readdir('/').then((file) => {
    if (file) {
      rootFileList.value = [...file];
    }
  });
}

/**------视图切换------ */
const isPopoverView = ref(false);
function popoverChange() {
  isPopoverView.value = !isPopoverView.value;
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
  e.preventDefault();
  createDesktopContextMenu(e, router_url.value, () => {
    refersh();
  });
}
/* ------------ 路径输入框 ------------*/
async function handleNavRefresh(path: string) {
  if (path == '') return;
  if (path.startsWith('search:')) {
    setRouter(path);
    refersh();
    return;
  }

  const res = await system.fs.stat(path);
  if (res) {
    setRouter(path);
    refersh();
  } else {
    setRouter(dirname(path));
    refersh();
  }
}
async function handleNavSearch(path: string) {
  setRouter('search:' + path);
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
}
.main {
  display: flex;
  height: 100%;
  position: relative;
  top: 4px;
  .left-tree {
    position: relative;
    overflow-x: hidden;
    overflow-y: auto;
    width: var(--menulist-width);
    height: 100%;
    background-color: rgba(255, 255, 255, 0.1);
    border-right: 1px solid rgba(134, 134, 134, 0.267);
  }
  .left-handle {
    position: absolute;
    right: 0;
    top: 0;
    width: 4px;
    height: 100%;
    background: rgba(0, 0, 0, 0);
    cursor: ew-resize;
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
    overflow-x: hidden;
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
