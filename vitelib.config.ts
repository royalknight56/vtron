/*
 * @Author: zhangweiyuan-Royal
 * @LastEditTime: 2021-08-18 09:48:26
 * @Description: 
 * @FilePath: /myindex/vitelib.config.ts
 */
//vite --config my-config.js

import { defineConfig } from 'vite';
import path from 'path';
import vue from '@vitejs/plugin-vue'
// https://vitejs.dev/config/
export default defineConfig({
    build: {
        outDir:"./distlib",
        lib: {
          entry: path.resolve(__dirname, 'src/plug.ts'),
          name: 'MyLib',
          fileName: (format) => `my-lib.${format}.js`
        },
        rollupOptions: {
          // 确保外部化处理那些你不想打包进库的依赖
          external: ['vue'],
          output: {
            // 在 UMD 构建模式下为这些外部化的依赖提供一个全局变量
            globals: {
              vue: 'Vue'
            }
          }
        }
      }
})
