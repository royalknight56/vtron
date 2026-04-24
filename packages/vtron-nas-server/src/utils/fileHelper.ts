/**
 * @author vtron-nas
 * 文件工具函数
 */
import fs from 'fs/promises';
import path from 'path';

/**
 * 递归计算目录大小（字节）
 */
export async function getDirectorySize(dirPath: string): Promise<number> {
  let totalSize = 0;
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      totalSize += await getDirectorySize(fullPath);
    } else {
      const stat = await fs.stat(fullPath);
      totalSize += stat.size;
    }
  }
  return totalSize;
}

/**
 * 递归搜索文件名匹配关键词的文件
 */
export async function searchFiles(
  dirPath: string,
  keyword: string,
  results: string[] = [],
  maxResults = 200
): Promise<string[]> {
  if (results.length >= maxResults) return results;
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      if (results.length >= maxResults) break;
      const fullPath = path.join(dirPath, entry.name);
      if (entry.name.toLowerCase().includes(keyword.toLowerCase())) {
        results.push(fullPath);
      }
      if (entry.isDirectory()) {
        await searchFiles(fullPath, keyword, results, maxResults);
      }
    }
  } catch {
    // 忽略无权访问的目录
  }
  return results;
}
