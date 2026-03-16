import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'
});

const cache = new Map();

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const fetchWithCache = async (key, fetcher, ttlMs = 30000) => {
  if (cache.has(key)) {
    const entry = cache.get(key);
    if (Date.now() - entry.ts < ttlMs) {
      return entry.data;
    }
  }

  const data = await fetcher();
  cache.set(key, { data, ts: Date.now() });
  return data;
};

export const invalidateCache = (prefix = '') => {
  if (!prefix) {
    cache.clear();
    return;
  }

  Array.from(cache.keys()).forEach((key) => {
    if (String(key).startsWith(prefix)) {
      cache.delete(key);
    }
  });
};

export default api;
