import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080';

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 8000,
  headers: { 'Content-Type': 'application/json' },
});

// Response interceptor — log errors, never throw on network failure
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.code === 'ERR_NETWORK' || err.code === 'ECONNREFUSED') {
      // Backend offline — callers will fall back to mock data
      return Promise.reject({ offline: true, message: 'Backend offline — using mock data' });
    }
    return Promise.reject(err);
  }
);

/** Returns true when backend is reachable */
export async function isBackendOnline(): Promise<boolean> {
  try {
    await api.get('/api/reports/governance', { timeout: 2000 });
    return true;
  } catch {
    return false;
  }
}
