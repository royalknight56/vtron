<!--
 * @Author: Jahv
 * @LastEditTime: 2024-11-06 01:52:56
 * @Description: 测试百度，需要借助一点小手段
-->
<template>
  <div class="outer" v-dragable>
    <iframe src="" ref="iframe" />
  </div>
</template>
<script lang="ts" setup>
import { BrowserWindow, vDragable } from '@packages/plug';
import { inject, onMounted, ref } from 'vue';
const win = inject<BrowserWindow>('browserWindow');
const iframe = ref<HTMLIFrameElement>();
onMounted(async () => {
  const res = await fetch('https://cors-anywhere.herokuapp.com/https://www.baidu.com');
  console.log(res);
  const text = await res.text();
  console.log(text);
  iframe.value!.contentDocument!.write(text);
});
</script>

<style scoped>
.outer {
  width: 100%;
  height: 100%;
}
iframe {
  width: 100%;
  height: 100%;
  border: none;
}
</style>
