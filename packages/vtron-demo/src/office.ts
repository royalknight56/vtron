import { createApp } from 'vue';
import StandaloneOffice from './StandaloneOffice.vue';

const apps = {
  word: () => import('../../vtron-plus/src/packages/apps/WordEditor.vue'),
  excel: () => import('../../vtron-plus/src/packages/apps/ExcelEditor.vue'),
  ppt: () => import('../../vtron-plus/src/packages/apps/PPTEditor.vue'),
};
const root = document.getElementById('app')!;
const app = root.dataset.office as keyof typeof apps;
apps[app]().then(({ default: editor }) => createApp(StandaloneOffice, { editor }).mount(root)).catch(() => {
  root.setAttribute('role', 'alert');
  root.textContent = '编辑器加载失败，请刷新重试。';
});
