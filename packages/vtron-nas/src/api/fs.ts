/**
 * @author vtron-nas
 * 文件系统 API 封装
 */
import apiClient from './client';

export async function readFile(path: string) {
  const res = await apiClient.get('/api/fs/readFile', { params: { path } });
  return res.data.data.content;
}

export async function writeFile(path: string, data: string, flag?: string) {
  await apiClient.post('/api/fs/writeFile', { path, data, flag });
}

export async function appendFile(path: string, content: string) {
  await apiClient.post('/api/fs/appendFile', { path, content });
}

export async function readdir(path: string) {
  const res = await apiClient.get('/api/fs/readdir', { params: { path } });
  return res.data.data.files;
}

export async function exists(path: string) {
  const res = await apiClient.get('/api/fs/exists', { params: { path } });
  return res.data.data.exists;
}

export async function stat(path: string) {
  const res = await apiClient.get('/api/fs/stat', { params: { path } });
  return res.data.data;
}

export async function unlinkFile(path: string) {
  await apiClient.delete('/api/fs/unlink', { params: { path } });
}

export async function renameFile(oldPath: string, newPath: string) {
  await apiClient.put('/api/fs/rename', { oldPath, newPath });
}

export async function rm(path: string) {
  await apiClient.delete('/api/fs/rm', { params: { path } });
}

export async function rmdir(path: string) {
  await apiClient.delete('/api/fs/rmdir', { params: { path } });
}

export async function mkdir(path: string) {
  await apiClient.post('/api/fs/mkdir', { path });
}

export async function copyFile(src: string, dest: string) {
  await apiClient.post('/api/fs/copyFile', { src, dest });
}

export async function chmod(path: string, mode: number) {
  await apiClient.put('/api/fs/chmod', { path, mode });
}

export async function search(keyword: string) {
  const res = await apiClient.get('/api/fs/search', { params: { keyword } });
  return res.data.data.files;
}

export async function uploadFile(targetPath: string, file: File) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('path', targetPath);
  const res = await apiClient.post('/api/fs/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 0,
  });
  return res.data.data;
}

export function getDownloadUrl(path: string): string {
  return `/api/fs/download?path=${encodeURIComponent(path)}`;
}

export function getPreviewUrl(path: string): string {
  return `/api/fs/preview?path=${encodeURIComponent(path)}`;
}
