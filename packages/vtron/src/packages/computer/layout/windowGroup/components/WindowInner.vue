<template>
  <iframe
    v-if="typeof window.content === 'string'"
    :src="window.content"
    frameborder="0"
    width="100%"
    height="100%"
    class="viewer"
    :class="{ 'viewer-loading': isLoad }"
    ref="winiframe"
    @load="isLoad = false"
  ></iframe>
  <Suspense v-else>
    <component :is="window.content"></component>
  </Suspense>
</template>
<script setup lang="ts">
import { inject, onMounted, onUnmounted, ref, UnwrapNestedRefs } from 'vue';
import { BrowserWindow } from '@/packages/services';
import { System } from '@/packages/kernel';
const props = defineProps<{
  window: UnwrapNestedRefs<BrowserWindow>;
}>();
const sys = inject<System>('system')!;
const winiframe = ref<HTMLIFrameElement | null>(null);
const isLoad = ref(true);
let retResMap = new Map();
let currentRetRes: any = undefined;
const invoke = (data: any) => {
  if (data.type === 'browser-window') {
    currentRetRes = (props.window as any)[data.action]?.(...data.params);
  }
  if (data.type === 'system') {
    currentRetRes = (sys as any)[data.action]?.(...data.params);
  }
  if (data.type === 'save-return') {
    retResMap.set(data.id, currentRetRes);
  }
  if (data.type === 'invoke-return') {
    retResMap.get(data.id)?.[data.action]?.(...data.params);
  }
};

const handleEvent = (e: MessageEvent<any>) => {
  const data = e.data;
  if (!data) return;
  if (e.source !== winiframe.value?.contentWindow) {
    return;
  }
  invoke(data);
};
props.window.addEventListener('message', (source: string, arg: any) => {
  winiframe.value?.contentWindow?.postMessage(arg, '*');
});
window?.addEventListener('message', handleEvent);
onUnmounted(() => {
  window?.removeEventListener('message', handleEvent);
});
onMounted(() => {
  setTimeout(() => {
    isLoad.value = false;
  }, 5000);
});
</script>
<style scoped>
.viewer {
  width: 100%;
  height: 100%;
  background-color: #00000000;
}
.viewer-loading {
  animation: loading 1s infinite;
}
@keyframes loading {
  50% {
    background-color: #00000051;
  }
  0%,
  100% {
    background-color: #00000000;
  }
}
</style>
