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

`installNpmSupport(system, { registry? })` 会同时启用 Node，并注册 `npm install`、`npm i`、`npm run`。包保存在 Vtron 文件系统中；安装器保留 JS、文本及 WASM 等二进制资源；执行能力取决于已适配的 Node/WASI API，原生 CPU 扩展仍明确拒绝。

安装器不运行包的安装生命周期脚本，也不启动宿主操作系统的 Node 或子进程。注销 npm 命令不会注销独立的 Node 支持。

## 网络配置与迁移

脚本和 npm 下载继续读取 `System.scriptRuntime.fetch`，默认使用浏览器原生 `fetch`。宿主可继续从 `vtron` 导入 `createProxyFetch`，现有代理配置无需更改。

原来从 core 导出的脚本模块类型、虚拟文件 URL 转换函数，以及 `getVirtualNetwork`、`VirtualNetwork`、`requestVirtualHTTP` 和相关类型，现改为从 `vtron-plus` 导入。core 继续提供 `Shell`、`registerShellCommand()` 和 `parseShellArguments()`。

`System.registerScriptModuleLoader()` 和 `prepareScriptModules()` 已移除，Node 直接使用 plus 内置的模块加载器。原先接入自定义加载器的宿主需要调整接入代码，不能仅通过更换导入来源迁移。

## 标准 WebAssembly

脚本可使用浏览器原生 `WebAssembly` API，直接编译和实例化真实字节：

```js
const response = await fetch('/wasm/example.wasm');
if (!response.ok) throw new Error(`HTTP ${response.status}`);
const bytes = await response.arrayBuffer();
const { instance } = await WebAssembly.instantiate(bytes, {});
console.log(instance.exports);
```

运行时没有包名特例、模块映射注册或自动后端替换。WASM 所需的 imports 由脚本按标准 API 提供；缺失导入、无效字节和浏览器不支持的特性会正常报错。普通 WASM 不要求跨源隔离；共享内存或多线程模块需满足浏览器自身要求。当前提供下文说明的 WASI preview1 子集；原生 `.node` 加载、完整 Node/WASI 和第三方文件系统自动同步仍不支持。

## 实验性的同步存在查询桥

宿主可以让专用 Worker 同步查询当前 Vtron 文件系统。Worker 会等待主线程异步查询完成，主线程不会被阻塞：

```ts
// 主线程
import { startSyncExistsHost, createVtronSyncExistsQuery } from 'vtron-plus';

const channel = new MessageChannel();
const host = startSyncExistsHost(channel.port1, createVtronSyncExistsQuery(system.fs));
worker.postMessage({ port: channel.port2 }, [channel.port2]);
// 停止使用时调用 host.dispose()，并终止 Worker。
```

```ts
// 专用 Worker
import { createSyncExistsClient } from 'vtron-plus/sync-fs-worker';

self.onmessage = ({ data }) => {
  const fs = createSyncExistsClient(data.port);
  console.log(fs.existsSync('/C/Users/Desktop/example.js'));
};
```

路径必须是规范化的绝对 Vtron 路径。不存在返回 `false`；权限错误、超时、关闭和不支持的符号链接会抛出错误。宿主需要跨源隔离及 `SharedArrayBuffer`，自定义文件系统须确保 `stat()` 只在路径确实不存在时返回空值，并传播查询错误。

## 实验性的 Node Worker 模式

宿主可将安装包里的 `distlib/node-worker.mjs` 作为静态资源提供，并显式启用 Worker 执行：

```ts
import { installNodeWorkerSupport } from 'vtron-plus';

const disable = installNodeWorkerSupport(system, {
  workerURL: '/assets/node-worker.mjs', // 宿主提供的静态资源地址
  // 可选：让脚本使用明确指定的兼容目标。
  target: { platform: 'linux', arch: 'x64', nodeVersion: '22.14.0' },
});
// 不再需要时调用 disable()；已开始执行的脚本不受影响。
```

页面和 Worker 必须启用跨源隔离（COOP/COEP），并支持 `SharedArrayBuffer`。Worker 脚本的响应也须包含 `Cross-Origin-Embedder-Policy: require-corp`，不能只给 HTML 配置响应头；自定义中间件提前返回静态资源时尤其需要检查这一点。启用后，该 System 的 Node 命令在 Worker 中运行；`fs.existsSync` 同步查询真实 Vtron 文件系统，其他已支持的异步文件操作也转发给同一个文件系统。符号链接、权限错误和超时等仍会明确报错。未启用时保留原来的主线程行为。

`target` 是可选的兼容配置，不反映浏览器的真实平台或 CPU。设置后，脚本的 `process.platform` 和 `process.arch` 分别返回指定值；不设置时仍为 `browser`，读取 `arch` 会报不支持。配置可能使依赖选择 Linux 分支，但不会提供 Linux 系统、子进程或原生二进制执行能力，不支持的操作仍会报错。

Worker 模式暂不支持旧式 `main(system, vue)` 及自定义宿主 fetch；实际使用这些能力时会报错，默认 fetch 仍使用浏览器原生实现。其他同步文件接口和 Vite 开发服务器尚未完整支持。停止脚本时会终止 Worker；已提交给文件系统、但不支持取消的操作不能保证回滚。

脚本不应直接调用 Worker 的 `close()`：浏览器无法可靠通知宿主该 Worker 已退出，终端可能一直等待。同样，同步死循环期间 Worker 无法处理终端输入；这两种情况可能需要刷新页面。


启用 Linux 兼容目标时，`os.release()` 固定返回 `6.8.0-52-generic`，模拟 Ubuntu 的内核版本格式；它不是浏览器宿主的真实内核版本。未启用目标配置时仍明确报不支持。

`target.nodeVersion` 可选，目前可显式设置为 `22.14.0`。设置后 `process.versions.node` 和 `process.version` 分别返回 `22.14.0`、`v22.14.0`；它们是兼容目标，不表示存在真实 Node 进程。Linux 目标下 `os.platform()`、`os.arch()`、`os.type()` 分别返回 `linux`、`x64`、`Linux`。

已支持 `util.types.isUint8Array`，以及 `Buffer.toString('base64url')` 的输出编码。后者不表示 Buffer 的所有输入接口都已支持该编码。`util.isDeepStrictEqual` 支持基础值、普通对象与数组，保留严格原型、枚举属性、符号属性和数组空位比较；对需要递归比较的特殊对象和循环结构明确报不支持。

隔离测试中，Worker 已通过宿主的共享虚拟网络创建 HTTP 服务，Chrome 可加载页面、执行 JS 并应用 CSS。通用 Node 文件系统和网络能力保留。运行时已移除专用构建器后端，第三方包按自身入口和依赖正常加载；需要尚未支持的原生扩展、WASI 或操作系统能力时仍会失败，不能据之前的专用后端测试推断当前 Vite 可用。

Worker 网络桥接随 `installNodeWorkerSupport` 启用，无需额外的网络配置。Worker 的监听端口由原 System 的 `VirtualNetwork` 实际注册，宿主与 Worker 可双向连接并传递字节；Chrome 预览继续使用 `enableVirtualPreview` 的独立来源。监听和连接成功事件要等宿主确认，冲突、拒绝连接、EOF、关闭和错误均跨线程传递。脚本终止时释放该 Worker 的端口和连接。

桥接仅提供已有虚拟 loopback 网络子集，不创建操作系统 TCP 端口，也不提供 WebSocket 升级或完整 Node 网络功能。绑定、解绑、连接请求等待宿主确认的超时为 10 秒；待确认数据最多单连接 32 MiB、单桥接 64 MiB，超过限制会明确报错。数据确认表示进入目标 socket 队列，不能作为应用请求完成的证明。

本轮补齐 HTTP/net 共用事件对象的 `prependListener/prependOnceListener`、once 重入保护与监听器查询。全局定时器返回句柄，支持 `ref/unref/hasRef/refresh/close` 和数字句柄取消；`unref` 会解除该定时器对脚本生命周期的引用，不会取消实际计时，脚本结束时会清理所有剩余定时器。

`node:stream` 使用 `readable-stream@4.7.0` 的浏览器实现，提供 Readable/Writable/Duplex/Transform、背压、pipeline、finished 和 Promise 辅助函数；它是 Node 18 系列流接口的用户态实现，不表示已支持完整 Node 22 或操作系统流。`process.pid` 在 Worker 模式下返回宿主为本次 Worker 分配的虚拟执行 ID，退出时注销；它不是宿主操作系统 PID。

文件系统能力复用 core 导出的 `realpath`、`mkdir`、`exists`、`writeFile`、`watch`、`rename`、`stat`。plus 保留 Node 元数据函数、回调/Promise 包装与同步桥；异步 `lstat` 返回实际链接元数据，`stat` 遇到尚未支持的链接目标解析会报错。异步 `realpath` 对链接或无法确认的路径拼写明确拒绝。同步 `mkdirSync` 等待宿主真实建目录，支持默认模式和递归选项；自定义权限模式、包含 `..` 的建目录路径目前明确不支持。超时或中断不保证撤销已提交的建目录操作。

`fs.writeFileSync` 仅在 Worker 同步桥启用时可用，等待宿主实际写入同一个 Vtron 文件系统后返回。支持 UTF-8 字符串、任意 Uint8Array/Buffer，以及 `w/a/wx` 标志；单次同步读写上限为 16 MiB。其他编码、权限等选项明确拒绝，主线程模式仍不提供同步写入。超时或中断不能撤销已提交的写入；排他创建和并发一致性取决于底层后端，不承诺跨后端原子事务。

`fs.watch` 基于 core 的真实存储轮询，默认间隔 250 ms，支持文件或目录、递归、`persistent`、AbortSignal、UTF-8/Buffer 文件名、`change/rename/error/close` 事件及 `ref/unref/close`。Worker 在初始快照确认后才返回；主线程因异步存储额外提供 `watcher.ready`，依赖初始监听就绪的代码应先等待它。单个快照最多 4096 项、文件内容总计 16 MiB，超过限制或后端出错会报错并关闭监听。不跟随符号链接，轮询之间的短暂变化可能被合并或遗漏，不具备操作系统原生监听的完整语义。`watchFile/unwatchFile` 和 `createWriteStream` 仍不支持。

`process.nextTick(callback, ...args)` 使用独立 FIFO 微任务队列，支持参数、嵌套回调、错误传播与脚本生命周期清理。它实际执行回调，但不能抢占浏览器已排队的 Promise 任务，因此不保证 Node 原生 nextTick 相对 Promise 的调度优先级。

Worker 另支持 `fs.renameSync`、`fs.statSync`、`fs.realpathSync` 及 `realpathSync.native`，均等待宿主真实操作。`renameSync` 支持文件覆盖及移动到新目录名，不支持覆盖已有目录；失败、超时或中断不会伪造成功，已提交的操作也不能保证回滚。`statSync` 支持 `throwIfNoEntry: false`，返回当前文件类型、UTF-8 字节大小及可用日期/毫秒时间戳；Worker 的 statSync/fstatSync 支持 BigInt，异步元数据接口的 BigInt 仍不支持。`realpathSync` 支持 UTF-8/Buffer 路径输出，对符号链接和包含 `..` 的输入明确拒绝。这些同步接口在主线程模式仍不支持。

`fs.createReadStream` 使用浏览器 Readable 实现，真实读取 Vtron 文件字节，支持 UTF-8、字节范围（含 end）、highWaterMark、背压、AbortSignal、错误和关闭。底层先缓冲完整文件，再按字节分块；单文件上限 16 MiB，不提供操作系统文件描述符或 open/ready 事件。仅支持只读标志，其他编码、自定义 fd/fs、autoClose/emitClose 为 false 等选项明确拒绝；`createWriteStream` 仍不支持。

`process.execArgv` 来自本次 Vtron Node 启动参数，与脚本参数 `process.argv` 分开。文件执行和历史内联入口没有 Node 选项时返回空数组；`node -e "code"` 与 `node --eval "code"` 分别返回实际选项及代码，不混入文件路径或脚本参数。主线程和 Node Worker 使用同一语义，每次执行都有独立数组。Worker 默认继承父线程的启动参数快照，修改公开的 process.execArgv 不会改变这个快照；显式 `execArgv: []` 可清空，非空自定义 Node 引擎选项明确报 `ERR_WORKER_INVALID_EXEC_ARGV`。其他未实现的 Node CLI 选项仍明确拒绝。

`util.inspect` 可显示 Error 的实际堆栈、附加属性、cause、AggregateError.errors 和循环引用，遵循深度限制，不执行自定义 getter；错误格式化不会因这些常见字段而掩盖原始报错。

`util.styleText` 支持单个或多个 ANSI 样式、`validateStream`、输出流及当前脚本环境的颜色开关，样式表可从 `util.inspect.colors` 读取和扩展；未知样式或选项明确报错。`callbackify` 将 Promise/thenable 转成错误优先回调，保留调用者的 this，并异步分发结果；空值拒绝会封装为 `ERR_FALSY_VALUE_REJECTION`。`inherits` 设置实际原型链和 super_，另提供浏览器原生 TextEncoder/TextDecoder 及 `toUSVString`。

全局与 `node:timers` 提供 `setImmediate/clearImmediate`，支持参数、取消和 ref/unref/hasRef，回调真实执行并参与脚本生命周期。它基于浏览器后续任务，不保证 libuv check 阶段或相对其他 I/O 的完整顺序。

入口脚本、CommonJS 和 ESM 在同一次执行中共享脚本全局作用域；写入 `globalThis` 或 `global` 后，其他模块可通过同名裸变量读取，局部声明继续优先，数据不写入宿主页面。Node Worker 中未处理的 Promise 拒绝和原生回调异常会转入 process 事件；没有处理器时，终端显示错误并以失败退出。

## 通用二进制 FS、WASI 与 Worker

运行时不识别具体第三方包，不提供模块映射、自动后端替换或原生扩展执行。Chrome 集成验证已覆盖二进制文件与描述符读写、普通 CommonJS 包自行读取 WASM 并通过 WASI 访问 Vtron 文件，以及真实子 Worker 的消息、端口与 ArrayBuffer 转移、共享内存、WebAssembly.Module 克隆、异常退出和主动终止。

core 的三个文件后端增加可选的 `readBinaryFile/writeBinaryFile`，并导出 `readFileBytes/writeFileBytes` 辅助函数。IndexedDB 和内存后端以 Base64 保存原始字节，兼容 JSON 导入导出；本地文件后端直接读写文件字节。旧文本文件继续可读。文本 `readFile` 对无效 UTF-8 明确报错，二进制调用不会有损转码。自定义后端未提供二进制接口时，只能回退处理可无损表示的 UTF-8 字节。

Node 的 `readFile` 和 Worker 内 `readFileSync` 默认返回 Buffer，指定 UTF-8 编码则返回字符串；写入 Buffer/Uint8Array 时保留原始字节。npm 解包保留二进制资源，但继续拒绝 `.node` 等原生扩展、不执行安装脚本，也不自动选择平台绑定。

Worker 同步桥增加 `readFileSync/readdirSync`，以及执行内的 `openSync/closeSync/readSync/writeSync/fstatSync/ftruncateSync`。文件描述符使用真实存储，支持常用只读、覆盖、追加和读写标志，以及 Buffer 范围与位置参数；读写会按需缓冲完整文件，不是操作系统原生文件句柄。最多同时打开 1024 个描述符，单次同步读写上限 16 MiB。自定义 open 权限、刷盘、异步 FileHandle，以及同一执行内，打开文件期间的重命名/删除不支持；其他执行或编辑器同时移动、删除文件，可能使后续描述符操作失败。虚拟 dev/ino/nlink 只描述当前运行时的文件视图；后端缺少 ctime 时不以 mtime 冒充。普通文件的 `lstatSync` 可用，符号链接仍明确拒绝。

`require('node:wasi')` 提供基于 `@tybys/wasm-util` 的 `WASI` preview1 子集，文件操作复用上述同步 FS，支持标准 imports、参数、环境、preopens、时钟、安全随机数、UTF-8 标准输出及 start/initialize。需要文件系统的 WASI 应在 Node Worker 模式运行。同步终端输入返回 EAGAIN，未支持的文件系统操作返回错误；不提供完整 WASI 或线程 ABI 的保证。

```js
const { readFileSync } = require('node:fs');
const { WASI } = require('node:wasi');
const wasi = new WASI({ version: 'preview1', args: [], env: {},
  preopens: { '/project': process.cwd() }, returnOnExit: true });
const compiled = await WebAssembly.compile(readFileSync('./program.wasm'));
const instance = await WebAssembly.instantiate(compiled, wasi.getImportObject());
const code = wasi.start(instance);
```

`worker_threads.Worker` 在 Node Worker 模式中由宿主创建真实的子 Worker，使用同一个 Vtron 文件系统。支持 Vtron 文件入口、eval、argv、workerData、name、消息端口转移、online/message/error/exit、terminate 和 ref/unref；子线程获得实际分配的虚拟 threadId、parentPort 和 workerData。MessageChannel/MessagePort 使用浏览器消息通道并包装 Node 事件接口。stdout/stderr 默认转发到原终端，独立输出流、自定义 resourceLimits、同步 receiveMessageOnPort 和其他未实现操作会明确拒绝。当前每层最多 16 个子 Worker，总计最多 32 个 Worker，子线程深度最多 4 层；父执行结束会终止子线程。

全局 `MessageChannel/MessagePort` 与 `node:worker_threads` 导出相同。新端口默认不保活，添加/移除 message 监听时自动调整引用；显式 `ref()` 即使没有监听器也会阻止脚本结束，`unref()` 解除引用但不关闭通道。支持 `onmessage/onmessageerror`、`addEventListener/removeEventListener`、once 和 AbortSignal，消息与转移端口仍通过真实浏览器通道传输；`dispatchEvent` 和 passive 监听明确不支持。

Worker 的 `env` 选项使用独立环境快照：省略或传入 null 时，复制创建 Worker 那一刻的 `process.env`；显式对象完整替换子线程环境，`env: {}` 保持为空，不自动补 HOME、USER 等值。只复制自身可枚举的字符串键，值按 Node 行为转成字符串；父子线程的修改互不影响，孙线程从其直接父线程的当前环境复制。传输的是 Vtron 脚本环境，不读取宿主机器的环境变量。数组环境和 `SHARE_ENV` 共享写入尚不支持，调用时明确报错。

`readlink`（回调/Promise）和 Worker 的 `readlinkSync` 会查询真实文件状态：普通文件及目录返回 EINVAL，不存在返回 ENOENT；链接目标读取仍明确不支持。WASI 的内存绑定覆盖公开初始化及 Node WASI 的 kSetMemory 通道，随机数与标准输出使用同一块实际内存。缺少 ctime 的旧记录或后端仍会使 WASI stat 返回 ENOSYS，不用 mtime 冒充 ctime。验证时，仅对隔离测试副本执行了真实的元数据更新，没有迁移用户桌面的旧记录。

同步 `require(ESM)` 支持无顶层 await 的本地依赖图，与 `import()` 共用求值记录和 live bindings；重复或并发加载不会重复执行正文。支持具名/默认导出、重导出、`module.exports` 互操作导出、`import.meta`、CommonJS 缓存以及 `module-sync` 条件。含顶层 await（含 `for await`）或远程模块的图会在同步执行前报 `ERR_REQUIRE_ASYNC_MODULE`，仍可异步 import。ESM 循环依赖明确报 `ERR_MODULE_CYCLE_UNSUPPORTED`，跨 CommonJS 的求值重入报 `ERR_REQUIRE_CYCLE_MODULE`；不宣称完整原生 Node ESM 语义。ESM 记录独立于公开的 `require.cache`，修改后者不会清除 ESM 实例。转换仍使用 Babel，求值不再依赖 SystemJS。

Vite 8.3.5 / Rolldown 1.2.15 在隔离项目中使用官方 `@rolldown/binding-wasm32-wasi@1.2.15`，并将其测试依赖切换为 `@napi-rs/wasm-runtime@1.2.5` 与 `@emnapi/core` / `@emnapi/runtime@2.0.0-alpha.5`。这组版本已通过原生 Node 24.18.0 的绑定加载。Chrome 中已实际执行 `npm run dev`，CLI 输出 `VITE v8.3.5 ready` 并持续监听虚拟端口 5173；隔离预览可打开 HTML，执行测试 JS 修改页面，并应用 CSS（绿色、24px）。这验证了基础开发服务和资源转换，不代表完整 Vue 工程、依赖预构建或 HMR 已可用。测试副本的旧元数据通过真实更新补上 ctime；缺失该字段的旧数据及后端仍有上述限制。未修改第三方包源码或加入包专用加载逻辑。
