import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';
// https://vitejs.dev/config/
export default defineConfig({
  base: './',
  server: {
    port: 3000,
  },
  plugins: [vue()],
});
