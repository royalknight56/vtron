/**
 * @author vtron-nas
 * 用户认证服务
 */
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getDb } from '../db/database';
import { config } from '../config';

export interface User {
  id: number;
  username: string;
  password: string;
  role: string;
  created_at: string;
  updated_at: string;
}

/**
 * 初始化默认管理员账户（首次启动时）
 */
export function initAdminUser(): void {
  const db = getDb();
  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(config.adminUsername);
  if (!existing) {
    const hashed = bcrypt.hashSync(config.adminPassword, 10);
    db.prepare('INSERT INTO users (username, password, role) VALUES (?, ?, ?)').run(
      config.adminUsername,
      hashed,
      'admin'
    );
    console.log(`[AUTH] 已创建默认管理员账户: ${config.adminUsername}`);
  }
}

export function login(username: string, password: string): { token: string; user: Omit<User, 'password'> } | null {
  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username) as User | undefined;
  if (!user) return null;
  if (!bcrypt.compareSync(password, user.password)) return null;

  const token = jwt.sign(
    { userId: user.id, username: user.username, role: user.role },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );

  const { password: _, ...safeUser } = user;
  return { token, user: safeUser };
}

export function register(username: string, password: string, role = 'user'): Omit<User, 'password'> {
  const db = getDb();
  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  if (existing) {
    throw Object.assign(new Error('用户名已存在'), { status: 409 });
  }
  const hashed = bcrypt.hashSync(password, 10);
  const result = db.prepare('INSERT INTO users (username, password, role) VALUES (?, ?, ?)').run(
    username,
    hashed,
    role
  );
  return {
    id: result.lastInsertRowid as number,
    username,
    role,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

export function changePassword(userId: number, oldPassword: string, newPassword: string): boolean {
  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as User | undefined;
  if (!user) return false;
  if (!bcrypt.compareSync(oldPassword, user.password)) return false;
  const hashed = bcrypt.hashSync(newPassword, 10);
  db.prepare("UPDATE users SET password = ?, updated_at = datetime('now') WHERE id = ?").run(hashed, userId);
  return true;
}

export function getUserInfo(userId: number): Omit<User, 'password'> | null {
  const db = getDb();
  const user = db.prepare('SELECT id, username, role, created_at, updated_at FROM users WHERE id = ?').get(userId) as Omit<User, 'password'> | undefined;
  return user || null;
}
