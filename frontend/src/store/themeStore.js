import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useThemeStore = create(
    persist(
        (set) => ({
            theme: (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light',
            toggleTheme: () => set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),
        }),
        {
            name: 'theme-storage',
        }
    )
);

import i18n from '../i18n';

export const useLanguageStore = create(
    persist(
        (set) => ({
            language: 'en', // 'en' | 'hi' | 'mr'
            setLanguage: (lang) => {
                i18n.changeLanguage(lang);
                set({ language: lang });
            },
        }),
        {
            name: 'language-storage',
            onRehydrateStorage: () => (state) => {
                if (state && state.language) {
                    i18n.changeLanguage(state.language);
                }
            }
        }
    )
);

export const useVoiceStore = create((set) => ({
    isListening: false,
    transcript: '',
    isProcessing: false,
    feedback: '',
    lastAction: null,
    startListening: () => set({ isListening: true, transcript: '', feedback: '', lastAction: null }),
    stopListening: () => set({ isListening: false }),
    setTranscript: (text) => set({ transcript: text }),
    setIsProcessing: (status) => set({ isProcessing: status }),
    setFeedback: (text) => set({ feedback: text }),
    setLastAction: (action) => set({ lastAction: action }),
    clearAction: () => set({ lastAction: null }),
}));
