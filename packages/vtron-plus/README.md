# vtron-plus

Vtron 的应用与扩展功能，依赖 `vtron` 和 Vue 3。

## Node 命令

`node` 命令、Node API 适配、CommonJS/ESM 模块加载和虚拟 net/http 均由 plus 提供。它使用浏览器 JavaScript 引擎，不是完整的 Node.js 环境。

```ts
import { System } from 'vtron';
import { installNodeSupport } from 'vtron-plus';

const system = new System();
await system.whenReady();
const disposeNode = installNodeSupport(system);
await system.shell('node -e "console.log(process.cwd())"');

// 不再需要时注销 node 命令；虚拟文件仍保留。
disposeNode();
```

`vtronPlus()` 默认启用 Node。显式功能列表包含 `node`、`code`、`term` 或 `npm` 时也会启用；使用 `npm: false` 关闭 npm 后，Node 仍可使用。

## npm 命令

`installNpmSupport(system, { registry? })` 会同时启用 Node，并注册 `npm install`、`npm i`、`npm run`。包保存在 Vtron 文件系统中；当前支持范围是纯 JS 包和已适配的 Node API。

安装器不运行包的安装生命周期脚本，也不启动宿主操作系统的 Node 或子进程。注销 npm 命令不会注销独立的 Node 支持。

## 网络配置与迁移

脚本和 npm 下载继续读取 `System.scriptRuntime.fetch`，默认使用浏览器原生 `fetch`。宿主可继续从 `vtron` 导入 `createProxyFetch`，现有代理配置无需更改。

原来从 core 导出的脚本模块类型、虚拟文件 URL 转换函数，以及 `getVirtualNetwork`、`VirtualNetwork`、`requestVirtualHTTP` 和相关类型，现改为从 `vtron-plus` 导入。core 继续提供 `Shell`、`registerShellCommand()` 和 `parseShellArguments()`。

`System.registerScriptModuleLoader()` 和 `prepareScriptModules()` 已移除，Node 直接使用 plus 内置的模块加载器。原先接入自定义加载器的宿主需要调整接入代码，不能仅通过更换导入来源迁移。
