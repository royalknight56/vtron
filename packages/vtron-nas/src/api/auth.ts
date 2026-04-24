/**
 * @author vtron-nas
 * 认证 API 封装
 */
import apiClient from './client';

export async function login(username: string, password: string) {
  const res = await apiClient.post('/api/auth/login', { username, password });
  return res.data.data;
}

export async function getMe() {
  const res = await apiClient.get('/api/auth/me');
  return res.data.data;
}

export async function changePassword(oldPassword: string, newPassword: string) {
  const res = await apiClient.put('/api/auth/password', { oldPassword, newPassword });
  return res.data;
}

export async function registerUser(username: string, password: string, role = 'user') {
  const res = await apiClient.post('/api/auth/register', { username, password, role });
  return res.data.data;
}
