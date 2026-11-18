<template>
  <div class="container">
    <div class="nav">
      <h2>更新和安全</h2>
      <button
        v-for="(item, index) in items"
        :key="item"
        type="button"
        :aria-current="index === activeIndex ? 'page' : undefined"
        @click="activeIndex = index"
      >
        {{ item }}
      </button>
    </div>
    <div class="setting">
      <div v-if="activeIndex === 0">
        <h1 class="setting-title">版本</h1>
        <p>当前版本 Vtron {{ sys.version }}</p>
        <p>Vtron 随站点更新，刷新页面后加载。</p>
      </div>
      <div v-else-if="activeIndex === 1">
        <div class="setting-item">
          <h1 class="setting-title">备份与恢复</h1>
        </div>
        <div class="setting-item">
          <label> 备份 </label>
          <div>
            <WinButtonVue @click="exportBackup">导出备份</WinButtonVue>
          </div>
        </div>
        <div class="setting-item">
          <label>恢复 </label>
          <div>
            <FileUploader :accept="'.zip'" @change="changeZipFile"></FileUploader>
            <br />
            <span class="tip"> {{ fileName }}</span>
          </div>
        </div>
        <div class="setting-item">
          <label> </label>
          <div>
            <WinButtonVue v-if="fileName" @click="importBackup('')">恢复备份</WinButtonVue>
          </div>
        </div>
      </div>
      <div v-else>
        <div class="setting-item">
          <h1 class="setting-title">ZIP 导入</h1>
        </div>
        <div class="setting-item">
          <label>目标本机路径 </label>
          <div>/<WinInput v-model="targetPath" placeholder="path"></WinInput></div>
        </div>
        <div class="setting-item">
          <label>zip文件</label>
          <div>
            <FileUploader :accept="'.zip'" @change="changeZipFile"></FileUploader>
            <br />
            <span class="tip"> {{ fileName }}</span>
          </div>
        </div>
        <div class="setting-item">
          <label> </label>
          <div>
            <WinButtonVue v-if="fileName" @click="importZipFile">导入</WinButtonVue>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { inject, ref } from 'vue';
import { Dialog, WinButtonVue, WinInput, join, System } from 'vtron';
import JSZip from 'jszip';
import FileSaver from 'file-saver';
import FileUploader from '../components/FileUploader.vue';

const activeIndex = ref(0);
const items = ['版本', '备份与恢复', 'ZIP 导入'];

const sys = inject<System>('system')!;
async function exportBackup() {
  const { setProgress } = Dialog.showProcessDialog({
    message: `正在打包`,
  });
  try {
    const zip = new JSZip();
    await dfsPackage('/', zip, setProgress);
    zip.generateAsync({ type: 'blob' }).then(function (content) {
      FileSaver.saveAs(content, 'backup.zip');
      setProgress(100);
    });
  } catch (error) {
    console.log(error);
    Dialog.showMessageBox({
      message: '打包失败',
      type: 'error',
    }).finally(() => {
      zipFile = undefined;
      fileName.value = '';
      setProgress(100);
    });
  }
}
async function dfsPackage(path: string, zip: JSZip, setProgress: any) {
  const dir = await sys.fs.readdir(path);

  for (let i = 0; i < dir.length; i++) {
    const item = dir[i];
    const stat = await sys.fs.stat(item.path);
    setProgress(Math.max((i / dir.length) * 100 - 0.1, 0.1));
    if (stat) {
      if (stat.isDirectory) {
        await dfsPackage(item.path, zip, setProgress);
      } else {
        const content = await sys.fs.readFile(item.path);
        try {
          atob(content || '');
          zip.file(item.path, content || '', {
            base64: true,
          });
        } catch (error) {
          zip.file(item.path, content || '');
        }
      }
    }
  }
}

let zipFile: File | undefined = undefined;
const fileName = ref('');
async function changeZipFile(ev: Event) {
  const tar = ev.target as HTMLInputElement;
  if (tar.files?.[0]) {
    zipFile = tar.files[0];
    fileName.value = zipFile?.name;
  } else {
    zipFile = undefined;
    fileName.value = '';
  }
}
async function importBackup(path = '') {
  if (!zipFile) {
    return;
  }
  const { setProgress } = Dialog.showProcessDialog({
    message: '正在恢复备份',
  });
  try {
    const unziped = await JSZip.loadAsync(zipFile);
    const unzipArray: Array<JSZip.JSZipObject> = [];
    unziped.forEach((relativePath, zipEntry) => {
      unzipArray.push(zipEntry);
    });
    for (let i = 0; i < unzipArray.length; i++) {
      const zipEntry = unzipArray[i];
      setProgress((i / unzipArray.length) * 100);
      if (zipEntry.dir) {
        await sys.fs.mkdir(join(path, zipEntry.name));
      } else {
        const fileC = await zipEntry.async('text');
        sys.fs.writeFile(join(path, zipEntry.name), fileC);
      }
    }
    setProgress(100);
  } catch (e) {
    console.log(e);
    setTimeout(() => {
      Dialog.showMessageBox({
        message: '恢复失败',
        type: 'error',
      }).finally(() => {
        zipFile = undefined;
        fileName.value = '';
        setProgress(100);
      });
    }, 100);
  }
}

const targetPath = ref('');

async function importZipFile() {
  if (await sys.fs.exists(join('/' + targetPath.value))) {
    await importBackup('/' + targetPath.value);
  } else {
    Dialog.showMessageBox({
      message: '目标路径不存在',
      type: 'error',
    });
  }
}
</script>
<style scoped>
.container {
  display: flex;
  flex-direction: row;
  height: calc(100% - 40px);
  user-select: none;
}

.nav {
  width: var(--settings-sidebar-width, 200px);
  flex-shrink: 0;
  overflow: auto;
  background: #f0f0f0;
}
.nav h2 {
  margin: 22px 16px 14px;
  font-size: 15px;
  font-weight: 600;
}
.nav button {
  position: relative;
  display: block;
  width: 100%;
  min-height: 44px;
  padding: 8px 16px;
  border: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  font-size: 14px;
  text-align: left;
}
.nav button:hover,
.nav button:focus-visible {
  background: #e1e1e1;
}
.nav button[aria-current]::before {
  content: '';
  position: absolute;
  inset: 11px auto 11px 0;
  width: 3px;
  background: #0078d7;
}

.setting {
  /* flex: 1; */
  min-width: 0;
  padding: 18px 28px 30px;
  width: 100%;
  background-color: white;
  overflow-y: auto;
}

.setting-title {
  margin: 0 0 22px;
  font-size: 28px;
  font-weight: 400;
  line-height: 1.3;
  display: flex;
  justify-content: flex-start;
  width: 100%;
}

.setting-item {
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  align-items: flex-start;
  margin-bottom: 20px;
  gap: 20px;
}
.tip {
  font-size: 12px;
  color: #999;
}
.setting-item label {
  display: block;
  width: 130px;
  flex-shrink: 0;
  text-align: right;
}
</style>
