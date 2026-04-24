/**
 * @author vtron-nas
 * Koa 应用实例与中间件组装
 */
import Koa from 'koa';
import bodyParser from 'koa-bodyparser';
import cors from '@koa/cors';
import serve from 'koa-static';
import multer from '@koa/multer';
import path from 'path';
import os from 'os';
import { errorHandler } from './middleware/errorHandler';
import { logger } from './middleware/logger';
import { routers } from './routes';
import { config } from './config';

const app = new Koa();

/* multer 文件上传配置 */
const upload = multer({
  dest: path.join(os.tmpdir(), 'vtron-nas-uploads'),
  limits: { fileSize: config.maxFileSize },
});

/* 中间件注册顺序 */
app.use(errorHandler);
app.use(logger);
app.use(cors());
app.use(bodyParser({ jsonLimit: '50mb' }));

/* 为文件上传路由单独挂载 multer */
app.use(async (ctx, next) => {
  if (ctx.path === '/api/fs/upload' && ctx.method === 'POST') {
    await upload.single('file')(ctx as any, next);
  } else {
    await next();
  }
});

/* 注册所有路由 */
for (const router of routers) {
  app.use(router.routes());
  app.use(router.allowedMethods());
}

/* 生产环境下 serve 前端 dist */
const frontendDist = path.join(__dirname, '../../vtron-nas/dist');
app.use(serve(frontendDist));

/* SPA fallback：非 API 路由回退到 index.html */
app.use(async (ctx) => {
  if (!ctx.path.startsWith('/api') && !ctx.path.startsWith('/ws')) {
    const fs = require('fs');
    const indexPath = path.join(frontendDist, 'index.html');
    if (fs.existsSync(indexPath)) {
      ctx.type = 'html';
      ctx.body = fs.createReadStream(indexPath);
    }
  }
});

export default app;
