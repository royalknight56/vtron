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
          <h1 class="setting-title">{{ i18n('screen') }}</h1>
        </div>
        <div class="setting-item">
          <label> {{ i18n('brightness') }} </label>
          <WinSelect
            v-model="rootstate.system.info.brightness"
            :options="[
              {
                label: '10%',
                value: 10,
              },
              {
                label: '20%',
                value: 20,
              },
              {
                label: '30%',
                value: 30,
              },
              {
                label: '40%',
                value: 40,
              },
              {
                label: '50%',
                value: 50,
              },
              {
                label: '60%',
                value: 60,
              },
              {
                label: '70%',
                value: 70,
              },
              {
                label: '80%',
                value: 80,
              },
              {
                label: '90%',
                value: 90,
              },
              {
                label: '100%',
                value: 100,
              },
            ]"
            :placeholder="i18n('please.select')"
          >
          </WinSelect>
        </div>

        <!-- <div class="setting-item">
          <label></label>
          <WinButton @click="submit">{{ i18n('confirm') }} </WinButton>
        </div> -->
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
// import WinButton from '@packages/components/WinButton.vue';
import WinSelect from '@packages/components/WinSelect.vue';

import { ref } from 'vue';
// import { useSystem } from '@feature/system';
// import { Dialog } from '@feature/dialog/Dialog';
import { useRootState } from '../../state/Root';
import { i18n } from '@feature/i18n';

const rootstate = useRootState();
// const system = useSystem();

const items = [i18n('screen')];

const activeIndex = ref(0);

// const modelvalue = ref(rootstate.system.info.brightness);

const selectItem = (index: number) => {
  activeIndex.value = index;
};

// async function submit() {
//   const config = await system?.fs.readFile(`${system._options.systemLocation}Vtron/config.json`);
//   const configObj = JSON.parse(config || '{}');
//   configObj.lang = modelvalue.value === 0 ? 'zh-CN' : 'en-US';
//   await system?.fs.writeFile(`${system._options.systemLocation}Vtron/config.json`, {
//     content: JSON.stringify(configObj),
//   });
//   Dialog.showMessageBox({
//     message: i18n('save.success'),
//     title: i18n('brightness'),
//     type: 'info',
//   }).then(() => {
//     system?.reboot();
//   });
// }
</script>
<style scoped>
@import './setStyle.css';
</style>
