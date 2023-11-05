<template>
  <div class="outer">
    <div class="file-tree">
      <button class="create-button" @click="createMd">新建文档</button>
      <button class="create-button" @click="createMdFloder">新建文档夹</button>

      <FileTree
        :chosen-path="chosenTreePath"
        mode="list"
        :on-open="onTreeOpen"
        :file-list="rootFileList"
        :key="random"
      >
      </FileTree>
    </div>
    <div class="start" v-if="!chosenTreePath || chosenIsDirectory">
      左侧选择文档
    </div>
    <mavon-editor v-else class="editor" v-model="value" @save="save" />
  </div>
</template>
<script setup lang="ts">
import {
  BrowserWindow,
  Notify,
  VtronFile,
  VtronFileWithoutContent,
  basename,
  join,
  useSystem,
} from "vtron";
import { inject, onMounted, ref } from "vue";
import FileTree from "./comp/FileTree.vue";
const value = ref("# hello, markdown!");
let sys = useSystem();
let win = inject<BrowserWindow>("browserWindow");
const chosenTreePath = ref(join(sys._options.userLocation || "", "Note"));
const chosenIsDirectory = ref(true);
function onTreeOpen(path?: string, isDirectory?: boolean) {
  if (path) {
    chosenTreePath.value = path;
    chosenIsDirectory.value = isDirectory || false;
    if (isDirectory) {
      return;
    }

    sys.fs.readFile(path).then((res) => {
      if (res) {
        value.value = res;
      }
    });
  } else {
    refersh();
  }
}

const rootFileList = ref<Array<VtronFileWithoutContent>>([]);
const random = ref(0);
onMounted(async () => {
  refersh();
});
async function refersh() {
  await sys.fs.mkdir(join(sys._options.userLocation || "", "Note"));
  sys.fs.readdir(join(sys._options.userLocation || "", "Note")).then((file) => {
    if (file) {
      rootFileList.value = [...file];
      random.value = random.value + 1;
    }
  });
}
async function createMd() {
  const path = join(chosenTreePath.value, "Untitled.md");
  if (await sys.fs.exists(join(chosenTreePath.value, "Untitled.md"))) {
    new Notify({
      title: "创建失败",
      content: "已存在同名文件",
    });
    return;
  }
  sys.fs
    .writeFile(join(chosenTreePath.value, "Untitled.md"), "# hello, markdown!")
    .then((res) => {
      sys.fs
        .readdir(join(sys._options.userLocation || "", "Note"))
        .then((file) => {
          if (file) {
            rootFileList.value = [...file];
            random.value = random.value + 1;
          }
        });
    });
}
function createMdFloder() {
  sys.fs
    .mkdir(join(sys._options.userLocation || "", "Note", "Untitled"))
    .then((res) => {
      sys.fs
        .readdir(join(sys._options.userLocation || "", "Note"))
        .then((file) => {
          if (file) {
            rootFileList.value = [...file];
            random.value = random.value + 1;
          }
        });
    });
}
function save(markdown: string, html: string) {
  let path = chosenTreePath.value;

  if (!path) {
    path = "/C/Users/Note/Untitled.md";
  }
  sys?.fs.writeFile(path, markdown).then((res) => {
    new Notify({
      title: "保存成功",
      content: "文件已保存",
    });
  });
}
</script>
<style scoped>
.outer {
  display: flex;
  height: 100%;
}
.file-tree {
  width: 200px;
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  border-right: 1px solid #ccc;
}
.create-button {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 200px;
  font-size: var(--ui-font-size);
  border: 1px solid transparent;
  margin: 2px;
  user-select: none;
  cursor: pointer;
}
.create-button:hover {
  background-color: #b1f1ff4c;
}

.editor {
  height: 100%;
  width: 100%;
  flex: 1;
}
.start {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  flex: 1;
}
</style>
