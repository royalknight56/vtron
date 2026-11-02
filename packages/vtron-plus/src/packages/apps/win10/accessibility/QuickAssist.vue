<template>
  <Win10Frame title="快速助手" :icon="win?.windowInfo.icon" background="#fff" titlebar-background="#fff">
    <div class="quick-assist">
      <p class="intro">
        Microsoft 快速助手可让两人通过远程连接共享一台电脑，以便一人帮助解决另一人电脑上的问题。
      </p>
      <button class="assistance" disabled title="远程协助暂不可用">
        <span class="mdl" aria-hidden="true">&#xE716;</span
        ><span><strong>获取帮助</strong><span>让你信任的人协助你控制电脑</span></span>
      </button>
      <button class="assistance" disabled title="远程协助和 Microsoft 帐户登录暂不可用">
        <span class="mdl" aria-hidden="true">&#xE77B;</span
        ><span><strong>提供帮助</strong><span>通过远程连接帮助其他人</span></span>
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
.quick-assist {
  padding: 15px 23px;
  color: #222;
  font-size: 14px;
}
.intro {
  margin: 0 0 28px;
  line-height: 1.4;
}
.assistance {
  display: flex;
  align-items: flex-start;
  gap: 13px;
  width: 100%;
  min-height: 112px;
  padding: 9px 0 14px;
  border: 0;
  border-radius: 0;
  background: white;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: default;
}
.assistance > span:last-child {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 5px;
}
.assistance strong {
  color: #3286ad;
  font-size: 23px;
  font-weight: 300;
  line-height: 1.3;
}
.assistance > span:last-child > span {
  line-height: 1.4;
}
.assistance .mdl {
  margin-top: 3px;
  font: 28px/1 'SEGOEUIMDL';
  color: #3286ad;
}
.assistance:disabled {
  opacity: 0.65;
}
</style>
