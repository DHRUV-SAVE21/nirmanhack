import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Persona Store
 * Manages user persona (farmer / industrial) and guided tour state.
 * Persisted via localStorage so choices survive across sessions.
 */
export const usePersonaStore = create(
    persist(
        (set, get) => ({
            // 'farmer' | 'industrial' | null (null = not yet selected)
            persona: null,

            // Has the user completed the guided tour at least once?
            tourCompleted: false,

            // Is the tour currently running?
            tourActive: false,

            // Current tour step index (for cross-page persistence)
            tourStepIndex: 0,

            // Actions
            setPersona: (persona) => set({ persona }),

            startTour: () => set({ tourActive: true, tourStepIndex: 0 }),

            stopTour: () => set({ tourActive: false }),

            completeTour: () => set({ tourActive: false, tourCompleted: true }),

            resetTour: () => set({ tourCompleted: false, tourActive: true, tourStepIndex: 0 }),

            setTourStepIndex: (index) => set({ tourStepIndex: index }),

            // Full reset (for logout or testing)
            resetAll: () => set({ persona: null, tourCompleted: false, tourActive: false, tourStepIndex: 0 }),
        }),
        {
            name: 'persona-storage', // localStorage key
        }
    )
);
