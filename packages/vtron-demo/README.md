# Vue 3 + Typescript + Vite

This template should help get you started developing with Vue 3 and Typescript in Vite.

## Recommended IDE Setup

[VSCode](https://code.visualstudio.com/) + [Vetur](https://marketplace.visualstudio.com/items?itemName=octref.vetur). Make sure to enable `vetur.experimental.templateInterpolationService` in settings!

# 使用方法

## 安装

    npm install

## 启动

    npm run dev

## 部署到 Cloudflare

主 demo 部署在 `https://vtronjs.com/win/`。使用 Node.js 22 或更新版本，在仓库根目录执行：

```bash
pnpm demo deploy:cf
```

该命令将页面构建到 `dist-cloudflare/win/`，然后上传到 Workers Static Assets。
`wrangler.jsonc` 只接管 `/win` 和 `/win/*`，其中 `/win` 自动跳转到 `/win/`。
域名需要在 Cloudflare 上启用代理 DNS；本地发布使用 Wrangler 登录，CI 发布使用有 Workers 编辑和该域名路由编辑权限的 API Token。

GitHub Actions 的 `Demo CI` 在推送 `demo**` 标签时自动发布，也支持手动运行。
仓库需配置 `CLOUDFLARE_API_TOKEN` Secret；CI 使用 Node.js 24，并直接构建 demo 当前声明的依赖版本。
