import axios from 'axios';
import { useAuthStore } from '../store/authStore';

export const getApiUrl = () => {
  let url = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
  
  // Debug logging for production troubleshooting
  if (typeof window !== 'undefined') {
    // console.log('[NEXUS-DEBUG] Raw API URL:', url);
  }

  // Prepend protocol if missing (except for localhost/127.0.0.1 where it might be provided)
  if (url && !url.startsWith('http') && !url.includes('localhost') && !url.includes('127.0.0.1')) {
    url = `https://${url}`;
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

// Response interceptor — handles 401 auto-logout
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
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

