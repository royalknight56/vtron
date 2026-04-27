/**
 * @author vtron-nas
 * 文件操作服务，封装 Node.js fs 模块
 */
import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import { resolveSafePath, toVirtualPath } from '../utils/pathSecurity';

/** 与 vtron VtronFileWithoutContent 对齐的文件信息结构 */
export interface FileInfo {
  name: string;
  path: string;
  parentPath: string;
  isFile: boolean;
  isDirectory: boolean;
  isSymlink: boolean;
  size: number;
  mode: number;
  mtime: string;
  atime: string;
  birthtime: string;
  rdev: number;
}

function statToFileInfo(virtualPath: string, stat: fsSync.Stats): FileInfo {
  const parsed = path.posix.parse(virtualPath);
  return {
    name: parsed.base || '/',
    path: virtualPath,
    parentPath: parsed.dir || '/',
    isFile: stat.isFile(),
    isDirectory: stat.isDirectory(),
    isSymlink: stat.isSymbolicLink(),
    size: stat.size,
    mode: stat.mode & 0o777,
    mtime: stat.mtime.toISOString(),
    atime: stat.atime.toISOString(),
    birthtime: stat.birthtime.toISOString(),
    rdev: stat.rdev,
  };
}

export async function readFile(virtualPath: string): Promise<string | null> {
  const realPath = resolveSafePath(virtualPath);
  try {
    return await fs.readFile(realPath, 'utf-8');
  } catch {
    return null;
  }
}

export async function writeFile(virtualPath: string, data: string, flag = 'w'): Promise<void> {
  const realPath = resolveSafePath(virtualPath);
  const dir = path.dirname(realPath);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(realPath, data, { flag });
}

export async function appendFile(virtualPath: string, content: string): Promise<void> {
  const realPath = resolveSafePath(virtualPath);
  await fs.appendFile(realPath, content);
}

export async function readdir(virtualPath: string): Promise<FileInfo[]> {
  const realPath = resolveSafePath(virtualPath);
  const entries = await fs.readdir(realPath, { withFileTypes: true });
  const results: FileInfo[] = [];
  for (const entry of entries) {
    const entryRealPath = path.join(realPath, entry.name);
    const entryVirtualPath = virtualPath.replace(/\/$/, '') + '/' + entry.name;
    try {
      const stat = await fs.stat(entryRealPath);
      results.push(statToFileInfo(entryVirtualPath, stat));
    } catch {
      // 跳过无法访问的文件
    }
  }
  return results;
}

export async function exists(virtualPath: string): Promise<boolean> {
  const realPath = resolveSafePath(virtualPath);
  try {
    await fs.access(realPath);
    return true;
  } catch {
    return false;
  }
}

export async function stat(virtualPath: string): Promise<FileInfo | null> {
  const realPath = resolveSafePath(virtualPath);
  try {
    const s = await fs.stat(realPath);
    return statToFileInfo(virtualPath, s);
  } catch {
    return null;
  }
}

export async function unlink(virtualPath: string): Promise<void> {
  const realPath = resolveSafePath(virtualPath);
  await fs.unlink(realPath);
}

export async function rename(oldVirtualPath: string, newVirtualPath: string): Promise<void> {
  const oldReal = resolveSafePath(oldVirtualPath);
  const newReal = resolveSafePath(newVirtualPath);
  const dir = path.dirname(newReal);
  await fs.mkdir(dir, { recursive: true });
  await fs.rename(oldReal, newReal);
}

export async function rm(virtualPath: string): Promise<void> {
  const realPath = resolveSafePath(virtualPath);
  await fs.rm(realPath, { recursive: true, force: true });
}

export async function rmdir(virtualPath: string): Promise<void> {
  const realPath = resolveSafePath(virtualPath);
  await fs.rm(realPath, { recursive: true, force: true });
}

export async function mkdir(virtualPath: string): Promise<void> {
  const realPath = resolveSafePath(virtualPath);
  await fs.mkdir(realPath, { recursive: true });
}

export async function copyFile(srcVirtualPath: string, destVirtualPath: string): Promise<void> {
  const srcReal = resolveSafePath(srcVirtualPath);
  const destReal = resolveSafePath(destVirtualPath);
  const dir = path.dirname(destReal);
  await fs.mkdir(dir, { recursive: true });

  const srcStat = await fs.stat(srcReal);
  if (srcStat.isDirectory()) {
    await copyDir(srcReal, destReal);
  } else {
    await fs.copyFile(srcReal, destReal);
  }
}

async function copyDir(src: string, dest: string): Promise<void> {
  await fs.mkdir(dest, { recursive: true });
  const entries = await fs.readdir(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      await copyDir(srcPath, destPath);
    } else {
      await fs.copyFile(srcPath, destPath);
    }
  }
}

/**
 * chmod 操作：vtron 使用的是虚拟权限位（1=Read, 2=Write, 4=Execute），
 * 不能直接透传给操作系统。此处仅作为逻辑层记录，不修改磁盘真实权限。
 */
export async function chmod(_virtualPath: string, _mode: number): Promise<void> {
  // vtron 虚拟权限与 Unix 权限体系不同，直接 chmod 会导致目录不可访问
  // 此处故意不操作磁盘，权限控制由应用层处理
}

export async function search(keyword: string, basePath = '/'): Promise<FileInfo[]> {
  const { searchFiles } = await import('../utils/fileHelper');
  const realBase = resolveSafePath(basePath);
  const found = await searchFiles(realBase, keyword);
  const results: FileInfo[] = [];
  for (const filePath of found) {
    try {
      const s = await fs.stat(filePath);
      results.push(statToFileInfo(toVirtualPath(filePath), s));
    } catch {
      // 跳过
    }
  }
  return results;
}

/** 获取文件的磁盘真实路径，用于 stream 下载/预览 */
export function getRealPath(virtualPath: string): string {
  return resolveSafePath(virtualPath);
}
