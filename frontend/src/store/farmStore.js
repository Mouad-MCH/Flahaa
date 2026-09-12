import { create } from 'zustand';
import { persist } from 'zustand/middleware';


export const useFarmStore = create(
    persist(
        (set) => ({
            activeFarmId: null,
            farm: null,

            setFarmActive: (farm) => {
                set({ farm: farm })
            },
            setActiveFarmId: (farmId) => set({ activeFarmId: farmId }),
            clearActiveFarm: () => set({ activeFarmId: null })
        }),
        { name: 'flahaa-active-farm' }
    )
)