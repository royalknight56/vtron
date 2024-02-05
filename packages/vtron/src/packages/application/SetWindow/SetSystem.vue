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
            <WinProcess v-model="rootstate.info.brightness"></WinProcess>
          </div>
          {{ rootstate.info.brightness.toFixed(0) }}
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
import WinProcess from '@packages/components/WinProcess.vue';
import { ref } from 'vue';
import { i18n } from '@packages/ui';
import { useSystem } from '@packages/kernel';

const rootstate = useSystem()._rootState;

const items = [i18n('screen')];

const activeIndex = ref(0);

const selectItem = (index: number) => {
  activeIndex.value = index;
};
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
