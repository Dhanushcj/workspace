import axios from 'axios';
import { useAuthStore } from '../store/authStore';

export const getApiUrl = () => {
  const isLocalhost = typeof window !== 'undefined' && 
    (window.location.hostname === 'localhost' || 
     window.location.hostname === '127.0.0.1');

  let url = process.env.NEXT_PUBLIC_API_URL || import.meta.env.VITE_API_URL || (isLocalhost ? 'http://localhost:3001/api' : 'https://workspace-backend-r9f8.onrender.com/api');
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

  const token = useAuthStore.getState().accessToken;
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
        window.location.href = '/login?expired=true';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

