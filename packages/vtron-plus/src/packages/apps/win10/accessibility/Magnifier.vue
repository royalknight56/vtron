<template>
  <Win10Frame title="放大镜" :icon="win?.windowInfo.icon" background="#fff" titlebar-background="#fff">
    <div class="magnifier-toolbar" aria-label="放大镜工具栏">
      <button class="zoom-button" aria-label="缩小" disabled title="暂不支持缩放桌面">−</button
      ><span class="zoom">100%</span
      ><button class="zoom-button" aria-label="放大" disabled title="暂不支持缩放桌面">+</button>
      <span class="separator"></span>
      <button aria-label="上一句" disabled title="暂不支持朗读"><span class="mdl">&#xE892;</span></button
      ><button aria-label="朗读" disabled title="暂不支持朗读"><span class="mdl">&#xE768;</span></button
      ><button aria-label="下一句" disabled title="暂不支持朗读"><span class="mdl">&#xE893;</span></button>
      <span class="separator"></span>
      <button aria-label="阅读设置" disabled title="暂不支持阅读设置">
        <span class="mdl">&#xE767;</span></button
      ><button aria-label="设置和视图" disabled title="全屏、镜头、停靠视图和设置暂不可用">
        <span class="mdl">&#xE713;</span>
      </button>
    </div>
  </Win10Frame>
</template>
<script setup lang="ts">
import { inject } from 'vue';
import { BrowserWindow } from 'vtron';
import Win10Frame from '../../daily/Win10Frame.vue';
const win = inject<BrowserWindow>('browserWindow');
</script>
<style scoped>
.magnifier-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-around;
  flex: 1;
  min-height: 50px;
  padding: 0 7px;
  user-select: none;
}
button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 44px;
  padding: 0;
  border: 0;
  border-radius: 0;
  background: transparent;
  color: #999;
  cursor: default;
}
.zoom-button {
  font:
    36px/1 'Segoe UI',
    sans-serif;
  font-weight: 300;
}
.zoom {
  width: 57px;
  text-align: center;
  font-size: 16px;
  color: #111;
}
.separator {
  width: 1px;
  height: 23px;
  margin: 0 3px;
  background: #ccc;
}
.mdl {
  font: 20px/1 'SEGOEUIMDL';
}
</style>
