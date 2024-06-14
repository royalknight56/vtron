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
          <h1 class="setting-title">{{ i18n('language') }}</h1>
        </div>
        <div class="setting-item">
          <label> {{ i18n('language') }} </label>
          <WinSelect
            v-model="modelvalue"
            :options="[
              {
                label: 'zh-CN',
                value: 'zh-CN',
              },
              {
                label: 'en-US',
                value: 'en-US',
              },
            ]"
            :placeholder="i18n('please.select')"
          >
          </WinSelect>
        </div>

        <div class="setting-item">
          <label></label>
          <WinButton @click="submit">{{ i18n('confirm') }} </WinButton>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import WinButton from '@packages/components/WinButton.vue';
import WinSelect from '@packages/components/WinSelect.vue';

import { ref } from 'vue';
import { useSystem } from '@packages/kernel';
import { Dialog } from '@/packages/services';
import { i18n } from '@/packages/computer/i18n';

const system = useSystem();

const items = [i18n('language')];

const activeIndex = ref(0);

const modelvalue = ref(system.getConfig('lang'));

const selectItem = (index: number) => {
  activeIndex.value = index;
};

async function submit() {
  await system.setConfig('lang', modelvalue.value);

  Dialog.showMessageBox({
    message: i18n('save.success'),
    title: i18n('language'),
    type: 'info',
  }).then(() => {
    system?.reboot();
  });
}
</script>
<style scoped>
@import './setStyle.css';
</style>
