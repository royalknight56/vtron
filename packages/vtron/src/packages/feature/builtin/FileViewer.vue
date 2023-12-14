<template>
  <div class="txt">
    <div class="txt-upper">
      <div class="txt-button" @click="handleButton">{{ i18n('file') }}(F)</div>
      <div class="txt-button" @click="changeFormat">{{ format }}</div>
    </div>
    <div class="txt-content">
      <textarea class="txt-input" v-model="input"> </textarea>
    </div>
  </div>
</template>
<script setup lang="ts">
import { inject, ref } from 'vue';
import { Notify } from '../notification/Notification';
import { useSystem } from '../system';
import { BrowserWindow } from '../window/BrowserWindow';
import { i18n } from '@feature/i18n';

const browserWindow: BrowserWindow | undefined = inject('browserWindow');
const input = ref('');
const format = ref('base64');
try {
  const base64String = decodeURIComponent(escape(atob(browserWindow?.config.content?.toString() || '')));
  format.value = 'base64';
  input.value = base64String;
} catch (error) {
  console.log(error);
  format.value = 'text';
  input.value = browserWindow?.config.content;
}

function changeFormat() {
  if (format.value === 'base64') {
    format.value = 'text';
  } else {
    format.value = 'base64';
  }
}

const system = useSystem();
function handleButton(e: MouseEvent) {
  system?.emitEvent('contextMenu.show', {
    mouse: e,
    menuList: [
      {
        name: i18n('save'),
        click: async () => {
          const file = await system.fs.stat(browserWindow?.config.path);
          if (!file) {
            new Notify({
              title: i18n('tips'),
              content: i18n('file.not.exist'),
            });
            return;
          }
          if (format.value === 'base64') {
            await system.fs.writeFile(file?.path, btoa(unescape(encodeURIComponent(input.value))));
          } else {
            await system.fs.writeFile(file?.path, input.value);
          }

          new Notify({
            title: i18n('tips'),
            content: i18n('file.save.success'),
          });
        },
      },
    ],
  });
}
</script>
<style scoped>
.txt {
  width: 100%;
  height: 100%;
  background-color: #ffffff;
}

.txt-upper {
  width: 100%;
  height: 20px;
  color: #444;
  background-color: #ffffff;
  user-select: none;
  display: flex;
  border-bottom: 1px solid #ccc;
}

.txt-button {
  width: 50px;
  height: 20px;
  line-height: 20px;
  font-size: 12px;
  text-align: center;
  background-color: #ffffff;
}

.txt-button:hover {
  background-color: #9ae7ff76;
}

.txt-content {
  width: 100%;
  height: calc(100% - 20px);
  background-color: #ffffff;
}

.txt-input {
  display: block;
  width: 100%;
  height: 100%;
  background-color: #ffffff;
  border: none;
  outline: none;
  resize: none;
}
</style>
