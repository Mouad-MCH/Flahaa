import axios from 'axios';
import { useAuthStore } from '../store/authStore.js';
import { useFarmStore } from '../store/farmStore.js';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(
    (config) => {
        const token = useAuthStore.getState().token;
        if(token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        const routesWithoutFarmScope = [
            '/auth/login',
            '/auth/register',
            '/registration-tokens/validate',
        ];

        const shouldSkipFarmScope = routesWithoutFarmScope.some(path => config.url?.includes(path));

        const activeFarmId = useFarmStore.getState().activeFarmId;
        if(activeFarmId && !shouldSkipFarmScope) {
            config.params = {farm_id: activeFarmId, ...config.params}
        }

        return config
    },
    (error) => Promise.reject(error)
);


api.interceptors.response.use(
  (response) => response,

  (error) => {
    const publicPaths = [
      '/auth/login',
      '/auth/register',
      '/registration-tokens/validate',
    ];

    const isPublicRequest = publicPaths.some((path) =>
      error.config?.url?.includes(path)
    );

    if (
      error.response?.status === 401 &&
      !isPublicRequest
    ) {
      useAuthStore.getState().clearAuth();
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);

export default api