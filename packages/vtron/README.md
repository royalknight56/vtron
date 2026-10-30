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
