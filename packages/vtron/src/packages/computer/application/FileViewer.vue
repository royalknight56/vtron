<template>
  <div class="txt">
    <div class="txt-upper">
      <div class="txt-button" @click="handleButton">{{ i18n('file') }}(F)</div>
      <div class="txt-button" @click="changeFormat">{{ i18n('change.encoding') }}</div>
    </div>
    <div class="txt-content">
      <textarea class="txt-input" v-model="input"> </textarea>
    </div>
    <div class="bottom">
      <div class="bottom-item">Windows(CRLF)</div>
      <div class="bottom-item">
        {{ format }}
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { inject, ref } from 'vue';
import { i18n } from '@/packages/computer/i18n';
import { Notify } from '@/packages/services/notification/Notification';
import { useSystem } from '@packages/kernel';
import { Menu, BrowserWindow } from '@/packages/services';
const browserWindow: BrowserWindow | undefined = inject('browserWindow');
const input = ref('');
const format = ref('base64');
try {
  const base64String = decodeURIComponent(escape(atob(browserWindow?.config.content?.toString() || '')));
  format.value = 'base64';
  input.value = base64String;
} catch (error) {
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
  Menu.buildFromTemplate([
    {
      label: i18n('save'),
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
  ]).popup(e);
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
  height: calc(100% - 40px);
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

.bottom {
  width: 100%;
  height: 20px;
  line-height: 20px;
  border-top: #ddd solid 1px;
  overflow: hidden;
  background-color: #eee;
  font-size: 12px;
  display: flex;
  justify-content: flex-end;
}

.bottom-item {
  /* width: 100px; */
  padding: 0 20px;
  text-align: center;
  color: #444;
  background-color: #eee;
  border-left: #ddd solid 1px;
  border-right: #ddd solid 1px;
  user-select: none;
}
</style>
