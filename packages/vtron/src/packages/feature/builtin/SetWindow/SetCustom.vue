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
          <h1 class="setting-title">{{ i18n('background') }}</h1>
        </div>
        <div class="setting-item">
          <label> {{ i18n('set.background') }} </label>
          <WinInput placeholder="" v-model="imgurl"></WinInput>
        </div>

        <div class="setting-item">
          <label></label>
          <div class="color-selects">
            <div class="color-select" v-for="item in colors" :key="item" @click="choseColor(item)">
              <div class="color" :style="{ background: item }" @click="imgurl = item"></div>
            </div>
          </div>
        </div>

        <div class="setting-item">
          <label></label>
          <WinButton @click="submit">{{ i18n('confirm') }} </WinButton>
        </div>
      </div>
      <div v-if="1 === activeIndex">
        <div class="setting-item">
          <h1 class="setting-title">
            {{ i18n('style') }}
          </h1>
        </div>

        <div class="setting-item">
          <label>桌面文字颜色：</label>
          <WinSelect
            v-model="textColor"
            :options="[
              {
                label: i18n('white'),
                value: '#fff',
              },
              {
                label: i18n('black'),
                value: '#111',
              },
            ]"
            :placeholder="i18n('please.select')"
          >
          </WinSelect>
        </div>

        <div class="setting-item">
          <label>窗口圆角：</label>
          <WinInput placeholder="example: 2px" v-model="winRadius"></WinInput>
        </div>

        <div class="setting-item">
          <label></label>
          <WinButton @click="submitStyle">{{ i18n('confirm') }} </WinButton>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import WinButton from '@packages/components/WinButton.vue';
import WinSelect from '@packages/components/WinSelect.vue';
import WinInput from '@packages/components/WinInput.vue';
// import WinCheckBox from '@/packages/components/WinCheckBox.vue';

import { ref } from 'vue';
import { useSystem } from '@feature/system';
import { Dialog } from '@feature/dialog/Dialog';
import { i18n } from '@feature/i18n';

const system = useSystem();
const items = [
  i18n('background'),
  i18n('style'),
  // '版本',
];

const activeIndex = ref(0);

const imgurl = ref(system.getConfig('background'));
const textColor = ref(system.getConfig('rootStyle')?.['--icon-title-color']);
const winRadius = ref(system.getConfig('rootStyle')?.['--window-border-radius']);

const colors = [
  '#b8cca3',
  '#ff6633',
  '#cfe6a1',
  '#cfe6e6',
  '#a1e6b8',
  '#66e6cc',
  '#ccc',
  '#999',
  '#666',
  '#333',
  '#222',
  '#111',
];
function choseColor(color: string) {
  imgurl.value = color;
}

/** 提交背景设置 */
async function submit() {
  await system.setConfig('background', imgurl.value);
  Dialog.showMessageBox({
    message: i18n('save.success'),
    title: i18n('wallpaper'),
    type: 'info',
  });
}

const selectItem = (index: number) => {
  activeIndex.value = index;
};
async function submitStyle() {
  let rootStyle = system.getConfig('rootStyle');
  rootStyle = {
    ...rootStyle,
    '--icon-title-color': textColor.value,
    '--window-border-radius': winRadius.value,
  };
  await system.setConfig('rootStyle', rootStyle);

  Dialog.showMessageBox({
    message: i18n('save.success'),
    title: i18n('style'),
    type: 'info',
  });
}
</script>

<style scoped>
@import './setStyle.css';
.color-selects {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  flex-wrap: wrap;
  width: 40%;
}
.color-select {
  width: 40px;
  height: 40px;
  border: 2px solid #fff;
  margin: 4px;
  /* border-radius: 50%; */
  cursor: pointer;
  transition: all 0.3s;
}
.color-select:hover {
  border: 2px solid #cccccc;
}
.color-select .color {
  width: 100%;
  height: 100%;
  /* border-radius: 50%; */
}
</style>
