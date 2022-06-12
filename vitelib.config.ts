/*
 * @Author: zhangweiyuan-Royal
 * @LastEditTime: 2022-04-26 11:12:32
 * @Description: 
 * @FilePath: /myindex/vitelib.config.ts
 */
//vite --config my-config.js

import { defineConfig } from 'vite';
import path from 'path';
import vue from '@vitejs/plugin-vue'
import typescript from '@rollup/plugin-typescript';
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
            plugins:[typescript()],
            // 确保外部化处理那些你不想打包进库的依赖
            external: ['vue','element-plus'],
            output: {
                // 在 UMD 构建模式下为这些外部化的依赖提供一个全局变量
                globals: {
                    vue: 'Vue'
                },

            },
            //   inlineDynamicImports: true//blog
        }
    }
})
