<template>
  <component :is="editor" />
  <dialog ref="dialog" aria-labelledby="office-dialog-title" @close="finishDialog">
    <form v-if="question" method="dialog">
      <strong id="office-dialog-title">{{ question.title }}</strong>
      <p>{{ question.message }}</p>
      <footer><button v-for="(label, index) in question.buttons" :key="index" :value="index">{{ label }}</button></footer>
    </form>
  </dialog>
</template>
<script setup lang="ts">
import { nextTick, provide, ref, type Component } from 'vue';
import type { Dialog } from 'vtron';
import { standaloneOffice } from '../../vtron-plus/src/packages/apps/office/officeFiles';

defineProps<{ editor: Component }>();
const dialog = ref<HTMLDialogElement>();
const question = ref<Parameters<typeof Dialog.showMessageBox>[0]>();
let answer: ((result: { response: number }) => void) | undefined;
function finishDialog() {
  const value = dialog.value?.returnValue;
  answer?.({ response: value ? Number(value) : -1 });
  answer = undefined;
  question.value = undefined;
}
provide(standaloneOffice, options => {
    if (answer) return Promise.resolve({ response: -1 });
    return new Promise(resolve => {
      answer = resolve;
      question.value = options;
      nextTick(() => {
        dialog.value!.returnValue = '';
        dialog.value!.showModal();
      });
    });
});
</script>
<style>
html, body, #app { height: 100%; margin: 0; }
#app { overflow: hidden; font: 14px 'Segoe UI', 'Microsoft YaHei', sans-serif; }
dialog { max-width: min(360px, 90vw); padding: 20px; border: 1px solid #a9acb0; }
dialog::backdrop { background: rgb(0 0 0 / 24%); }
dialog footer { display: flex; justify-content: flex-end; gap: 8px; }
dialog button { padding: 4px 12px; }
</style>
