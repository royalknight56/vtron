/**
 * @author vtron-nas
 * 存储信息路由
 */
import Router from '@koa/router';
import * as storageService from '../services/storageService';
import { authMiddleware } from '../middleware/auth';

const router = new Router({ prefix: '/api/storage' });

router.use(authMiddleware);

/** 获取磁盘总览信息 */
router.get('/info', async (ctx) => {
  const info = storageService.getDiskInfo();
  ctx.body = { success: true, data: info };
});

/** 获取指定目录大小 */
router.get('/usage', async (ctx) => {
  const dirPath = (ctx.query.path as string) || '/';
  const size = await storageService.getPathUsage(dirPath);
  ctx.body = { success: true, data: { path: dirPath, size } };
});

export default router;
