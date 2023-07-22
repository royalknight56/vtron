<template>
  <iframe class="store" ref="storeRef" :key="frameKey" :src="storeUrl"></iframe>
</template>

<script lang="ts" setup>
import { onMounted, ref } from 'vue';
import { useSystem } from '../system';
import { Dialog, basename } from '@packages/plug';
import { i18n } from '@feature/i18n';

const storeRef = ref<HTMLIFrameElement | null>(null);
const frameKey = ref(0);
const isProduction = import.meta.env.PROD;
const storeUrl = isProduction ? 'https://myim.online/store/' : 'http://localhost:3001';

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
  const system = useSystem();
  if (!system) {
    return;
  }
  if (data.type === 'all') {
    const writeFilePromise = system.fs.writeFile(data.path, {
      content: data.file.content,
    });
    const dialogPromise = Dialog.showMessageBox({
      message: i18n('install.success'),
      type: 'info',
      buttons: [i18n('confirm')],
    });
    Promise.all([writeFilePromise, dialogPromise]).then(() => {
      frameKey.value++;
    });
  } else if (data.type === 'once') {
    const shellPromise = system.shell('node ' + data.file.content);
    const writeFilePromise = system.fs.writeFile(data.path, {
      content: 'function main(){\n\n}',
    });
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
  const system = useSystem();
  if (!system) {
    return;
  }
  if (data.type === 'all') {
    const unlinkPromise = system.fs.unlink(data.path);
    const dialogPromise = Dialog.showMessageBox({
      message: i18n('uninstall.success'),
      type: 'info',
      buttons: [i18n('confirm')],
    });
    Promise.all([unlinkPromise, dialogPromise]).then(() => {
      frameKey.value++;
    });
  } else if (data.type === 'once') {
    const shellPromise = system.shell('node ' + data.file.uninstallContent);
    const unlinkPromise = system.fs.unlink(data.path);
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
  const system = useSystem();
  if (!system) {
    return;
  }
  const readdirPromise = system.fs.readdir('/C/System/plugs').then((res) => {
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
</script>

<style scoped>
.store {
  width: 100%;
  height: 100%;
  border: none;
}
</style>
