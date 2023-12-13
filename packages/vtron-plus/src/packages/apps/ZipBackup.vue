<template>
  <div class="container">
    <div class="nav">
      <ul>
        <li
          v-for="(item, index) in items"
          :key="index"
          @click="selectItem(index)"
          :class="{ active: index === activeIndex }"
        >
          {{ item }}
        </li>
      </ul>
    </div>
    <div class="setting">
      <div v-if="0 === activeIndex">
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
            <WinButtonVue @click="importBackup">恢复备份</WinButtonVue>
          </div>
        </div>
      </div>
      <div v-if="1 === activeIndex">
        <div class="setting-item">
          <h1 class="setting-title">导入文件</h1>
        </div>
        <div class="setting-item">
          <label>导入 </label>
          <div></div>
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
            <WinButtonVue @click="importZipFile">导入</WinButtonVue>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref } from 'vue';
import { Dialog, WinButtonVue, useSystem, WinInput, join } from 'vtron';
import * as JSZip from 'jszip';
import * as FileSaver from 'file-saver';
import FileUploader from '../components/FileUploader.vue';

const activeIndex = ref(0);
const items = [
  '备份和恢复',
  '导入文件',
  // '版本',
];
const selectItem = (index: number) => {
  activeIndex.value = index;
};

const sys = useSystem();
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
    Dialog.showMessageBox({
      message: '打包失败',
      type: 'error',
    }).then(() => {
      setProgress(100);
    });
  }
}
async function dfsPackage(path: string, zip: JSZip, setProgress: any) {
  const dir = await sys.fs.readdir(path);

  for (let i = 0; i < dir.length; i++) {
    const item = dir[i];
    const stat = await sys.fs.stat(item.path);
    setProgress((i / dir.length) * 100);
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
  if (tar.files) {
    zipFile = tar.files[0];
    fileName.value = zipFile.name;
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
        const fileC = await zipEntry.async('base64');
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
      }).then(() => {
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
<style scoped lang="scss">
.outer {
  position: absolute;
  width: calc(100% - 200px);
  height: 100%;
  left: 200px;
  background-color: #fff;
}

.container {
  display: flex;
  flex-direction: row;
  height: calc(100% - 40px);
  user-select: none;
}

.nav {
  width: 200px;
  flex-shrink: 0;
}
.nav ul {
  list-style: none;
  margin: 0;
  padding: 0;
}

.nav li {
  cursor: pointer;
  padding: 10px 20px;
  font-size: 14px;
  position: relative;
}

.nav li.active {
  background-color: #cccccc62;
  transition: all 0.1s;
}
.nav li.active:hover {
  background-color: var(--color-dark-light);
}
.nav li.active::after {
  content: '';
  display: block;
  width: 4px;
  height: 60%;
  background-color: var(--color-dark);
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
}

.setting {
  /* flex: 1; */
  padding: 0 20px;
  width: 100%;
  background-color: white;
  overflow-y: auto;
}

.setting-title {
  font-size: 24px;
  font-weight: 300;
  margin-bottom: 20px;
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
