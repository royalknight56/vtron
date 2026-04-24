/**
 * @author vtron-nas
 * 路径安全校验，防止目录穿越攻击
 */
import path from 'path';
import { config } from '../config';

/**
 * 将虚拟路径解析为服务器磁盘上的绝对路径，
 * 并确保结果始终在 storagePath 范围内
 */
export function resolveSafePath(virtualPath: string): string {
  const normalized = path.normalize(virtualPath).replace(/^(\.\.(\/|\\|$))+/, '');
  const resolved = path.join(config.storagePath, normalized);
  if (!resolved.startsWith(config.storagePath)) {
    throw new Error('路径越界访问被拒绝');
  }
  return resolved;
}

/**
 * 将磁盘绝对路径转换回虚拟路径
 */
export function toVirtualPath(absolutePath: string): string {
  return '/' + path.relative(config.storagePath, absolutePath).split(path.sep).join('/');
}
