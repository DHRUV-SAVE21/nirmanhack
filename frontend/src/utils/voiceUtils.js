const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

/**
 * Enhanced Text-to-Speech that prioritizes high-quality Sarvam AI 
 * and falls back to standard browser speech synthesis.
 */
export const speakText = async (text, language = 'hi') => {
    if (!text) return;

    const langCodeMap = {
        'hi': 'hi-IN',
        'mr': 'mr-IN',
        'en': 'en-IN'
    };
    
    const targetLang = langCodeMap[language] || 'hi-IN';

    try {
        // 1. Try high-quality backend voice (Sarvam AI)
        const response = await fetch(`${API_BASE_URL}/api/voice/speak`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text, language: targetLang })
        });

        const data = await response.json();
        
        if (data.success && data.audio) {
            // Play the base64 audio
            const audio = new Audio(`data:audio/wav;base64,${data.audio}`);
            audio.play().catch(e => console.warn("Audio play failed, falling back", e));
            return;
        }
    } catch (err) {
        console.warn("Sarvam AI voice failed, using browser fallback", err);
    }

    // 2. Browser Fallback
    if ('speechSynthesis' in window) {
        // Cancel any existing speech
        window.speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = targetLang;
        
        // Find best voice match
        const voices = window.speechSynthesis.getVoices();
        const preferredVoice = voices.find(v => v.lang.includes(language));
        if (preferredVoice) utterance.voice = preferredVoice;
        
        window.speechSynthesis.speak(utterance);
    }
};
