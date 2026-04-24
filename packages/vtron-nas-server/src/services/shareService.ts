/**
 * @author vtron-nas
 * 文件分享服务
 */
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import { getDb } from '../db/database';
import { resolveSafePath } from '../utils/pathSecurity';
import fs from 'fs/promises';

export interface ShareRecord {
  id: number;
  token: string;
  file_path: string;
  created_by: string;
  password: string | null;
  expires_at: string | null;
  download_count: number;
  created_at: string;
}

/**
 * 创建分享链接
 */
export function createShare(
  filePath: string,
  username: string,
  password?: string,
  expiresInHours?: number
): ShareRecord {
  const realPath = resolveSafePath(filePath);

  const db = getDb();
  const token = uuidv4().replace(/-/g, '').slice(0, 16);
  const hashedPwd = password ? bcrypt.hashSync(password, 10) : null;
  const expiresAt = expiresInHours
    ? new Date(Date.now() + expiresInHours * 3600 * 1000).toISOString()
    : null;

  db.prepare(
    'INSERT INTO shares (token, file_path, created_by, password, expires_at) VALUES (?, ?, ?, ?, ?)'
  ).run(token, filePath, username, hashedPwd, expiresAt);

  const record = db.prepare('SELECT * FROM shares WHERE token = ?').get(token) as ShareRecord;
  return record;
}

/**
 * 通过 token 获取分享信息（公开访问时使用）
 */
export function getShareByToken(token: string): ShareRecord | null {
  const db = getDb();
  const record = db.prepare('SELECT * FROM shares WHERE token = ?').get(token) as ShareRecord | undefined;
  if (!record) return null;

  if (record.expires_at && new Date(record.expires_at) < new Date()) {
    db.prepare('DELETE FROM shares WHERE id = ?').run(record.id);
    return null;
  }
  return record;
}

/**
 * 验证分享密码
 */
export function verifySharePassword(record: ShareRecord, password: string): boolean {
  if (!record.password) return true;
  return bcrypt.compareSync(password, record.password);
}

/**
 * 增加下载计数
 */
export function incrementDownloadCount(shareId: number): void {
  const db = getDb();
  db.prepare('UPDATE shares SET download_count = download_count + 1 WHERE id = ?').run(shareId);
}

/**
 * 列出用户的所有分享
 */
export function listShares(username: string): ShareRecord[] {
  const db = getDb();
  return db.prepare('SELECT * FROM shares WHERE created_by = ? ORDER BY created_at DESC').all(username) as ShareRecord[];
}

/**
 * 删除分享
 */
export function deleteShare(shareId: number, username: string): boolean {
  const db = getDb();
  const result = db.prepare('DELETE FROM shares WHERE id = ? AND created_by = ?').run(shareId, username);
  return result.changes > 0;
}
