/**
 * @author vtron-nas
 * 服务端配置
 */
import path from 'path';

export const config = {
  /** 服务端口 */
  port: Number(process.env.NAS_PORT) || 3000,
  /** NAS 存储根路径，所有用户文件存放于此 */
  storagePath: process.env.NAS_STORAGE_PATH || path.join(process.cwd(), 'nas-storage'),
  /** 回收站物理路径 */
  trashPath: process.env.NAS_TRASH_PATH || path.join(process.cwd(), 'nas-trash'),
  /** SQLite 数据库路径 */
  dbPath: process.env.NAS_DB_PATH || path.join(process.cwd(), 'nas-data', 'vtron-nas.db'),
  /** JWT 密钥 */
  jwtSecret: process.env.NAS_JWT_SECRET || 'vtron-nas-secret-key-change-in-production',
  /** JWT 过期时间 */
  jwtExpiresIn: process.env.NAS_JWT_EXPIRES || '7d',
  /** 上传文件大小限制（字节），默认 2GB */
  maxFileSize: Number(process.env.NAS_MAX_FILE_SIZE) || 2 * 1024 * 1024 * 1024,
  /** 默认管理员用户名 */
  adminUsername: process.env.NAS_ADMIN_USER || 'admin',
  /** 默认管理员密码 */
  adminPassword: process.env.NAS_ADMIN_PASS || 'admin123',
};
