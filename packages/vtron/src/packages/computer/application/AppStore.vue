<template>
  <div class="store-outer">
    <div class="store-handle" v-dragable>
      <div v-if="!closing" @click="closeWin" class="close-button">×</div>
    </div>
    <iframe
      class="store"
      :class="{ closing: closing }"
      ref="storeRef"
      :key="frameKey"
      :src="storeUrl"
    ></iframe>
  </div>
</template>

<script lang="ts" setup>
import { inject, onMounted, ref } from 'vue';
import { System } from '@/packages/kernel/system';
import { BrowserWindow, Dialog, basename, vDragable } from '@packages/plug';
import { i18n } from '@/packages/computer/i18n';

const system = inject<System>('system')!;

const storeRef = ref<HTMLIFrameElement | null>(null);
const frameKey = ref(0);
const closing = ref(false);
const isProduction = import.meta.env.PROD;
const storeUrl = isProduction ? 'https://vtron.site/store/' : 'http://localhost:3001';
const browserWindow: BrowserWindow = inject('browserWindow')!;
const handleMessage = (event: MessageEvent) => {
  if (event.source !== storeRef.value?.contentWindow) {
    return;
  }
  const rec: any = event.data;
  switch (rec.type) {
    case 'install':
      handleInstall(rec.data);
      break;
    case 'uninstall':
      handleUninstall(rec.data);
      break;
    case 'ready':
      handleReady();
      break;
    default:
      break;
  }
};

const handleInstall = (data: any) => {
  if (!system) {
    return;
  }
  if (data.type === 'all') {
    const writeFilePromise = system.fs.writeFile(
      system._options.systemLocation + 'plugs/' + data.name,
      data.content
    );
    const dialogPromise = Dialog.showMessageBox({
      message: i18n('install.success') + ',' + i18n('please.reboot'),
      type: 'info',
      buttons: [i18n('confirm')],
    });
    Promise.all([writeFilePromise, dialogPromise]).then(() => {
      frameKey.value++;
    });
  } else if (data.type === 'once') {
    const shellPromise = system.shell('node ' + data.content);
    const writeFilePromise = system.fs.writeFile(
      system._options.systemLocation + 'plugs/' + data.name,
      'function main(){\n\n}'
    );
    const dialogPromise = Dialog.showMessageBox({
      message: i18n('install.success'),
      type: 'info',
      buttons: [i18n('confirm')],
    });
    Promise.all([shellPromise, writeFilePromise, dialogPromise]).then(() => {
      frameKey.value++;
    });
  }
};

const handleUninstall = (data: any) => {
  if (!system) {
    return;
  }
  if (data.type === 'all') {
    const unlinkPromise = system.fs.unlink(system._options.systemLocation + 'plugs/' + data.name);
    const dialogPromise = Dialog.showMessageBox({
      message: i18n('uninstall.success'),
      type: 'info',
      buttons: [i18n('confirm')],
    });
    Promise.all([unlinkPromise, dialogPromise]).then(() => {
      frameKey.value++;
    });
  } else if (data.type === 'once') {
    const shellPromise = system.shell('node ' + data.uninstallContent);
    const unlinkPromise = system.fs.unlink(system._options.systemLocation + 'plugs/' + data.name);
    const dialogPromise = Dialog.showMessageBox({
      message: i18n('uninstall.success'),
      type: 'info',
      buttons: [i18n('confirm')],
    });
    Promise.all([shellPromise, unlinkPromise, dialogPromise]).then(() => {
      frameKey.value++;
    });
  }
};

const handleReady = () => {
  if (!system) {
    return;
  }
  const readdirPromise = system.fs.readdir(`${system._options.systemLocation}plugs`).then((res) => {
    return res.map((item) => {
      return {
        name: basename(item.path),
      };
    });
  });
  readdirPromise.then((data) => {
    storeRef.value?.contentWindow?.postMessage(
      {
        type: 'init',
        data: data,
      },
      '*'
    );
  });
};

onMounted(() => {
  window.addEventListener('message', handleMessage);
});

function closeWin() {
  closing.value = true;
  setTimeout(() => {
    browserWindow.close();
  }, 200);
}
</script>

<style scoped>
.store-outer {
  display: flex;
  flex-direction: column;
  height: 100%;
  border-radius: 6px;
  overflow: hidden;
  background-color: rgb(243, 243, 243);
}

.store-handle {
  width: 100%;
  height: 40px;
  user-select: none;
  display: flex;
  flex-direction: row;
  justify-content: flex-end;
  position: absolute;
}
.up-text {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  width: 100%;
  padding: 0 40px;
  font-size: 12px;
  color: rgba(117, 117, 117, 0.675);
  background-color: rgb(243, 243, 243);
  border-top-right-radius: 10px;
  user-select: none;
}
.close-button {
  user-select: none;
  width: 60px;
  height: 100%;
  font-size: 18px;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: rgba(255, 0, 0, 0);
  transition: all 0.2s;
  cursor: pointer;
}
.close-button:hover {
  background-color: red;
  color: white;
}
.store {
  width: 100%;
  height: 100%;
  border: none;
  background-color: white;
}
.closing {
  animation: closing 0.23s;
}
@keyframes closing {
  0% {
    opacity: 1;
  }
  100% {
    opacity: 0;
  }
}
</style>
