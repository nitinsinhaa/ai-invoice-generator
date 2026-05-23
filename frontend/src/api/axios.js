import axios from 'axios';
import { getToken, getRefreshToken, setTokens, clearToken } from '../utils/authToken';

function normalizeApiUrl(raw) {
  const fallback = 'http://localhost:5000/api';
  if (!raw) return fallback;
  const trimmed = raw.replace(/\/$/, '');
  return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
}

const API_URL = normalizeApiUrl(import.meta.env.VITE_API_URL);

const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

let refreshPromise = null;

async function refreshAccessToken() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    throw new Error('No refresh token');
  }

  const { data } = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
  const payload = data.data || data;
  setTokens({
    accessToken: payload.accessToken || payload.token,
    refreshToken: payload.refreshToken,
  });
  return payload.accessToken || payload.token;
}

axiosInstance.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      const path = window.location.pathname;
      const isPublicRoute = path === '/login' || path === '/register';
      const isAuthEndpoint =
        originalRequest.url?.includes('/auth/login') ||
        originalRequest.url?.includes('/auth/register') ||
        originalRequest.url?.includes('/auth/refresh');

      if (!isPublicRoute && !isAuthEndpoint && getRefreshToken()) {
        originalRequest._retry = true;
        try {
          if (!refreshPromise) {
            refreshPromise = refreshAccessToken().finally(() => {
              refreshPromise = null;
            });
          }
          const newToken = await refreshPromise;
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return axiosInstance(originalRequest);
        } catch {
          clearToken();
          if (!isPublicRoute) {
            window.location.href = '/login';
          }
        }
      } else if (!isPublicRoute && !isAuthEndpoint) {
        clearToken();
        window.location.href = '/login';
      }
    }

    if (error.response?.status === 429) {
      const msg =
        error.response?.data?.message ||
        'Too many requests. Please wait a moment and try again.';
      error.message = msg;
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
