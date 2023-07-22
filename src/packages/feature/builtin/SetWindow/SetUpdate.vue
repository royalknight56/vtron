<template>
  <div class="container">
    <div class="nav">
      <ul>
        <li
          v-for="(item, index) in items"
          :key="index"
          @click="selectItem(index)"
          :class="{ active: index === activeIndex }"
        >
          {{ item }}
        </li>
      </ul>
    </div>
    <div class="setting">
      <div v-if="0 === activeIndex">
        <div class="setting-item">
          <h1 class="setting-title">
            {{ i18n('system.backup.and.import') }}
          </h1>
        </div>
        <div class="setting-item">
          <label>
            {{ i18n('export.system.status') }}
          </label>
          <WinButton @click="handleClick(0)">
            {{ i18n('export') }}
          </WinButton>
        </div>
        <div class="setting-item">
          <label>
            {{ i18n('import.status.file') }}
          </label>
          <textarea v-model="inputConfig" type="text"></textarea>
        </div>
        <div class="setting-item">
          <label></label>
          <WinButton @click="handleClick(1)">
            {{ i18n('import') }}
          </WinButton>
        </div>
      </div>
      <div v-if="1 === activeIndex">
        <div class="setting-item">
          <h1 class="setting-title">
            {{ i18n('system.version') }}
          </h1>
        </div>
      </div>
    </div>
  </div>
</template>
<script lang="ts" setup>
import WinButton from '@packages/components/WinButton.vue';
import { defineComponent, ref } from 'vue';
import { useSystem } from '@feature/system';
import { Dialog } from '@feature/dialog/Dialog';
import { i18n } from '@feature/i18n';

interface Field {
  name: string;
  label: string;
  type: string;
  placeholder: string;
}
let system = useSystem();
const items = [
  i18n('backup'), // '备份',
  // '版本',
];
const fields: Field[] = [
  {
    name: 'name',
    label: 'Name',
    type: 'text',
    placeholder: 'Enter your name',
  },
  {
    name: 'email',
    label: 'Email',
    type: 'email',
    placeholder: 'Enter your email',
  },
  {
    name: 'password',
    label: 'Password',
    type: 'password',
    placeholder: 'Enter your password',
  },
];
const activeIndex = ref(0);
const formData = ref({});
const inputConfig = ref('');
const selectItem = (index: number) => {
  activeIndex.value = index;
};

async function handleClick(num: number) {
  if (num === 0) {
    //导出配置
    let cfg = await system?.serializeState();
    try {
      await navigator.clipboard.writeText(cfg!);
      Dialog.showMessageBox({
        title: i18n('export.config'),
        message: i18n('export.success.saved.to.clipboard'),
        type: 'info',
        buttons: [i18n('confirm')],
      });
    } catch (err) {
      Dialog.showMessageBox({
        title: i18n('export.config'),
        message: i18n('export.failed'),
        type: 'error',
        buttons: [i18n('confirm')],
      });
    }
  } else if (num === 1) {
    // 导入配置
    try {
      let req = await Dialog.showMessageBox({
        title: i18n('import.config'),
        // message: '导入会覆盖现有的文件,是否继续?',
        message: i18n('import.config.will.cover.existing.files.continue'),
        type: 'warning',
        buttons: [i18n('confirm'), i18n('cancel')],
      });
      if (req.response === 1) return;
      await system?.deserializeState(inputConfig.value);
      setTimeout(() => {
        system?.reboot();
      }, 10000);
      await Dialog.showMessageBox({
        title: i18n('import.success'),
        message: i18n('import.success.reboot.soon'),
        type: 'warning',
        buttons: [i18n('confirm')],
      });
      system?.reboot();
    } catch (err) {
      Dialog.showMessageBox({
        title: i18n('import.config'),
        message: i18n('import.failed'),
        type: 'error',
        buttons: [i18n('confirm')],
      });
    }
  }
}
getRemoteVersion();
function getRemoteVersion() {}
</script>

<style scoped>
@import './setStyle.css';
</style>
