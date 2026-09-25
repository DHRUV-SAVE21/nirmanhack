import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useLanguageStore } from '../store/themeStore';
import { pageIntros } from '../constants/pageIntros';

export const usePageIntro = () => {
    const location = useLocation();
    const language = useLanguageStore((state) => state.language);
    const hasSpokenRef = useRef(false);
    const lastPathRef = useRef(null);

    useEffect(() => {
        // Prevent re-speaking if nothing changed (though location object changes on nav)
        if (lastPathRef.current === location.pathname + language) {
            return;
        }

        const speakIntro = () => {
            // Cancel any ongoing speech
            window.speechSynthesis.cancel();

            // Find the intro text
            // Helper to find partial matches for dynamic routes (like /trust-report/:batchId)
            let introText = '';

            // 1. Exact match
            if (pageIntros[location.pathname]) {
                introText = pageIntros[location.pathname][language] || pageIntros[location.pathname]['en'];
            }
            // 2. Dynamic route match (starts with) - simple approach
            else {
                const matchedKey = Object.keys(pageIntros).find(key =>
                    key !== '/' && location.pathname.startsWith(key)
                );

                if (matchedKey) {
                    introText = pageIntros[matchedKey][language] || pageIntros[matchedKey]['en'];
                } else {
                    // Default fallback
                    introText = pageIntros.default[language] || pageIntros.default['en'];
                }
            }

            if (!introText) return;

            const utterance = new SpeechSynthesisUtterance(introText);

            // Set voice properties based on language
            // Note: Voice selection is tricky as it depends on OS/Browser available voices.
            // We just attempt to set the lang property which usually helps the browser pick a voice.
            // Ensure voices are loaded before speaking
            const speak = () => {
                const voices = window.speechSynthesis.getVoices();
                const preferredLang = language === 'hi' ? 'hi-IN' : (language === 'mr' ? 'mr-IN' : 'en-IN');

                // Try to find an exact voice match
                const voice = voices.find(v => v.lang === preferredLang) ||
                    voices.find(v => v.lang.startsWith(preferredLang.split('-')[0])); // Fallback to 'mr' if 'mr-IN' not found

                utterance.lang = preferredLang;
                if (voice) {
                    utterance.voice = voice;
                }

                utterance.rate = 0.9;
                utterance.pitch = 1;
                window.speechSynthesis.speak(utterance);
            };

            if (window.speechSynthesis.getVoices().length > 0) {
                speak();
            } else {
                window.speechSynthesis.onvoiceschanged = speak;
            }
        };

        // Small timeout to allow page transition to settle
        const timer = setTimeout(() => {
            speakIntro();
            lastPathRef.current = location.pathname + language;
        }, 500);

        return () => {
            clearTimeout(timer);
            window.speechSynthesis.cancel();
        };
    }, [location.pathname, language]);

    return null; // This hook doesn't render anything
};
