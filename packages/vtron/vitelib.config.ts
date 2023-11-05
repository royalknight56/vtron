/*
 * @Author: Royal
 * @LastEditTime: 2022-04-26 11:12:32
 * @Description:
 * @FilePath: /myindex/vitelib.config.ts
 */
//vite --config my-config.js

import { defineConfig } from 'vite';
import path from 'path';
import vue from '@vitejs/plugin-vue';
import dts from 'vite-plugin-dts';
// import { visualizer } from 'rollup-plugin-visualizer';
// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue(), dts()],
  resolve: {
    alias: [
      {
        find: '@',
        replacement: path.resolve(__dirname, 'src'),
      },
      {
        find: '@packages',
        replacement: path.resolve(__dirname, 'src/packages/'),
      },
      {
        find: '@feature',
        replacement: path.resolve(__dirname, 'src/packages/feature/'),
      },
    ],
    dedupe: ['vue'],
  },
  build: {
    // target:
    target: ['es2019'],
    outDir: './distlib',
    lib: {
      formats: ['es', 'umd'],
      entry: path.resolve(__dirname, 'src/packages/plug.ts'),
      name: 'vtron',
      fileName: (format) => {
        return format === 'es' ? 'vtron.mjs' : 'vtron.umd.js';
      },
    },
    rollupOptions: {
      plugins: [],
      // make sure to externalize deps that shouldn't be bundled
      // into your library
      external: ['vue'],
      output: {
        // Provide global variables to use in the UMD build
        // for externalized deps
        globals: {
          vue: 'Vue',
        },
      },
      //   inlineDynamicImports: true//blog
    },
  },
});
