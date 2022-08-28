/*
 * @Author: Royal
 * @LastEditTime: 2022-04-26 11:12:32
 * @Description: 
 * @FilePath: /myindex/vitelib.config.ts
 */
//vite --config my-config.js

import { defineConfig } from 'vite';
import path from 'path';
import vue from '@vitejs/plugin-vue'
import dts from "vite-plugin-dts"
// https://vitejs.dev/config/
export default defineConfig({
    plugins: [vue(),dts()],
    resolve: {
        alias: [
            {
                find: "@",
                replacement: path.resolve(__dirname, 'src')
              },
              {
                find: "@structure",
                replacement: path.resolve(__dirname, 'src/packages/window/structure')
              },
              {
                find: "@builtin",
                replacement: path.resolve(__dirname, 'src/packages/window/builtin')
              },
              {
                find: "@state",
                replacement: path.resolve(__dirname, 'src/packages/window/state')
              },
              {
                find: "@libs",
                replacement: path.resolve(__dirname, 'src/packages/window/libs')
              }
            ],
        dedupe: ['vue']
    },
    build: {
        // target:
        target:"es2019",
        outDir: "./distlib",
        lib: {
            formats: ["es"],
            entry: path.resolve(__dirname, 'src/plug.ts'),
            name: 'Win10',
            fileName: (format) => `plug.js`
        },
        rollupOptions: {
            plugins:[
            ],
            //   inlineDynamicImports: true//blog
        }
    }
})
