# Vtron

`vtron` 提供桌面、虚拟文件系统和 Shell。`node` 命令及 Node API 适配由 `vtron-plus` 提供；仅安装 core 时不会注册 `node`。使用完整的 `vtronPlus()` 插件会默认启用，也可以单独调用 `installNodeSupport(system)`。

## 终端脚本的网络请求

Vtron 默认使用浏览器原生 `fetch`。宿主应用可以在创建 `System` 时注入请求实现，让终端里的脚本使用自己的代理服务：

```ts
import { System, createProxyFetch } from 'vtron';
import { installNodeSupport } from 'vtron-plus';

const system = new System({
  scriptRuntime: {
    fetch: createProxyFetch({
      endpoint: '/api/vtron-proxy',
      allowedOrigins: ['https://api.example.com'],
    }),
  },
});
installNodeSupport(system);
```

`endpoint` 支持同源相对路径或 HTTP(S) 绝对地址，推荐使用同源地址；跨域代理接口仍需允许宿主页面的 CORS 请求。`allowedOrigins` 按完整来源匹配，即协议、域名和端口均需一致；不支持通配符、子串或自动匹配子域名。未命中的请求仍使用原生 `fetch` 直连。

该配置仅作用于当前 `System` 的 Node 脚本和 npm 下载。它不会替换全局 `window.fetch`，也不会接管第三方应用或 iframe 的请求。各实例可以分别配置，配置在初始化时传入，不作为桌面设置持久化。

如果宿主已有请求封装，也可以直接传入与原生 `fetch` 签名相同的函数：

```ts
const system = new System({
  scriptRuntime: {
    fetch: hostFetch, // (input, init?) => Promise<Response>
  },
});
```

## 代理接口约定

宿主需要自行提供 `endpoint` 对应的服务端接口；Vtron 不会启动代理服务器。命中允许来源后，`createProxyFetch` 会在代理地址的查询参数中写入 `url`，保留代理地址原有的其他查询参数。例如：

```text
原请求：https://api.example.com/users?limit=10
代理：  /api/vtron-proxy?url=https%3A%2F%2Fapi.example.com%2Fusers%3Flimit%3D10
```

`url` 是不含片段标识符的完整目标地址。代理请求保留原方法、显式请求头、请求体和取消信号；返回值仍为原生 `Response`。底层 `fetch` 的响应或异常会原样返回，不会在失败后自动改为直连重试。

带请求体的代理请求会先缓冲为 `ArrayBuffer`，因此不适用于流式上传。浏览器对请求头和 Cookie 的限制仍然适用。

服务端必须独立校验目标来源、鉴权和重定向地址，前端的 `allowedOrigins` 只决定哪些请求走代理。服务端转发时应保留上游状态码、响应头和响应体，过滤逐跳请求头，并按宿主的登录机制处理 Cookie 和 Set-Cookie。代理服务自身也需要能访问目标网络。

终端脚本继续使用原来的目标 URL，宿主通过初始化配置选择请求路径即可。

## 可复用的文件系统操作

core 导出基于 `VtronFileInterface` 的异步文件操作，函数名采用 Node fs 的命名风格。调用时第一个参数仍需传入存储实例，参数和返回值并非完整的 Node fs 兼容接口：

```ts
import { realpath, mkdir, exists, writeFile, watch, rename, stat } from 'vtron';

const realPath = await realpath(system.fs, '/C/Users/Desktop');
const firstCreated = await mkdir(system.fs, '/C/Users/Desktop/cache/deps', true);
const existsResult = await exists(system.fs, '/C/Users/Desktop/cache/deps');
await writeFile(system.fs, '/C/Users/Desktop/cache/deps/info.txt', 'ready');
const watcher = await watch(system.fs, '/C/Users/Desktop/cache/deps',
  event => console.log(event.type, event.path), console.error);
// 不再使用时停止轮询。
watcher.close();
```

路径解析逐段读取目录及元数据，支持普通路径的 `.`、`..`，对尚未支持的符号链接和无法确认的大小写转换明确报错。建目录和存在查询接收规范化的绝对路径；递归建目录返回本次操作中第一个创建的目录，已存在时返回 `undefined`。存在查询只在后端确定缺失时返回 `false`，权限或存储错误会向调用方传播。建目录和存在查询可传入可选 `AbortSignal`；后端已经提交的不可取消操作不会回滚。

`writeFile(storage, path, text, flag?, signal?)` 校验真实父目录和文件类型，等待后端写入，支持 `w/a/wx`；它只处理文本，不提供跨后端原子事务。`watch` 使用真实 stat/readdir/readFile 快照轮询，默认间隔 250 ms，可配置 `recursive/intervalMs/signal`，返回 `close()`。快照最多 4096 项、文件内容总计 16 MiB，超限或存储错误会明确报错。监听不跟随符号链接；轮询之间的短暂变化可能合并或遗漏。

`rename(storage, from, to, signal?)` 复用后端真实移动，校验父目录、文件类型及移动结果；支持普通文件覆盖和移动到新目录名，对已有目录覆盖、符号链接及跨卷等不支持场景明确报错。原子性取决于后端，不通过复制样例数据伪造成功。`stat(storage, path, signal?)` 严格查询真实元数据，不存在返回 `null`，路径中遇到符号链接或非目录祖先时报错，返回值剔除文件内容。内存和 IndexedDB 后端的文件大小按 UTF-8 字节计数。

Node 的 `fs` 回调包装、Promise 模块、Buffer 编码及 Worker 同步桥继续由 plus 提供；core 不注册 Node 命令，也不阻塞主线程。

## 二进制文件

`VtronFileInterface` 新增可选的 `readBinaryFile(path)` 和 `writeBinaryFile(path, bytes, { flag? })`，数据为 Uint8Array。三个内置后端均提供实现；IndexedDB/内存使用 Base64 持久化字节，本地文件后端读写真实字节，不依赖包名或文件扩展名。

```ts
import { readFileBytes, writeFileBytes } from 'vtron';
await writeFileBytes(system.fs, '/C/Users/Desktop/program.wasm', wasmBytes);
const bytes = await readFileBytes(system.fs, '/C/Users/Desktop/program.wasm');
```

辅助写入校验父目录、类型和符号链接；不支持二进制的自定义后端只允许 UTF-8 无损回退。原来的字符串 API 保留，对无效 UTF-8 内容明确报错。复制、重命名和 JSON 导入导出保留二进制载荷，监听使用真实字节比较。二进制载荷不属于元数据。ctime 仅在后端能提供实际变化时间时返回，旧记录或本地文件 API 缺少此信息时不推测。

二进制接口已通过 core 类型检查和构建，并在 Chrome 中验证 IndexedDB、内存及本地文件后端（OPFS 目录句柄）的原始字节读写。未验证用户授权的外部磁盘目录。
