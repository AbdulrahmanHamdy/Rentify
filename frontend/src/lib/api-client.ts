import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { tokenManager } from './token-manager';
import type { AuthResponse } from '@/types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5261';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Request Interceptor: Attach in-memory JWT Access Token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = tokenManager.getAccessToken();
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle Token Refresh & 401 Handling
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve(token);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // If 401 Unauthorized and not already retried
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      // Don't loop if login or refresh themselves failed with 401
      if (
        originalRequest.url?.includes('/api/auth/login') ||
        originalRequest.url?.includes('/api/auth/refresh')
      ) {
        return Promise.reject(error);
      }

      const refreshToken = tokenManager.getRefreshToken();
      if (!refreshToken) {
        tokenManager.clearAuth();
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      // Check if a refresh request is already in-flight
      const existingRefresh = tokenManager.getInFlightRefresh();
      if (existingRefresh) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((newToken) => {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      // Start new refresh request
      const refreshPromise = (async () => {
        try {
          const res = await axios.post<AuthResponse>(
            `${API_BASE_URL}/api/auth/refresh`,
            { refreshToken },
            { headers: { 'Content-Type': 'application/json' } }
          );

          const { accessToken, refreshToken: newRefreshToken, userId, email, roles } = res.data;
          tokenManager.setAuth(accessToken, newRefreshToken, { userId, email, roles });

          processQueue(null, accessToken);
          return accessToken;
        } catch (refreshErr) {
          processQueue(refreshErr, null);
          tokenManager.clearAuth();
          return null;
        } finally {
          tokenManager.setInFlightRefresh(null);
        }
      })();

      tokenManager.setInFlightRefresh(refreshPromise);

      const newAccessToken = await refreshPromise;
      if (!newAccessToken) {
        return Promise.reject(error);
      }

      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
      return apiClient(originalRequest);
    }

    return Promise.reject(error);
  }
);
