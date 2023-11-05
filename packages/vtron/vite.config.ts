/*
 * @Author: Royal
 * @LastEditTime: 2022-04-26 11:16:31
 * @Description:
 * @FilePath: /myindex/vite.config.ts
 */
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';
// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@packages': path.resolve(__dirname, 'src/packages'),
      '@feature': path.resolve(__dirname, 'src/packages/feature'),
    },
  },
});
