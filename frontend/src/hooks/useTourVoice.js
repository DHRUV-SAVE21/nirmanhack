import { useCallback, useRef } from 'react';
import { useLanguageStore } from '../store/themeStore';

/**
 * Custom hook for text-to-speech during the guided tour.
 * Reuses the same voice-selection logic as usePageIntro
 * but is explicitly controlled via speak/stop functions.
 */
export const useTourVoice = () => {
    const language = useLanguageStore((state) => state.language);
    const utteranceRef = useRef(null);

    const speak = useCallback((text) => {
        if (!text || typeof window === 'undefined' || !window.speechSynthesis) return;

        // Cancel any ongoing speech first
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utteranceRef.current = utterance;

        const doSpeak = () => {
            const voices = window.speechSynthesis.getVoices();
            const preferredLang = language === 'hi' ? 'hi-IN'
                : language === 'mr' ? 'mr-IN'
                    : 'en-IN';

            const voice = voices.find(v => v.lang === preferredLang) ||
                voices.find(v => v.lang.startsWith(preferredLang.split('-')[0]));

            utterance.lang = preferredLang;
            if (voice) utterance.voice = voice;
            utterance.rate = 0.9;
            utterance.pitch = 1;

            window.speechSynthesis.speak(utterance);
        };

        if (window.speechSynthesis.getVoices().length > 0) {
            doSpeak();
        } else {
            window.speechSynthesis.onvoiceschanged = doSpeak;
        }
    }, [language]);

    const stop = useCallback(() => {
        if (typeof window !== 'undefined' && window.speechSynthesis) {
            window.speechSynthesis.cancel();
        }
    }, []);

    return { speak, stop };
};
