import vue from '@vitejs/plugin-vue';
import path from 'path';
import { defineConfig } from 'vite';
// https://vitejs.dev/config/
export default defineConfig({
  base: './',
  // Demo 始终使用工作区源码，避免内核和编辑器的改动被旧的 npm 包覆盖。
  resolve: {
    alias: [
      { find: 'node-fetch', replacement: 'isomorphic-fetch' },
      { find: /^vtron$/, replacement: path.resolve(__dirname, '../vtron/src/packages/plug.ts') },
      { find: '@', replacement: path.resolve(__dirname, '../vtron/src') },
      { find: '@packages', replacement: path.resolve(__dirname, '../vtron/src/packages') },
      { find: '@feature', replacement: path.resolve(__dirname, '../vtron/src/packages/feature') },
      { find: 'SegMDL2.ttf', replacement: path.resolve(__dirname, '../vtron/public/SegMDL2.ttf') },
      {
        find: 'vtron-plus/distlib/style.css',
        replacement: path.resolve(__dirname, '../vtron-plus/src/style.css'),
      },
      {
        find: /^vtron-plus$/,
        replacement: path.resolve(__dirname, '../vtron-plus/src/packages/plug.ts'),
      },
    ],
    dedupe: ['vue', 'vtron'],
  },
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
