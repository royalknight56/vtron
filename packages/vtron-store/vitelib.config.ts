import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
function myPlugin() {
  return {
    name: "transform-file",

    generateBundle(options, bundle) {
      for (let fileName in bundle) {
        console.log("fileName", fileName);
        // if (fileName == "webdav.es.js") {
        bundle[fileName].code = bundle[fileName].code?.replace(
          /import\s*\{\s*([\w\s,]+)\s*\}\s*from 'vue'/g,
          "const {$1} = vue"
        );
        // console.log(bundle[fileName].code);
        // } else {
        //   delete bundle[fileName];
        // }
      }
    },
  };
}
// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue(), myPlugin()],

  // root: "./src/apps/",
  server: {
    port: 3001,
  },
  build: {
    target: "esnext",
    // lib: {
    //   name: "webdav",
    //   entry: ["webdav.ts", "demoApp.ts"],
    // },
    minify: false,
    outDir: "./src/appout",
    rollupOptions: {
      input: ["./src/apps/webdav.ts", "./src/apps/demoApp.ts"],

      output: {
        entryFileNames: "[name].[format].js",
        chunkFileNames: "[name].[format].js",
        // assetFileNames: "[name].[format].js",
        dir: "./src/appout",
        format: "esm",
        // name: "webdav",
        // Provide global variables to use in the UMD build
        // for externalized deps
        globals: {
          vue: "Vue",
        },
      },

      // make sure to externalize deps that shouldn't be bundled
      // into your library
      external: ["vue"],
    },
  },
});
