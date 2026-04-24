/**
 * @author vtron-nas
 * 请求日志中间件
 */
import { Context, Next } from 'koa';

export async function logger(ctx: Context, next: Next): Promise<void> {
  const start = Date.now();
  await next();
  const ms = Date.now() - start;
  console.log(`${ctx.method} ${ctx.url} ${ctx.status} - ${ms}ms`);
}
