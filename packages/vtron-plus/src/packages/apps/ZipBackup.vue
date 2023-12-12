<template>
  <div class="container">
    <div class="nav">
      <ul>
        <li class="active">备份与恢复</li>
      </ul>
    </div>
    <div class="setting">
      <div>
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
            <input type="file" id="backupfile" name="file" />
          </div>
        </div>
        <div class="setting-item">
          <label> </label>
          <div>
            <WinButtonVue @click="importBackup">恢复备份</WinButtonVue>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { Dialog, WinButtonVue, useSystem } from 'vtron';
import * as JSZip from 'jszip';
import * as FileSaver from 'file-saver';
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
        zip.file(item.path, content || '');
      }
    }
  }
}
async function importBackup() {
  const evt = document.getElementById('backupfile') as any;
  const files = evt.files;
  if (!files[0]) {
    return;
  }
  const { setProgress } = Dialog.showProcessDialog({
    message: '正在恢复备份',
  });
  try {
    const unziped = await JSZip.loadAsync(files[0]);
    const unzipArray: Array<JSZip.JSZipObject> = [];
    unziped.forEach((relativePath, zipEntry) => {
      unzipArray.push(zipEntry);
    });
    for (let i = 0; i < unzipArray.length; i++) {
      const zipEntry = unzipArray[i];
      setProgress((i / unzipArray.length) * 100);
      if (zipEntry.dir) {
        await sys.fs.mkdir(zipEntry.name);
      } else {
        const fileC = await zipEntry.async('string');
        sys.fs.writeFile(zipEntry.name, fileC);
      }
    }
    setProgress(100);
  } catch (e) {
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

.setting-item label {
  display: block;
  width: 130px;
  flex-shrink: 0;
  text-align: right;
}
</style>
