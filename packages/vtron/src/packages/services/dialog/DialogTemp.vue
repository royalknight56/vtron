<template>
  <div class="dialog">
    <div class="dialog-content">
      <div class="dialog-icon">
        <img class="dialog-icon_img" :src="iconMap[win?.config.option.type]" alt="" />
      </div>
      {{ win?.config.option.message }}
    </div>
    <div class="dialog-button">
      <WinButton
        v-for="(item, index) in win?.config.option.buttons"
        :key="item"
        @click="handleClick(index)"
        >{{ item }}</WinButton
      >
    </div>
  </div>
</template>
<script setup lang="ts">
import WinButton from '@packages/components/WinButton.vue';
import { inject } from 'vue';

import errorIcon from '@packages/assets/error-icon.png';
import infoIcon from '@packages/assets/info-icon.png';
import questionIcon from '@packages/assets/question-icon.png';
import warningIcon from '@packages/assets/warning-icon.png';
import { BrowserWindow } from '@/packages/ui/window/BrowserWindow';

const iconMap: {
  [key: string]: string;
} = {
  error: errorIcon,
  info: infoIcon,
  question: questionIcon,
  warning: warningIcon,
};

const win: BrowserWindow | undefined = inject<BrowserWindow>('browserWindow');

function handleClick(index: number) {
  if (win) {
    win.config.res({
      response: index,
    });
    win.close();
  }
}
</script>
<style lang="scss" scoped>
.dialog {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;

  .dialog-content {
    width: 100%;
    height: 80px;
    font-size: var(--ui-font-size);
    display: flex;
    justify-content: center;
    align-items: center;

    .dialog-icon {
      width: 100px;
      height: 60px;
      display: flex;
      justify-content: center;
      align-items: center;

      .dialog-icon_img {
        width: 34px;
        height: 34px;
      }
    }
  }

  .dialog-button {
    width: 100%;
    height: 40px;
    display: flex;
    flex-shrink: 0;
    justify-content: flex-end;
    align-items: center;
    background-color: var(--color-ui-gray);

    .win-button {
      margin: 0 10px;
    }
  }
}
</style>
