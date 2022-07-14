/*
 * @Author: Royal
 * @LastEditTime: 2022-04-26 11:16:31
 * @Description: 
 * @FilePath: /myindex/vite.config.ts
 */
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path';
// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "@structure": path.resolve(__dirname, "src/packages/window/structure"),
      "@builtin": path.resolve(__dirname, "src/packages/window/builtin"),
      "@state": path.resolve(__dirname, "src/packages/window/state"),
      "@libs": path.resolve(__dirname, "src/packages/window/libs"),
    },
  },
})
