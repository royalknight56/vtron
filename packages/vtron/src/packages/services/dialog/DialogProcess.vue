<template>
  <div class="dialog">
    <div class="dialog-content">
      <div class="dialog-tip">{{ win?.config.option.message }}:{{ win?.config.res.toFixed(1) }}%</div>

      <div class="dialog-process">
        <div
          class="dialog-p-inner"
          :style="{
            width: win?.config.res + '%',
          }"
        ></div>
      </div>
    </div>
    <div class="dialog-button">
      <WinButton v-for="item in win?.config.option.buttons" :key="item" @click="handleClick()">{{
        item
      }}</WinButton>
    </div>
  </div>
</template>
<script setup lang="ts">
import { BrowserWindow } from '@/packages/services';
import WinButton from '@packages/components/WinButton.vue';
import { inject } from 'vue';

// import errorIcon from '@packages/assets/error-icon.png';
// import infoIcon from '@packages/assets/info-icon.png';
// import questionIcon from '@packages/assets/question-icon.png';
// import warningIcon from '@packages/assets/warning-icon.png';

// const iconMap: {
//   [key: string]: string;
// } = {
//   error: errorIcon,
//   info: infoIcon,
//   question: questionIcon,
//   warning: warningIcon,
// };

const win: BrowserWindow | undefined = inject<BrowserWindow>('browserWindow');

function handleClick() {
  if (win) {
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
    flex-direction: column;
    justify-content: center;
    align-items: center;

    .dialog-tip {
      width: 80%;
      font-size: 16px;
      padding-bottom: 10px;
    }
    .dialog-process {
      width: 80%;
      height: 16px;
      border: 1px solid #ccc;
      .dialog-p-inner {
        height: 100%;
        background-color: #06b025;
        overflow: hidden;
        position: relative;
      }
      .dialog-p-inner::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 140px;
        height: 100%;
        background: linear-gradient(to right, transparent, rgba(255, 255, 255, 0.266), transparent);
        animation: sweep 6s infinite;
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
@keyframes sweep {
  0% {
    left: -200px;
  }
  40% {
    left: -200px;
  }
  60% {
    left: 200px;
  }
  100% {
    left: 200px;
  }
}
</style>
