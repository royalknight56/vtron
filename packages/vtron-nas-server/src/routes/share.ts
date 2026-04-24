/**
 * @author vtron-nas
 * 分享路由
 */
import Router from '@koa/router';
import fsSync from 'fs';
import path from 'path';
import mime from 'mime-types';
import * as shareService from '../services/shareService';
import * as fileService from '../services/fileService';
import { authMiddleware } from '../middleware/auth';

const router = new Router({ prefix: '/api/share' });

/** 创建分享链接（需认证） */
router.post('/create', authMiddleware, async (ctx) => {
  const { filePath, password, expiresInHours } = ctx.request.body as {
    filePath: string;
    password?: string;
    expiresInHours?: number;
  };
  if (!filePath) { ctx.status = 400; ctx.body = { success: false, message: '缺少 filePath 参数' }; return; }

  const fileExists = await fileService.exists(filePath);
  if (!fileExists) { ctx.status = 404; ctx.body = { success: false, message: '文件不存在' }; return; }

  const record = shareService.createShare(filePath, ctx.state.user.username, password, expiresInHours);
  ctx.body = { success: true, data: record };
});

/** 列出我的分享（需认证） */
router.get('/list', authMiddleware, async (ctx) => {
  const shares = shareService.listShares(ctx.state.user.username);
  ctx.body = { success: true, data: shares };
});

/** 删除分享（需认证） */
router.delete('/:id', authMiddleware, async (ctx) => {
  const id = Number(ctx.params.id);
  const ok = shareService.deleteShare(id, ctx.state.user.username);
  if (!ok) { ctx.status = 404; ctx.body = { success: false, message: '分享不存在' }; return; }
  ctx.body = { success: true };
});

/** 通过 token 访问分享（公开） */
router.get('/public/:token', async (ctx) => {
  const record = shareService.getShareByToken(ctx.params.token);
  if (!record) { ctx.status = 404; ctx.body = { success: false, message: '分享链接无效或已过期' }; return; }

  const pwd = ctx.query.password as string;
  if (record.password && !shareService.verifySharePassword(record, pwd || '')) {
    ctx.status = 403;
    ctx.body = { success: false, message: '需要分享密码', needPassword: true };
    return;
  }

  const info = await fileService.stat(record.file_path);
  ctx.body = { success: true, data: { share: record, file: info } };
});

/** 通过 token 下载文件（公开） */
router.get('/public/:token/download', async (ctx) => {
  const record = shareService.getShareByToken(ctx.params.token);
  if (!record) { ctx.status = 404; ctx.body = { success: false, message: '分享链接无效或已过期' }; return; }

  const pwd = ctx.query.password as string;
  if (record.password && !shareService.verifySharePassword(record, pwd || '')) {
    ctx.status = 403;
    ctx.body = { success: false, message: '需要分享密码' };
    return;
  }

  const realPath = fileService.getRealPath(record.file_path);
  const filename = path.basename(record.file_path);
  const stat = fsSync.statSync(realPath);

  shareService.incrementDownloadCount(record.id);

  ctx.set('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
  ctx.set('Content-Length', String(stat.size));
  ctx.type = mime.lookup(filename) || 'application/octet-stream';
  ctx.body = fsSync.createReadStream(realPath);
});

export default router;
