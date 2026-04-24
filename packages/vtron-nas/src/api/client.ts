/**
 * @author vtron-nas
 * Axios 实例，统一处理 baseURL、token 拦截器
 */
import axios from 'axios';

const apiClient = axios.create({
  baseURL: '',
  timeout: 30000,
});

/** 获取存储在 localStorage 的 JWT token */
export function getToken(): string | null {
  return localStorage.getItem('vtron-nas-token');
}

export function setToken(token: string): void {
  localStorage.setItem('vtron-nas-token', token);
}

export function removeToken(): void {
  localStorage.removeItem('vtron-nas-token');
}

/* 请求拦截：自动附加 Authorization 头 */
apiClient.interceptors.request.use((cfg) => {
  const token = getToken();
  if (token && cfg.headers) {
    cfg.headers.Authorization = `Bearer ${token}`;
  }
  return cfg;
});

/* 响应拦截：401 自动跳转到登录 */
apiClient.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      removeToken();
      window.dispatchEvent(new CustomEvent('vtron-nas-logout'));
    }
    return Promise.reject(err);
  }
);

export default apiClient;
