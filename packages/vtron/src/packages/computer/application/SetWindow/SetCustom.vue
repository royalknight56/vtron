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
          <WinSelect
            :options="[
              {
                label: i18n('image'),
                value: 'image',
              },
              {
                label: i18n('color'),
                value: 'color',
              },
            ]"
            v-model="backgroundType"
          ></WinSelect>
        </div>
        <template v-if="backgroundType === 'color'">
          <div class="setting-item">
            <label> </label>
            <div class="color-select color-border">
              <div class="color" :style="{ background: backgroundColor }"></div>
            </div>
          </div>

          <div class="setting-item">
            <label></label>
            <ColorPicker v-model="backgroundColor"></ColorPicker>
          </div>
        </template>
        <template v-if="backgroundType === 'image'">
          <div class="setting-item">
            <label> </label>
            <WinInput
              placeholder="请输入网络链接或者base64"
              :width="'340px'"
              v-model="backgroundUrl"
            ></WinInput>
          </div>
          <div class="setting-item">
            <label> </label>
          </div>
        </template>

        <div class="setting-item">
          <label> </label>
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
          <div class="color-select color-border">
            <div class="color" :style="{ background: textColor }"></div>
          </div>
        </div>

        <div class="setting-item">
          <label></label>
          <ColorPicker v-model="textColor"></ColorPicker>
        </div>

        <div class="setting-item">
          <label>任务栏颜色：</label>
          <div class="color-select color-border">
            <div class="color" :style="{ background: taskBarColor }"></div>
          </div>
        </div>

        <div class="setting-item">
          <label></label>
          <ColorPicker v-model="taskBarColor"></ColorPicker>
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
import ColorPicker from './components/ColorPicker.vue';

import { ref } from 'vue';
import { useSystem } from '@packages/kernel';
import { Dialog } from '@/packages/services';
import { i18n } from '@/packages/computer/i18n';

const system = useSystem();
const items = [i18n('background'), i18n('style')];

const activeIndex = ref(0);

const backgroundType = ref('color');
const backgroundColor = ref(
  system.getConfig('background')?.startsWith('#') ? system.getConfig('background') : '#fff'
);
const backgroundUrl = ref(
  system.getConfig('background')?.startsWith('#') ? '' : system.getConfig('background')
);
const textColor = ref(system.getConfig('rootStyle')?.['--icon-title-color'] || '#111');
const taskBarColor = ref(system.getConfig('rootStyle')?.['--theme-main-color'] || '#ededed');

const winRadius = ref(system.getConfig('rootStyle')?.['--window-border-radius']);

/** 提交背景设置 */
async function submit() {
  const imgurl = backgroundType.value === 'color' ? backgroundColor.value : backgroundUrl.value;
  if (!imgurl) {
    return;
  }
  await system.setConfig('background', imgurl || '#fff');
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
    '--theme-main-color': taskBarColor.value,
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
  margin: 1px;
  /* border-radius: 50%; */
  cursor: pointer;
  transition: all 0.3s;
}
.color-border {
  border: 2px solid #0f0f0f;
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
