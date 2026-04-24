/**
 * @author vtron-nas
 * 存储信息 API 封装
 */
import apiClient from './client';

export async function getStorageInfo() {
  const res = await apiClient.get('/api/storage/info');
  return res.data.data;
}

export async function getPathUsage(path: string) {
  const res = await apiClient.get('/api/storage/usage', { params: { path } });
  return res.data.data;
}
