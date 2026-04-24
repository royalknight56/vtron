/**
 * @author vtron-nas
 * 文件系统路由 -- 与 VtronFileInterface 一一对应
 */
import Router from '@koa/router';
import fsSync from 'fs';
import path from 'path';
import mime from 'mime-types';
import * as fileService from '../services/fileService';
import * as trashService from '../services/trashService';
import { authMiddleware } from '../middleware/auth';

const router = new Router({ prefix: '/api/fs' });

/* 所有文件操作都需要认证 */
router.use(authMiddleware);

router.get('/readFile', async (ctx) => {
  const filePath = ctx.query.path as string;
  if (!filePath) { ctx.status = 400; ctx.body = { success: false, message: '缺少 path 参数' }; return; }
  const content = await fileService.readFile(filePath);
  ctx.body = { success: true, data: { content } };
});

router.post('/writeFile', async (ctx) => {
  const { path: filePath, data, flag } = ctx.request.body as { path: string; data: string; flag?: string };
  if (!filePath) { ctx.status = 400; ctx.body = { success: false, message: '缺少 path 参数' }; return; }
  await fileService.writeFile(filePath, data || '', flag);
  ctx.body = { success: true };
});

router.post('/appendFile', async (ctx) => {
  const { path: filePath, content } = ctx.request.body as { path: string; content: string };
  if (!filePath) { ctx.status = 400; ctx.body = { success: false, message: '缺少 path 参数' }; return; }
  await fileService.appendFile(filePath, content || '');
  ctx.body = { success: true };
});

router.get('/readdir', async (ctx) => {
  const dirPath = (ctx.query.path as string) || '/';
  const files = await fileService.readdir(dirPath);
  ctx.body = { success: true, data: { files } };
});

router.get('/exists', async (ctx) => {
  const filePath = ctx.query.path as string;
  if (!filePath) { ctx.status = 400; ctx.body = { success: false, message: '缺少 path 参数' }; return; }
  const result = await fileService.exists(filePath);
  ctx.body = { success: true, data: { exists: result } };
});

router.get('/stat', async (ctx) => {
  const filePath = ctx.query.path as string;
  if (!filePath) { ctx.status = 400; ctx.body = { success: false, message: '缺少 path 参数' }; return; }
  const info = await fileService.stat(filePath);
  ctx.body = { success: true, data: info };
});

/** 删除文件 -- 移入回收站 */
router.delete('/unlink', async (ctx) => {
  const filePath = ctx.query.path as string;
  if (!filePath) { ctx.status = 400; ctx.body = { success: false, message: '缺少 path 参数' }; return; }
  await trashService.moveToTrash(filePath, ctx.state.user.username);
  ctx.body = { success: true };
});

router.put('/rename', async (ctx) => {
  const { oldPath, newPath } = ctx.request.body as { oldPath: string; newPath: string };
  if (!oldPath || !newPath) { ctx.status = 400; ctx.body = { success: false, message: '缺少路径参数' }; return; }
  await fileService.rename(oldPath, newPath);
  ctx.body = { success: true };
});

/** 递归删除 -- 移入回收站 */
router.delete('/rm', async (ctx) => {
  const filePath = ctx.query.path as string;
  if (!filePath) { ctx.status = 400; ctx.body = { success: false, message: '缺少 path 参数' }; return; }
  await trashService.moveToTrash(filePath, ctx.state.user.username);
  ctx.body = { success: true };
});

/** 删除目录 -- 移入回收站 */
router.delete('/rmdir', async (ctx) => {
  const filePath = ctx.query.path as string;
  if (!filePath) { ctx.status = 400; ctx.body = { success: false, message: '缺少 path 参数' }; return; }
  await trashService.moveToTrash(filePath, ctx.state.user.username);
  ctx.body = { success: true };
});

router.post('/mkdir', async (ctx) => {
  const { path: dirPath } = ctx.request.body as { path: string };
  if (!dirPath) { ctx.status = 400; ctx.body = { success: false, message: '缺少 path 参数' }; return; }
  await fileService.mkdir(dirPath);
  ctx.body = { success: true };
});

router.post('/copyFile', async (ctx) => {
  const { src, dest } = ctx.request.body as { src: string; dest: string };
  if (!src || !dest) { ctx.status = 400; ctx.body = { success: false, message: '缺少路径参数' }; return; }
  await fileService.copyFile(src, dest);
  ctx.body = { success: true };
});

router.put('/chmod', async (ctx) => {
  const { path: filePath, mode } = ctx.request.body as { path: string; mode: number };
  if (!filePath) { ctx.status = 400; ctx.body = { success: false, message: '缺少 path 参数' }; return; }
  await fileService.chmod(filePath, mode);
  ctx.body = { success: true };
});

router.get('/search', async (ctx) => {
  const keyword = ctx.query.keyword as string;
  if (!keyword) { ctx.status = 400; ctx.body = { success: false, message: '缺少 keyword 参数' }; return; }
  const results = await fileService.search(keyword);
  ctx.body = { success: true, data: { files: results } };
});

/** 二进制文件下载（stream） */
router.get('/download', async (ctx) => {
  const filePath = ctx.query.path as string;
  if (!filePath) { ctx.status = 400; ctx.body = { success: false, message: '缺少 path 参数' }; return; }
  const realPath = fileService.getRealPath(filePath);
  const stat = fsSync.statSync(realPath);
  if (!stat.isFile()) { ctx.status = 400; ctx.body = { success: false, message: '不是文件' }; return; }

  const filename = path.basename(filePath);
  ctx.set('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
  ctx.set('Content-Length', String(stat.size));
  ctx.type = mime.lookup(filename) || 'application/octet-stream';
  ctx.body = fsSync.createReadStream(realPath);
});

/** 文件预览（图片/视频/音频/文本 stream） */
router.get('/preview', async (ctx) => {
  const filePath = ctx.query.path as string;
  if (!filePath) { ctx.status = 400; ctx.body = { success: false, message: '缺少 path 参数' }; return; }
  const realPath = fileService.getRealPath(filePath);
  const filename = path.basename(filePath);
  const mimeType = mime.lookup(filename) || 'application/octet-stream';

  ctx.type = mimeType;
  ctx.body = fsSync.createReadStream(realPath);
});

/** 文件上传（multipart），由 app 层 multer 中间件处理 */
router.post('/upload', async (ctx) => {
  const file = (ctx as any).file;
  const targetDir = ctx.request.body?.path || '/';

  if (!file) {
    ctx.status = 400;
    ctx.body = { success: false, message: '未上传文件' };
    return;
  }

  const destVirtualPath = targetDir.replace(/\/$/, '') + '/' + file.originalname;
  const destRealPath = fileService.getRealPath(destVirtualPath);
  const destDir = path.dirname(destRealPath);

  const fsp = require('fs/promises');
  await fsp.mkdir(destDir, { recursive: true });
  await fsp.rename(file.path, destRealPath);

  ctx.body = { success: true, data: { path: destVirtualPath } };
});

export default router;
