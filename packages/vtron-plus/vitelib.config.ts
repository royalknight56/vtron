/*
 * @Author: Royal
 * @LastEditTime: 2022-04-26 11:12:32
 * @Description:
 * @FilePath: /myindex/vitelib.config.ts
 */
//vite --config my-config.js

import vue from '@vitejs/plugin-vue';
import path from 'path';
import { readFileSync } from 'node:fs';
import { build as viteBuild, defineConfig, transformWithEsbuild } from 'vite';
import dts from 'vite-plugin-dts';
// import { visualizer } from 'rollup-plugin-visualizer';
// https://vitejs.dev/config/
let nodeWorkerBuild: Promise<string> | undefined;
function buildNodeWorker() {
  return nodeWorkerBuild ??= (async () => {
    const result = await viteBuild({
      configFile: false,
      logLevel: 'warn',
      resolve: { alias: { vtron: path.resolve(__dirname, '../vtron/src/packages/runtime.ts') } },
      build: {
        write: false,
        target: 'es2020',
        lib: { entry: path.resolve(__dirname, 'src/packages/node/nodeWorkerEntry.ts'), formats: ['es'] },
        rollupOptions: { output: { inlineDynamicImports: true } },
      },
    });
    const output = Array.isArray(result) ? result[0].output : result.output;
    const chunk = output.find(item => item.type === 'chunk');
    if (!chunk || chunk.type !== 'chunk' || output.length !== 1) throw new Error('Expected a single self-contained Node Worker module');
    return chunk.code;
  })();
}
export default defineConfig({
  plugins: [vue(), dts(), {
    name: 'vtron-virtual-preview-worker',
    async generateBundle() {
      for (const file of ['virtual-preview-sw.js', 'virtual-preview-bridge.html']) {
        this.emitFile({ type: 'asset', fileName: file, source: readFileSync(path.resolve(__dirname, 'src/packages/network/' + file), 'utf8') });
      }
      const workerSource = readFileSync(path.resolve(__dirname, 'src/packages/node/syncFsBridge.ts'), 'utf8');
      const workerModule = await transformWithEsbuild(workerSource, 'syncFsBridge.ts', { loader: 'ts', format: 'esm', target: 'es2019' });
      this.emitFile({ type: 'asset', fileName: 'sync-fs-worker.mjs', source: workerModule.code });
      this.emitFile({ type: 'asset', fileName: 'node-worker.mjs', source: await buildNodeWorker() });
    },
  }],
  optimizeDeps: {
    exclude: ['worker'],
  },
  resolve: {
    alias: [
      {
        find: 'node-fetch',
        replacement: 'isomorphic-fetch',
      },

      {
        find: '@',
        replacement: path.resolve(__dirname, 'src'),
      },
      {
        find: '@packages',
        replacement: path.resolve(__dirname, 'src/packages/'),
      },
    ],
    dedupe: ['vue', 'vtron'],
  },
  build: {
    // target:
    target: ['es2019'],
    outDir: './distlib',
    lib: {
      formats: ['es', 'umd'],
      entry: path.resolve(__dirname, 'src/packages/plug.ts'),
      name: 'vtron-plus',
      fileName: (format) => {
        return format === 'es' ? 'vtron-plus.mjs' : 'vtron-plus.umd.js';
      },
    },
    rollupOptions: {
      plugins: [],
      // make sure to externalize deps that shouldn't be bundled
      // into your library
      external: ['vue', 'vtron'],
      output: {
        // Provide global variables to use in the UMD build
        // for externalized deps
        globals: {
          vue: 'Vue',
          vtron: 'vtron',
        },
      },
      //   inlineDynamicImports: true//blog
    },
  },
});
