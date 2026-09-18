import axios, {
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from 'axios';
import { env } from '@/config/env';
import { ApiError } from '@/types/api';
import { useAuthStore } from '@/lib/auth-store';
import { queryClient } from '@/lib/query-client';
import { getStoredToken } from '@/lib/token-storage';

export const apiClient: AxiosInstance = axios.create({
  baseURL: env.apiBaseUrl,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15_000,
});

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getStoredToken();
    if (token) {
      config.headers.set('Authorization', `Bearer ${token}`);
    }
    return config;
  },
  (error) => Promise.reject(error),
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status ?? 0;
      const data = error.response?.data as { message?: string } | undefined;
      const message =
        data?.message ?? error.message ?? 'Terjadi kesalahan jaringan';

      if (status === 401) {
        useAuthStore.getState().clear();

        queryClient.clear();
      }
      return Promise.reject(
        new ApiError(status, message, error.response?.data),
      );
    }
    return Promise.reject(new ApiError(0, 'Kesalahan tak terduga', error));
  },
);
