<template>
  <div class="up-pop" @mousedown.stop>
    <div class="pop-group">
      <div class="layout">
        <div class="up-pop-button" :class="{ chosen: chosenView == 'big' }" @click="changeView('big')">
          {{ i18n('large.icon') }}
        </div>
        <div class="up-pop-button" :class="{ chosen: chosenView == 'middle' }" @click="changeView('middle')">
          {{ i18n('middle.icon') }}
        </div>
        <div class="up-pop-button" :class="{ chosen: chosenView == 'icon' }" @click="changeView('icon')">
          {{ i18n('small.icon') }}
        </div>
        <div class="up-pop-button" :class="{ chosen: chosenView == 'list' }" @click="changeView('list')">
          {{ i18n('list') }}
        </div>
        <div class="up-pop-button" :class="{ chosen: chosenView == 'detail' }" @click="changeView('detail')">
          {{ i18n('detail.info') }}
        </div>
      </div>
      <div class="group-title">布局</div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { i18n } from '@packages/ui';
import { defineEmits, ref } from 'vue';
const props = defineProps({
  modelValue: {
    default: '',
    type: [String],
  },
});
const emits = defineEmits(['update:modelValue']);

const chosenView = ref(props.modelValue);

function changeView(view: string) {
  chosenView.value = view;
  emits('update:modelValue', view);
}
</script>

<style scoped lang="scss">
.up-pop {
  position: absolute;
  top: 20px;
  left: 0;
  width: 100%;
  height: 100px;
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  align-items: center;
  z-index: 20;
  background-color: #f5f6f7;
  border-bottom: 1px solid #dcddde;
  border-top: 1px solid #dcddde;
  user-select: none;
  .pop-group {
    width: 260px;
    height: 100%;
    border-left: 1px solid #dcddde;
    border-right: 1px solid #dcddde;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-direction: column;
    .layout {
      width: 240px;
      height: 50px;
      background-color: #fafbfc;
      display: flex;
      flex-wrap: wrap;
      border: 1px solid #dcddde;
      margin-top: 10px;
    }
    .group-title {
      padding: 4px;
    }
  }
  .up-pop-button {
    width: 70px;
    height: 20px;
    background-color: rgba(255, 255, 255, 0.5);
    display: flex;
    // justify-content: center;
    align-items: center;
    margin: 0px 4px;
    cursor: pointer;
    transition: all 0.1s;
    border: 1px solid transparent;
    &:hover {
      background-color: #cde4fc91;
      border: 1px solid #6ca9e791;
    }
    &.chosen {
      background-color: #cde4fc;
      border: 1px solid #6ca9e7;
    }
  }
}
</style>
