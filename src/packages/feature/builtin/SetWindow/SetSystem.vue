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
          <div class="ctrl">
            <WinProcess v-model="rootstate.system.info.brightness"></WinProcess>
          </div>
          {{ rootstate.system.info.brightness.toFixed(0) }}
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
// import WinSelect from '@packages/components/WinSelect.vue';
import WinProcess from '@packages/components/WinProcess.vue';
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
.ctrl {
  width: 100px;
}
.setting-item {
  display: flex;
  align-items: center;
}
</style>
