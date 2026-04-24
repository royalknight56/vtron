/**
 * @author vtron-nas
 * 回收站 API 封装
 */
import apiClient from './client';

export async function listTrash() {
  const res = await apiClient.get('/api/trash/list');
  return res.data.data;
}

export async function restoreTrash(id: number) {
  const res = await apiClient.post('/api/trash/restore', { id });
  return res.data.data;
}

export async function purgeTrash(id: number) {
  await apiClient.delete('/api/trash/purge', { params: { id } });
}

export async function emptyTrash() {
  await apiClient.delete('/api/trash/empty');
}
