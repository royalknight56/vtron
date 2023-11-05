<template>
  <iframe
    class="setiframe"
    allow="fullscreen"
    ref="storeRef"
    src="https://myim.online/ppt"
  ></iframe>
</template>
<script lang="ts" setup>
import { BrowserWindow, Notify, System } from "vtron";
import { ref, onMounted, inject, onUnmounted } from "vue";

const sys = inject<System>("system");
let win = inject<BrowserWindow>("browserWindow");
const storeRef = ref<HTMLIFrameElement | null>(null);
let hasInit = false;
let eventHandler = async (e: MessageEvent) => {
  const eventData = e.data;
  if (eventData.type == "exportSpecificFile") {
    await sys?.fs.writeFile("/C/Users/Desktop/newPPT.ppt", eventData.data);
    new Notify({
      title: "保存成功",
      content: "文件已保存到桌面",
    });
  } else if (eventData.type == "initSuccess") {
    if (hasInit) {
      return;
    }
    hasInit = true;
    storeRef.value?.contentWindow?.postMessage(
      {
        type: "init",
        data: win?.config?.content,
      },
      "*"
    );
  }
};
onMounted(() => {
  window.addEventListener("message", eventHandler);
});

onUnmounted(() => {
  window.removeEventListener("message", eventHandler);
});
</script>
<style scoped>
.setiframe {
  width: 100%;
  height: 100%;
  border: none;
}
</style>
