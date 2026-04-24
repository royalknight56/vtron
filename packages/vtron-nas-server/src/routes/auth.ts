/**
 * @author vtron-nas
 * 认证路由
 */
import Router from '@koa/router';
import * as authService from '../services/authService';
import { authMiddleware } from '../middleware/auth';

const router = new Router({ prefix: '/api/auth' });

/** 登录 */
router.post('/login', async (ctx) => {
  const { username, password } = ctx.request.body as { username: string; password: string };
  if (!username || !password) {
    ctx.status = 400;
    ctx.body = { success: false, message: '用户名和密码不能为空' };
    return;
  }
  const result = authService.login(username, password);
  if (!result) {
    ctx.status = 401;
    ctx.body = { success: false, message: '用户名或密码错误' };
    return;
  }
  ctx.body = { success: true, data: result };
});

/** 注册（需管理员权限） */
router.post('/register', authMiddleware, async (ctx) => {
  if (ctx.state.user.role !== 'admin') {
    ctx.status = 403;
    ctx.body = { success: false, message: '仅管理员可创建用户' };
    return;
  }
  const { username, password, role } = ctx.request.body as {
    username: string;
    password: string;
    role?: string;
  };
  if (!username || !password) {
    ctx.status = 400;
    ctx.body = { success: false, message: '用户名和密码不能为空' };
    return;
  }
  const user = authService.register(username, password, role);
  ctx.body = { success: true, data: user };
});

/** 获取当前用户信息 */
router.get('/me', authMiddleware, async (ctx) => {
  const user = authService.getUserInfo(ctx.state.user.userId);
  if (!user) {
    ctx.status = 404;
    ctx.body = { success: false, message: '用户不存在' };
    return;
  }
  ctx.body = { success: true, data: user };
});

/** 修改密码 */
router.put('/password', authMiddleware, async (ctx) => {
  const { oldPassword, newPassword } = ctx.request.body as {
    oldPassword: string;
    newPassword: string;
  };
  if (!oldPassword || !newPassword) {
    ctx.status = 400;
    ctx.body = { success: false, message: '旧密码和新密码不能为空' };
    return;
  }
  const ok = authService.changePassword(ctx.state.user.userId, oldPassword, newPassword);
  if (!ok) {
    ctx.status = 400;
    ctx.body = { success: false, message: '旧密码错误' };
    return;
  }
  ctx.body = { success: true, message: '密码修改成功' };
});

export default router;
