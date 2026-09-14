import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';

const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
const baseURL = base.endsWith('/api') ? base : `${base}/api`;

const api = axios.create({
  baseURL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/* ------------------------------------------------------------------------- */
/* Short-lived GET cache                                                       */
/*                                                                            */
/* Every read goes to a database several hundred milliseconds away, and the   */
/* same lists (stations, pumps, attendants, notifications) are requested by   */
/* several screens in a row. A fresh response is reused for a few seconds so  */
/* moving between pages is instant, concurrent identical requests share one   */
/* flight, and any write empties the cache so a list never shows stale rows   */
/* after a create, edit or delete.                                            */
/* ------------------------------------------------------------------------- */

const CACHE_TTL_MS = 15_000;
const responseCache = new Map<string, { response: AxiosResponse; expires: number }>();
const inFlight = new Map<string, Promise<AxiosResponse>>();

function cacheKey(config: InternalAxiosRequestConfig): string | null {
  if ((config.method ?? 'get').toLowerCase() !== 'get') return null;
  if (config.responseType && config.responseType !== 'json') return null;
  if (config.headers?.['x-no-cache']) return null;
  const params = config.params ? JSON.stringify(config.params, Object.keys(config.params).sort()) : '';
  return `${config.baseURL ?? ''}${config.url ?? ''}?${params}`;
}

export function clearApiCache(): void {
  responseCache.clear();
}

const networkAdapter = axios.getAdapter(axios.defaults.adapter);

api.defaults.adapter = async (config) => {
  const key = cacheKey(config);
  if (!key) {
    const response = await networkAdapter(config);
    clearApiCache();
    return response;
  }

  const hit = responseCache.get(key);
  if (hit && hit.expires > Date.now()) {
    return { ...hit.response, config };
  }

  const pending = inFlight.get(key);
  if (pending) {
    const shared = await pending;
    return { ...shared, config };
  }

  const flight = networkAdapter(config).then((response) => {
    responseCache.set(key, { response, expires: Date.now() + CACHE_TTL_MS });
    return response;
  });
  inFlight.set(key, flight);
  try {
    return await flight;
  } finally {
    inFlight.delete(key);
  }
};

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('relai_token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message?: string }>) => {
    const isLoginRequest = error.config?.url?.includes('/auth/login');
    if (error.response?.status === 401 && !isLoginRequest) {
      if (typeof window !== 'undefined') {
        clearApiCache();
        localStorage.removeItem('relai_token');
        localStorage.removeItem('relai_user');
        window.location.href = '/login';
      }
    }
    const message =
      error.response?.data?.message ||
      error.message ||
      'An unexpected error occurred';
    return Promise.reject(new Error(message));
  }
);

export default api;
