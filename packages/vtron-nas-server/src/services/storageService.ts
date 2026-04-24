/**
 * @author vtron-nas
 * 存储空间信息服务
 */
import { execSync } from 'child_process';
import os from 'os';
import { config } from '../config';
import { getDirectorySize } from '../utils/fileHelper';
import { resolveSafePath } from '../utils/pathSecurity';

export interface StorageInfo {
  total: number;
  used: number;
  available: number;
  usedPercent: number;
  storagePath: string;
}

/**
 * 获取存储根路径所在磁盘的空间信息
 */
export function getDiskInfo(): StorageInfo {
  try {
    if (os.platform() === 'win32') {
      const drive = config.storagePath.slice(0, 2);
      const output = execSync(`wmic logicaldisk where "DeviceID='${drive}'" get Size,FreeSpace /value`, {
        encoding: 'utf-8',
      });
      const freeMatch = output.match(/FreeSpace=(\d+)/);
      const totalMatch = output.match(/Size=(\d+)/);
      const total = totalMatch ? Number(totalMatch[1]) : 0;
      const available = freeMatch ? Number(freeMatch[1]) : 0;
      const used = total - available;
      return {
        total,
        used,
        available,
        usedPercent: total > 0 ? Math.round((used / total) * 100) : 0,
        storagePath: config.storagePath,
      };
    } else {
      const output = execSync(`df -k "${config.storagePath}"`, { encoding: 'utf-8' });
      const lines = output.trim().split('\n');
      const parts = lines[1].split(/\s+/);
      const total = Number(parts[1]) * 1024;
      const used = Number(parts[2]) * 1024;
      const available = Number(parts[3]) * 1024;
      return {
        total,
        used,
        available,
        usedPercent: total > 0 ? Math.round((used / total) * 100) : 0,
        storagePath: config.storagePath,
      };
    }
  } catch {
    return { total: 0, used: 0, available: 0, usedPercent: 0, storagePath: config.storagePath };
  }
}

/**
 * 获取指定虚拟目录的大小
 */
export async function getPathUsage(virtualPath: string): Promise<number> {
  const realPath = resolveSafePath(virtualPath);
  return getDirectorySize(realPath);
}
