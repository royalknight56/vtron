import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';
// https://vitejs.dev/config/
export default defineConfig({
  base: './',
  server: {
    port: 3000,
  },
  plugins: [
    vue(),
    {
      name: 'vtron-plus-subapp-urls',
      apply: 'build',
      transform(code, id) {
        if (!id.includes('/node_modules/vtron-plus/')) return null;

        // npm 包尚未开放入口配置，构建时同步替换其内置地址。
        const updated = code
          .replaceAll('https://vtron.site/store/', 'https://vtronjs.com/subapps/store/')
          .replaceAll('https://vtron.site/startpage', 'https://vtronjs.com/subapps/startpage/');
        return updated === code ? null : { code: updated, map: null };
      },
    },
  ],
});
