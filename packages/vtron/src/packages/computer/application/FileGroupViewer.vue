<template>
  <div class="file-group-viewer" @click="closeWindow">
    <div class="file-group-viewer-inner" @click.stop>
      <div class="file-group-viewer-title">
        {{ basename(browserWindow?.config?.path || '') }}
      </div>
      <div class="file-group-viewer-content">
        <div
          class="file-group-viewer-item"
          v-for="item in fileContent"
          :key="item.name"
          @click="openFile(item)"
        >
          <div class="file-group-viewer-item-icon">
            <VtronImage :path="(item as WinAppOptionsApp).icon" />
          </div>
          <div class="file-group-viewer-item-name">{{ item.name }}</div>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { BrowserWindow } from '@/packages/services';
import { basename, System, VtronFileWithoutContent } from '@packages/kernel';
import { inject, onMounted, ref } from 'vue';
import VtronImage from './components/VtronImage.vue';
import { WinAppOptions, WinAppOptionsApp } from '@/packages/type/type';
const browserWindow: BrowserWindow | undefined = inject('browserWindow');
const fileContent = ref<WinAppOptions[]>([]);
const system = inject<System>('system')!;
onMounted(async () => {
  fileContent.value = JSON.parse(browserWindow?.config?.content || '[]');
});
const openFile = (item: WinAppOptions) => {
  browserWindow?.destroy();
  setTimeout(() => {
    const winGet = system.stateManager.windowMap.get('Group', item.name);
    if (winGet) {
      const win = system.createWindow((winGet as WinAppOptionsApp).window);
      win.show();
    }
  }, 200);
};
const closeWindow = () => {
  browserWindow?.destroy();
};
</script>
<style scoped>
.file-group-viewer {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  position: relative;
  width: 100%;
  height: 100%;
  background-color: #3e3e3e7e;
  backdrop-filter: blur(10px);
}
.file-group-viewer-inner {
  width: 600px;
  height: 450px;
  border-radius: 40px;
  overflow: hidden;
  background-color: #cccccc33;
  position: relative;
  box-shadow: 0 0 20px 0 #00000033;
}

.file-group-viewer-title {
  width: 100%;
  height: 48px;
  text-align: center;
  line-height: 48px;
  margin-top: 20px 0;
  border-radius: 40px 40px 0 0;
  user-select: none;
  font-size: 16px;
  font-weight: bold;
  color: #ffffffd7;
}
.file-group-viewer-content {
  width: 100%;
  height: calc(100% - 48px);
  background-color: #cccccc33;
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: flex-start;
  align-items: flex-start;
  align-content: flex-start;
  gap: 20px;
  padding: 20px;
  box-sizing: border-box;
  overflow-y: auto;
}
.file-group-viewer-item {
  width: 120px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  cursor: pointer;
}
.file-group-viewer-item-icon {
  width: 48px;
  height: 48px;
  display: flex;
  justify-content: center;
  align-items: center;
  border: 2px dashed #ccc;
}
.file-group-viewer-item-name {
  width: 100%;
  height: 48px;
  color: #ffffffd7;
  text-align: center;
  line-height: 24px;
  user-select: none;
  font-size: 12px;
  /* 超出隐藏-最多两行 */
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}
.file-group-viewer-item:hover .file-group-viewer-item-icon {
  border: 2px dashed #ccc;
  background-color: #cccccc33;
}
</style>
