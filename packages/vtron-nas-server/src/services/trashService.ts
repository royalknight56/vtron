/**
 * @author vtron-nas
 * 回收站服务
 */
import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db/database';
import { config } from '../config';
import { resolveSafePath } from '../utils/pathSecurity';

export interface TrashItem {
  id: number;
  original_path: string;
  trash_name: string;
  deleted_by: string;
  deleted_at: string;
  is_directory: number;
  size: number;
}

function ensureTrashDir(): void {
  if (!fsSync.existsSync(config.trashPath)) {
    fsSync.mkdirSync(config.trashPath, { recursive: true });
  }
}

/**
 * 将文件移入回收站（物理移动 + DB记录）
 */
export async function moveToTrash(virtualPath: string, username: string): Promise<void> {
  ensureTrashDir();
  const realPath = resolveSafePath(virtualPath);
  const stat = await fs.stat(realPath);
  const trashName = `${uuidv4()}${path.extname(virtualPath)}`;
  const trashDest = path.join(config.trashPath, trashName);

  await fs.rename(realPath, trashDest);

  const db = getDb();
  db.prepare(
    'INSERT INTO trash (original_path, trash_name, deleted_by, is_directory, size) VALUES (?, ?, ?, ?, ?)'
  ).run(virtualPath, trashName, username, stat.isDirectory() ? 1 : 0, stat.size);
}

export function listTrash(username: string): TrashItem[] {
  const db = getDb();
  return db.prepare('SELECT * FROM trash WHERE deleted_by = ? ORDER BY deleted_at DESC').all(username) as TrashItem[];
}

/**
 * 从回收站恢复文件
 */
export async function restoreFromTrash(trashId: number, username: string): Promise<string> {
  const db = getDb();
  const item = db.prepare('SELECT * FROM trash WHERE id = ? AND deleted_by = ?').get(trashId, username) as TrashItem | undefined;
  if (!item) {
    throw Object.assign(new Error('回收站记录不存在'), { status: 404 });
  }

  const trashRealPath = path.join(config.trashPath, item.trash_name);
  const restoreRealPath = resolveSafePath(item.original_path);
  const restoreDir = path.dirname(restoreRealPath);
  await fs.mkdir(restoreDir, { recursive: true });
  await fs.rename(trashRealPath, restoreRealPath);

  db.prepare('DELETE FROM trash WHERE id = ?').run(trashId);
  return item.original_path;
}

/**
 * 彻底删除回收站中的单个文件
 */
export async function purgeTrashItem(trashId: number, username: string): Promise<void> {
  const db = getDb();
  const item = db.prepare('SELECT * FROM trash WHERE id = ? AND deleted_by = ?').get(trashId, username) as TrashItem | undefined;
  if (!item) {
    throw Object.assign(new Error('回收站记录不存在'), { status: 404 });
  }

  const trashRealPath = path.join(config.trashPath, item.trash_name);
  await fs.rm(trashRealPath, { recursive: true, force: true });
  db.prepare('DELETE FROM trash WHERE id = ?').run(trashId);
}

/**
 * 清空回收站
 */
export async function emptyTrash(username: string): Promise<void> {
  const db = getDb();
  const items = db.prepare('SELECT * FROM trash WHERE deleted_by = ?').all(username) as TrashItem[];
  for (const item of items) {
    const trashRealPath = path.join(config.trashPath, item.trash_name);
    await fs.rm(trashRealPath, { recursive: true, force: true }).catch(() => {});
  }
  db.prepare('DELETE FROM trash WHERE deleted_by = ?').run(username);
}
