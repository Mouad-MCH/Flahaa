import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../services/api.js';
import { useFarmStore } from './farmStore.js';


export const useAuthStore = create(
    persist(
        (set) => ({
            user: null,
            token: null,
            isAuthenticated: false,
            loading: false,
            error: null,


            register: async (userData) => {
                set({loading: true, error: null});
                try {

                    const response = await api.post('/auth/register', userData);

                    const {token, user} = response.data.data;

                    set({user, token, isAuthenticated: true, loading: false});
                    return { success: true };

                } catch(error) {
                    const message = error.response?.data?.name || 'Registration failed';
                    set({ loading: false, error: message });
                    return { success: false, error: message }
                }
            },


            login: async (userData) => {
                set({ loading: true, error: null });
                try {

                    const response = await api.post('/auth/login', userData);
                    const { token, user } = response.data.data;

                    set({ user, token, isAuthenticated: true, loading: false })
                    return { success: true }

                } catch(error) {
                    const message = error.response?.data?.name || 'Login failed';
                    set({ loading: false, error: message });
                    return { success: false, error: message }
                }
            },

            logout: async () => {
                await api.post('/auth/logout');
                set({ user: null, token: null, isAuthenticated: false });
                useFarmStore.getState().clearActiveFarm();
            },

            setToken: (token) => set({ token }),

            clearError: () => ({ error: null }),
        }),

        {
            name: 'flahaa-auth',
            partialize: (state) => ({ user: state.user, token: state.token, isAuthenticated: state.isAuthenticated }),
        }
    )
)