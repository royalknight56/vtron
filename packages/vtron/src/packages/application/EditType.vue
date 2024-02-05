<template>
  <div class="outer">
    <input class="win-input" v-model="type" />
    <WinButton @click="confirm">{{ i18n('confirm') }}</WinButton>
  </div>
</template>
<script setup lang="ts">
import WinButton from '@packages/components/WinButton.vue';
import { inject, ref } from 'vue';
import { i18n, BrowserWindow } from '@packages/ui';
import { VtronFileWithoutContent, basename, useSystem, emitEvent, extname } from '@packages/kernel';

const browserWindow: BrowserWindow = inject('browserWindow')!;
const fileBaseName = basename((browserWindow.config.content as VtronFileWithoutContent).path);
const type = ref(extname(fileBaseName));

function confirm() {
  useSystem()
    ?.fs.rename(
      browserWindow.config.content.path,
      browserWindow.config.content.path.replace(
        fileBaseName,
        fileBaseName.replace(extname(fileBaseName), type.value)
      )
    )
    .then(() => {
      emitEvent('file.props.edit');
      browserWindow.close();
    });
}
</script>
<style lang="scss" scoped>
.outer {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100%;

  .win-input {
    font-size: 20px;
    width: 200px;
    height: 40px;
    margin-bottom: 40px;
    outline: none;
    border: 1px solid black;

    &:focus {
      border: 1px solid var(--color-blue);
    }
  }
}
</style>
