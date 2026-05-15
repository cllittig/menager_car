import axios, { type InternalAxiosRequestConfig } from 'axios';
import { clearSessionViaBff, getToken, refreshAccessToken } from './auth';

type RetryConfig = InternalAxiosRequestConfig & { _retry?: boolean };

let refreshMutex: Promise<boolean> | null = null;

async function refreshOnce(): Promise<boolean> {
  if (!refreshMutex) {
    refreshMutex = refreshAccessToken().finally(() => {
      refreshMutex = null;
    });
  }
  return refreshMutex;
}

function isPublicUsuarioCreatePost(config: InternalAxiosRequestConfig): boolean {
  const method = (config.method ?? 'get').toLowerCase();
  if (method !== 'post') return false;
  const raw = String(config.url ?? '');
  const path = raw.includes('://') ? new URL(raw).pathname : raw.split('?')[0] ?? '';
  return /\/usuario\/?$/.test(path);
}

axios.interceptors.request.use(
  (config) => {
    const headers = config.headers;
    const hasExplicitAuth =
      (typeof headers?.get === 'function' && Boolean(headers.get('Authorization'))) ||
      Boolean((headers as { Authorization?: string })?.Authorization);
    if (hasExplicitAuth) {
      return config;
    }
    if (isPublicUsuarioCreatePost(config)) {
      return config;
    }
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalConfig = error.config as RetryConfig | undefined;
    const status = error.response?.status;
    const url = String(originalConfig?.url ?? '');

    const isAuthCall =
      url.includes('/auth/login') ||
      url.includes('/auth/refresh') ||
      url.includes('/api/auth/refresh') ||
      url.includes('/api/auth/login') ||
      url.includes('/auth/forgot-password') ||
      url.includes('/auth/reset-password') ||
      url.includes('/auth/sync-password-from-recovery');

    const isPublicUsuarioCreate =
      (originalConfig?.method ?? 'get').toLowerCase() === 'post' &&
      /\/usuario\/?(\?|$)/.test(url);

    if (status !== 401 || isAuthCall || isPublicUsuarioCreate || originalConfig?._retry) {
      return Promise.reject(error);
    }

    if (typeof window === 'undefined' || !originalConfig) {
      return Promise.reject(error);
    }

    originalConfig._retry = true;
    const ok = await refreshOnce();
    if (!ok) {
      await clearSessionViaBff();
      window.location.href = '/login';
      return Promise.reject(error);
    }

    const newToken = getToken();
    if (newToken) {
      originalConfig.headers = originalConfig.headers ?? {};
      originalConfig.headers.Authorization = `Bearer ${newToken}`;
    }
    return axios(originalConfig);
  },
);

export default axios;
