/**
 * @author vtron-nas
 * 分享 API 封装
 */
import apiClient from './client';

export async function createShare(filePath: string, password?: string, expiresInHours?: number) {
  const res = await apiClient.post('/api/share/create', { filePath, password, expiresInHours });
  return res.data.data;
}

export async function listShares() {
  const res = await apiClient.get('/api/share/list');
  return res.data.data;
}

export async function deleteShare(id: number) {
  await apiClient.delete(`/api/share/${id}`);
}

export async function getPublicShare(token: string, password?: string) {
  const res = await apiClient.get(`/api/share/public/${token}`, { params: { password } });
  return res.data.data;
}

export function getShareDownloadUrl(token: string, password?: string): string {
  let url = `/api/share/public/${token}/download`;
  if (password) url += `?password=${encodeURIComponent(password)}`;
  return url;
}
