/**
 * @author vtron-nas
 * 回收站路由
 */
import Router from '@koa/router';
import * as trashService from '../services/trashService';
import { authMiddleware } from '../middleware/auth';

const router = new Router({ prefix: '/api/trash' });

router.use(authMiddleware);

/** 列出回收站内容 */
router.get('/list', async (ctx) => {
  const items = trashService.listTrash(ctx.state.user.username);
  ctx.body = { success: true, data: items };
});

/** 恢复文件 */
router.post('/restore', async (ctx) => {
  const { id } = ctx.request.body as { id: number };
  if (!id) { ctx.status = 400; ctx.body = { success: false, message: '缺少 id 参数' }; return; }
  const restoredPath = await trashService.restoreFromTrash(id, ctx.state.user.username);
  ctx.body = { success: true, data: { path: restoredPath } };
});

/** 彻底删除单个文件 */
router.delete('/purge', async (ctx) => {
  const id = Number(ctx.query.id);
  if (!id) { ctx.status = 400; ctx.body = { success: false, message: '缺少 id 参数' }; return; }
  await trashService.purgeTrashItem(id, ctx.state.user.username);
  ctx.body = { success: true };
});

/** 清空回收站 */
router.delete('/empty', async (ctx) => {
  await trashService.emptyTrash(ctx.state.user.username);
  ctx.body = { success: true };
});

export default router;
