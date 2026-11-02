<template>
  <div v-if="state" class="media-path-backdrop" @keydown.esc.stop.prevent="$emit('finish', null)">
    <form class="media-path-dialog" @submit.prevent="$emit('finish', value)">
      <header>
        <span>{{ state.title }}</span
        ><button type="button" aria-label="关闭" @click="$emit('finish', null)">
          <span class="mdl">&#xE8BB;</span>
        </button>
      </header>
      <div class="media-path-body">
        <label>文件名(N):<input ref="input" v-model="value" spellcheck="false" /></label>
        <footer>
          <button type="submit">{{ state.action }}</button
          ><button type="button" @click="$emit('finish', null)">取消</button>
        </footer>
      </div>
    </form>
  </div>
</template>
<script setup lang="ts">
import { nextTick, ref, watch } from 'vue';
import type { PathPrompt } from './mediaFiles';
const props = defineProps<{ state: PathPrompt | null }>();
defineEmits<{ finish: [value: string | null] }>();
const input = ref<HTMLInputElement>();
const value = ref('');
watch(
  () => props.state,
  async (state) => {
    if (!state) return;
    value.value = state.value;
    await nextTick();
    input.value?.focus({ preventScroll: true });
    input.value?.select();
  },
  { immediate: true }
);
</script>
<style scoped>
.media-path-backdrop {
  position: absolute;
  inset: 0;
  z-index: 20;
  background: #0001;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #111;
  font:
    12px/1.35 'Segoe UI',
    'Microsoft YaHei UI',
    sans-serif;
}
.media-path-dialog {
  width: 460px;
  max-width: calc(100% - 24px);
  background: #f0f0f0;
  border: 1px solid #888;
  box-shadow: 0 4px 18px #0004;
}
.media-path-dialog header {
  height: 30px;
  background: white;
  display: flex;
  align-items: center;
  padding-left: 12px;
}
.media-path-dialog header span {
  flex: 1;
}
.media-path-dialog header button {
  height: 30px;
  width: 40px;
  border: 0;
  background: transparent;
}
.media-path-dialog header button:hover {
  background: #e81123;
  color: white;
}
.mdl {
  font: 10px 'SEGOEUIMDL';
}
.media-path-body {
  padding: 20px 14px 12px;
}
.media-path-body label {
  display: flex;
  gap: 8px;
  align-items: center;
  white-space: nowrap;
}
.media-path-body input {
  flex: 1;
  min-width: 0;
  height: 25px;
  border: 1px solid #888;
  background: white;
  padding: 2px 5px;
  font: inherit;
  color: #111;
  border-radius: 0;
}
.media-path-body input:focus {
  outline: 1px solid #0078d7;
  outline-offset: -1px;
}
.media-path-body footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 22px;
}
.media-path-body footer button {
  height: 25px;
  min-width: 76px;
  border: 1px solid #adadad;
  background: #e1e1e1;
  font: inherit;
  color: #111;
  border-radius: 0;
}
.media-path-body footer button:hover {
  border-color: #0078d7;
  background: #e5f1fb;
}
</style>
