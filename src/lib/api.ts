import axios from 'axios';
import { useAuthStore } from '../store/authStore';

export const getApiUrl = () => {
  const isLocalhost = typeof window !== 'undefined' && 
    (window.location.hostname === 'localhost' || 
     window.location.hostname === '127.0.0.1');

  let url = import.meta.env.VITE_API_URL || (isLocalhost ? 'http://localhost:3001/api' : 'https://workspace-backend-r9f8.onrender.com/api');
  if (typeof window !== 'undefined') {
    // console.log('[NEXUS-DEBUG] Raw API URL:', url);
  }

  // Prepend protocol if missing (except for localhost/127.0.0.1 where it might be provided)
  if (url && !url.startsWith('http') && !url.includes('localhost') && !url.includes('127.0.0.1')) {
    url = `https://${url}`;
  }

  // Ensure /api suffix
  if (url && !url.endsWith('/api') && !url.endsWith('/api/')) {
    url = url.endsWith('/') ? `${url}api` : `${url}/api`;
  }

  // Ensure trailing slash for Axios baseURL compatibility
  if (url && !url.endsWith('/')) {
    url = `${url}/`;
  }
  
  return url;
};

const api = axios.create({
  baseURL: getApiUrl(),
});

api.interceptors.request.use(async (config) => {
  // Strip leading slash from URL to ensure it appends to baseURL correctly
  if (config.url?.startsWith('/')) {
    config.url = config.url.substring(1);
  }

  const auth = JSON.parse(localStorage.getItem('auth') || '{}');
  const token = auth.token || useAuthStore.getState().accessToken;
  console.log(`[API] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRefreshing = false;
let failedQueue: Array<{ resolve: Function; reject: Function }> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (originalRequest.url?.includes('/auth/login') || originalRequest.url?.includes('/auth/refresh')) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise(function (resolve, reject) {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = 'Bearer ' + token;
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const authData = JSON.parse(localStorage.getItem('auth') || '{}');
      const refreshToken = authData.refreshToken || localStorage.getItem('refreshToken');

      if (refreshToken) {
        try {
          console.log('[AxiosInterceptor] Access token expired. Attempting silent token rotation...');
          // Use fetch for the refresh to avoid triggering Axios interceptors recursively
          const refreshUrl = `${getApiUrl().replace(/\/$/, '')}/auth/refresh`;
          const refreshResponse = await fetch(refreshUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken }),
          });

          if (refreshResponse.ok) {
            const data = await refreshResponse.json();
            const newToken = data.token || data.accessToken;
            const newRefreshToken = data.refreshToken;

            localStorage.setItem('token', newToken);
            if (newRefreshToken) {
              localStorage.setItem('refreshToken', newRefreshToken);
              authData.refreshToken = newRefreshToken;
            }
            authData.token = newToken;
            authData.accessToken = newToken;
            localStorage.setItem('auth', JSON.stringify(authData));

            console.log('[AxiosInterceptor] Silent token rotation succeeded.');
            api.defaults.headers.common['Authorization'] = 'Bearer ' + newToken;
            originalRequest.headers.Authorization = 'Bearer ' + newToken;

            processQueue(null, newToken);
            isRefreshing = false;

            return api(originalRequest);
          } else {
             throw new Error('Refresh token rejected');
          }
        } catch (refreshErr) {
          console.error('[AxiosInterceptor] Silent token rotation failed:', refreshErr);
          processQueue(refreshErr, null);
          isRefreshing = false;
        }
      }

      // Rotation failed or no refresh token
      isRefreshing = false;
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        useAuthStore.getState().logout();
        const currentPath = window.location.pathname;
        let app = 'chat';
        if (currentPath.includes('/tasks')) app = 'tasks';
        else if (currentPath.includes('/mail')) app = 'mail';
        else if (currentPath.includes('/meet')) app = 'meet';
        else if (currentPath.includes('/docs')) app = 'docs';
        else if (currentPath.includes('/sheets')) app = 'sheets';
        else if (currentPath.includes('/show')) app = 'show';
        window.location.href = `/login?expired=true&app=${app}`;
      }
    }
    return Promise.reject(error);
  }
);

export default api;

