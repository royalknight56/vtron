/**
 * @author vtron-nas
 * 统一错误处理中间件
 */
import { Context, Next } from 'koa';

export async function errorHandler(ctx: Context, next: Next): Promise<void> {
  try {
    await next();
  } catch (err: any) {
    const status = err.status || err.statusCode || 500;
    const message = err.message || '服务器内部错误';
    ctx.status = status;
    ctx.body = { success: false, message };
    if (status === 500) {
      console.error('[ERROR]', err);
    }
  }
}
