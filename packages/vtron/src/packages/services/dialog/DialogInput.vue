<template>
  <div class="dialog">
    <div class="dialog-content">
      <div class="dialog-label">{{ win?.config.option.message }}:</div>

      <WinInput :placeholder="win?.config.option?.placeholder" v-model="inputVal"></WinInput>
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
import WinInput from '@packages/components/WinInput.vue';
import { inject, ref } from 'vue';
import { BrowserWindow } from '@/packages/services';

const inputVal = ref('');

const win: BrowserWindow | undefined = inject<BrowserWindow>('browserWindow');

function handleClick(index: number) {
  if (win) {
    win.config.res({
      response: inputVal.value,
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

    .dialog-label {
      width: 80px;
      height: 60px;
      display: flex;
      justify-content: center;
      align-items: center;
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
