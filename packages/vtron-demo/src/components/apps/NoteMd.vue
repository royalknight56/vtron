<template>
  <div class="outer">
    <!-- <div class="left-tab">
      <div class="left-button"></div>
      <div class="left-button"></div>
    </div> -->
    <div class="file-tree">
      <div class="opt-group">
        <button class="create-button" @click="createMd" data-tip="新建文件">
          <svg
            t="1701871350488"
            class="icon"
            viewBox="0 0 1024 1024"
            version="1.1"
            xmlns="http://www.w3.org/2000/svg"
            p-id="2663"
            width="200"
            height="200"
          >
            <path
              d="M512 42.666667c259.2 0 469.333333 210.133333 469.333333 469.333333s-210.133333 469.333333-469.333333 469.333333S42.666667 771.2 42.666667 512 252.8 42.666667 512 42.666667z m0 74.666666C294.037333 117.333333 117.333333 294.037333 117.333333 512S294.037333 906.666667 512 906.666667 906.666667 729.962667 906.666667 512 729.962667 117.333333 512 117.333333z"
              fill="#2c2c2c"
              p-id="2664"
            ></path>
            <path
              d="M682.666667 474.666667a37.333333 37.333333 0 0 1 3.072 74.538666L682.666667 549.333333H341.333333a37.333333 37.333333 0 0 1-3.072-74.538666L341.333333 474.666667h341.333334z"
              fill="#2c2c2c"
              p-id="2665"
            ></path>
            <path
              d="M474.666667 341.333333a37.333333 37.333333 0 0 1 74.538666-3.072l0.128 3.072v341.333334a37.333333 37.333333 0 0 1-74.538666 3.072L474.666667 682.666667V341.333333z"
              fill="#2c2c2c"
              p-id="2666"
            ></path>
          </svg>
        </button>
        <button class="create-button" @click="createMdFloder" data-tip="新建文件夹">
          <svg
            t="1701871403487"
            class="icon"
            viewBox="0 0 1024 1024"
            version="1.1"
            xmlns="http://www.w3.org/2000/svg"
            p-id="2897"
            width="200"
            height="200"
          >
            <path
              d="M418.688 133.333333a122.666667 122.666667 0 0 1 93.013333 42.666667H785.066667a186.666667 186.666667 0 0 1 186.581333 181.162667l0.085333 5.504v17.92h-0.256c0.170667 1.429333 0.256 2.88 0.256 4.373333V789.333333a186.666667 186.666667 0 0 1-186.666666 186.666667H238.933333A186.666667 186.666667 0 0 1 52.266667 789.333333V320a186.666667 186.666667 0 0 1 186.666666-186.666667z m0 74.666667H238.933333A112 112 0 0 0 126.933333 320v469.333333c0 61.866667 50.133333 112 112 112h546.133334c61.866667 0 112-50.133333 112-112V422.272H615.04a122.666667 122.666667 0 0 1-113.834667-76.992l-1.834666-4.842667-35.413334-100.416a48 48 0 0 0-45.269333-32.021333zM448 688a37.333333 37.333333 0 0 1 3.072 74.538667L448 762.666667h-170.666667a37.333333 37.333333 0 0 1-3.072-74.538667L277.333333 688h170.666667z m337.066667-437.333333H546.88l22.912 64.917333a48 48 0 0 0 41.685333 31.914667l3.562667 0.128 281.024-0.021334a112.021333 112.021333 0 0 0-106.389333-96.853333l-4.608-0.085333z"
              fill="#000000"
              p-id="2898"
            ></path>
          </svg>
        </button>
      </div>

      <FileTree
        :chosen-path="chosenTreePath"
        mode="list"
        :on-open="onTreeOpen"
        :file-list="rootFileList"
        :key="random"
      >
      </FileTree>
    </div>
    <div class="start" v-if="!chosenTreePath || chosenIsDirectory">左侧选择md文档，请注意随时保存</div>
    <mavon-editor v-else class="editor" v-model="value" @save="save" />
  </div>
</template>
<script setup lang="ts">
import { BrowserWindow, Notify, VtronFile, VtronFileWithoutContent, basename, join, useSystem } from 'vtron';
import { inject, onMounted, ref } from 'vue';
import FileTree from './comp/FileTree.vue';
const value = ref('# hello, markdown!');
const sys = useSystem();
const win = inject<BrowserWindow>('browserWindow');
const chosenTreePath = ref(join(sys._options.userLocation || '', 'Note'));
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
  await sys.fs.mkdir(join(sys._options.userLocation || '', 'Note'));
  sys.fs.readdir(join(sys._options.userLocation || '', 'Note')).then((file) => {
    if (file) {
      rootFileList.value = [...file];
      random.value = random.value + 1;
    }
  });
}
async function createMd() {
  const path = join(chosenTreePath.value, 'Untitled.md');
  if (await sys.fs.exists(join(chosenTreePath.value, 'Untitled.md'))) {
    new Notify({
      title: '创建失败',
      content: '已存在同名文件',
    });
    return;
  }
  sys.fs.writeFile(join(chosenTreePath.value, 'Untitled.md'), '# hello, markdown!').then((res) => {
    sys.fs.readdir(join(sys._options.userLocation || '', 'Note')).then((file) => {
      if (file) {
        rootFileList.value = [...file];
        random.value = random.value + 1;
      }
    });
  });
}
function createMdFloder() {
  sys.fs.mkdir(join(sys._options.userLocation || '', 'Note', 'Untitled')).then((res) => {
    sys.fs.readdir(join(sys._options.userLocation || '', 'Note')).then((file) => {
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
    path = '/C/Users/Note/Untitled.md';
  }
  sys?.fs.writeFile(path, markdown).then((res) => {
    new Notify({
      title: '保存成功',
      content: '文件已保存',
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
  border-top: 1px solid #ccc;
}
.opt-group {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 50px;
  border-bottom: 1px solid #ccc;
}
.create-button {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 40px;
  height: 40px;
  font-size: var(--ui-font-size);
  border: 1px solid transparent;
  margin: 2px;
  user-select: none;
  cursor: pointer;
  border-radius: 50%;
}
.create-button:after {
  position: absolute;
  left: 100%;
  content: attr(data-tip); /*后去要提示的文本*/
  padding: 5px;
  white-space: nowrap; /*强制不换行*/
  background-color: #000000; /*提示框背景颜色*/
  color: #ffffff; /*提示字体颜色*/
  opacity: 0;
  pointer-events: none;
}

.create-button:hover:after {
  opacity: 1; /*鼠标放上时透明度为完全显示*/
  z-index: 1000;
}

.create-button svg {
  width: 20px;
  height: 20px;
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
