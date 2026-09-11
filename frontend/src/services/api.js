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

        const activeFarmId = useFarmStore.getState().activeFarmId;
        if(activeFarmId) {
            config.params = {farm_id: activeFarmId, ...config.params}
        }

        return config
    },
    (error) => Promise.reject(error)
);


api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        if(error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const { data } = await axios.post(`${API_URL}/auth/refresh`, {}, { withCredentials: true });
                const newToken = data.data.token;

                useAuthStore.getState().setToken(newToken);

                originalRequest.headers.Authorization = `Bearer ${newToken}`;
                return api(originalRequest);
            } catch (refreshError) {
                useAuthStore.getState().logout();
                window.location.href = '/login';
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
)

export default api