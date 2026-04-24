/**
 * @author vtron-nas
 * JWT 认证中间件
 */
import { Context, Next } from 'koa';
import jwt from 'jsonwebtoken';
import { config } from '../config';

export interface JwtPayload {
  userId: number;
  username: string;
  role: string;
}

/**
 * 需要认证的路由使用此中间件，
 * 解码后的用户信息挂载到 ctx.state.user
 */
export async function authMiddleware(ctx: Context, next: Next): Promise<void> {
  const authHeader = ctx.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    ctx.status = 401;
    ctx.body = { success: false, message: '未提供认证令牌' };
    return;
  }
  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, config.jwtSecret) as JwtPayload;
    ctx.state.user = payload;
    await next();
  } catch {
    ctx.status = 401;
    ctx.body = { success: false, message: '认证令牌无效或已过期' };
  }
}
