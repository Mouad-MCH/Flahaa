import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const getSystemPrefersDark = () =>
  typeof window !== 'undefined' && (window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false);

const applyTheme = (isDark) => {
  document.documentElement.classList.toggle('dark', isDark);
};

export const useThemeStore = create(
  persist(
    (set, get) => ({
      isDark: getSystemPrefersDark(),

      toggleTheme: () => {
        const next = !get().isDark;
        applyTheme(next);
        set({ isDark: next });
      },
    }),
    {
      name: 'flahaa-theme',
      onRehydrateStorage: () => (state) => {
        if (state) applyTheme(state.isDark);
      },
    }
  )
);

applyTheme(useThemeStore.getState().isDark);
