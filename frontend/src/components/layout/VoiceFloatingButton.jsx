import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { Mic, MicOff, Loader2, Sparkles, X, Volume2 } from 'lucide-react';
import { useVoiceStore, useLanguageStore } from '../../store/themeStore';
import { processVoiceLocally } from '../../utils/localVoiceProcessor';
import { speakText } from '../../utils/voiceUtils';

// A simple local debounce memory to avoid double-executing the same command in real time
const executionMemory = {
    lastExecutedTime: 0,
    lastCommandStr: '',
};

const VoiceFloatingButton = () => {
    const { t } = useTranslation();
    const {
        isListening,
        startListening,
        stopListening,
        transcript,
        setTranscript,
        isProcessing,
        setIsProcessing,
        feedback,
        setFeedback,
        setLastAction
    } = useVoiceStore();

    const { language } = useLanguageStore();
    const navigate = useNavigate();
    const location = useLocation();
    const recognitionRef = useRef(null);
    const silenceTimerRef = useRef(null);

    const executeAction = (action) => {
        if (!action) return;

        try {
            if (action.type === 'fill') {
                const s = action.selector;
                let element = document.querySelector(s) ||
                    document.querySelector(`input[name*="${s}" i]`) ||
                    document.querySelector(`input[id*="${s}" i]`) ||
                    document.querySelector(`input[placeholder*="${s}" i]`);

                if (!element) {
                    const labels = Array.from(document.querySelectorAll('label'));
                    const targetLabel = labels.find(l =>
                        l.innerText?.toLowerCase().includes(s.toLowerCase())
                    );

                    if (targetLabel) {
                        if (targetLabel.htmlFor) {
                            element = document.getElementById(targetLabel.htmlFor);
                        } else {
                            element = targetLabel.querySelector('input, select, textarea');
                        }
                    }
                }

                if (element) {
                    element.focus();
                    element.value = action.value;
                    element.dispatchEvent(new Event('input', { bubbles: true }));
                    element.dispatchEvent(new Event('change', { bubbles: true }));
                    element.blur();
                }
            } else if (action.type === 'multi') {
                action.actions.forEach(act => executeAction(act));
            } else if (action.type === 'click') {
                if (action.selector === 'refresh') {
                    window.location.reload();
                    return;
                }

                let target = document.querySelector(action.selector);

                if (!target) {
                    const interactives = Array.from(document.querySelectorAll('button, a, input[type="button"], [role="button"], label'));
                    target = interactives.find(el => {
                        const text = el.innerText?.toLowerCase().trim();
                        const search = action.selector.toLowerCase().trim();
                        return text && (text.includes(search) || search.includes(text));
                    });
                }

                if (target) {
                    target.click();
                }
            } else if (action.type === 'chat') {
                const chatInput = document.querySelector('input[placeholder*="Ask about subsidies"]') ||
                    document.querySelector('input[placeholder*="Ask me anything"]');
                if (chatInput) {
                    chatInput.value = action.query;
                    chatInput.dispatchEvent(new Event('input', { bubbles: true }));
                    chatInput.dispatchEvent(new Event('change', { bubbles: true }));

                    const sendBtn = chatInput.parentElement.querySelector('button');
                    if (sendBtn) sendBtn.click();
                }
            } else if (action.type === 'scroll') {
                window.scrollBy({ top: action.value === 'down' ? 500 : -500, behavior: 'smooth' });
            }
        } catch (err) {
            console.error("Action execution failed", err);
        }
    };

    useEffect(() => {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false;
            recognitionRef.current.interimResults = true;
            recognitionRef.current.lang = language === 'hi' ? 'hi-IN' : (language === 'mr' ? 'mr-IN' : 'en-IN');

            recognitionRef.current.onresult = (event) => {
                let currentTranscript = '';
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    currentTranscript += event.results[i][0].transcript;
                }
                setTranscript(currentTranscript);
                setFeedback(''); // Clear feedback so transcript is visible clearly
                
                // --- Real-time Instantaneous Processing ---
                if (currentTranscript && currentTranscript.trim().length > 0) {
                    const cleanTranscript = currentTranscript.trim().toLowerCase();
                    const now = Date.now();
                    
                    // Prevent executing the exact same command within 3 seconds 
                    if (now - executionMemory.lastExecutedTime > 3000 || executionMemory.lastCommandStr !== cleanTranscript) {
                        const isInterim = true;
                        const result = processVoiceLocally(currentTranscript, location.pathname, isInterim);
                        
                        if (result && !result.isFallback) {
                            executionMemory.lastExecutedTime = now;
                            executionMemory.lastCommandStr = cleanTranscript;
                            
                            const cleanFeedback = result.feedback.replace(/\*\*/g, '');
                            setFeedback(cleanFeedback);
                            speakText(cleanFeedback, language);
                            
                            if (result.targetPath) {
                                navigate(result.targetPath);
                                setTimeout(() => setFeedback(''), 3000);
                            } else if (result.action) {
                                setLastAction(result.action);
                                executeAction(result.action);
                                setTimeout(() => setFeedback(''), 3000);
                            }
                            
                            // Immediately stop and restart to flush the current phrase
                            recognitionRef.current.stop();
                            return;
                        }
                    }
                }
            };

            recognitionRef.current.onerror = (event) => {
                console.error("Speech recognition error", event.error);
                setFeedback(t('voice_error'));
                stopListening();
                setIsProcessing(false);
            };

            recognitionRef.current.onend = async () => {
                if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
                const finalTranscript = useVoiceStore.getState().transcript;

                if (finalTranscript && finalTranscript.trim().length > 0) {
                    const cleanTranscript = finalTranscript.trim().toLowerCase();
                    const now = Date.now();
                    
                    // If we haven't executed this recently via the real-time hook
                    if (now - executionMemory.lastExecutedTime > 3000 || executionMemory.lastCommandStr !== cleanTranscript) {
                        setIsProcessing(true);

                        const result = processVoiceLocally(finalTranscript, location.pathname, false);
                        const cleanFeedback = result.feedback.replace(/\*\*/g, '');
                        setFeedback(cleanFeedback);
                        
                        // High-quality Voice Feedback
                        speakText(cleanFeedback, language);

                        executionMemory.lastExecutedTime = now;
                        executionMemory.lastCommandStr = cleanTranscript;

                        if (result.targetPath) {
                            navigate(result.targetPath);
                            setIsProcessing(false);
                            setTimeout(() => setFeedback(''), 3000);
                        } else if (result.action) {
                            setLastAction(result.action);
                            executeAction(result.action);
                            setIsProcessing(false);
                            setTimeout(() => setFeedback(''), 3000);
                        } else {
                            setIsProcessing(false);
                            setTimeout(() => setFeedback(''), 3000);
                        }
                        
                        // Since it's not a true 'continuous' loop in SpeechRecognition to avoid mic locks,
                        // we stop listening fully after onend.
                        stopListening();
                    } else {
                        // Already handled by real-time hook
                        stopListening();
                        setIsProcessing(false);
                    }
                } else {
                    stopListening();
                    setFeedback("");
                }
            };
        } else {
            setFeedback(t('voice_not_supported'));
        }

        return () => {
            if (recognitionRef.current) recognitionRef.current.stop();
        };
    }, [language, navigate, location.pathname, setFeedback, setIsProcessing, setTranscript, stopListening, setLastAction]);


    const handleToggle = () => {
        if (isListening) {
            recognitionRef.current?.stop();
            stopListening();
        } else {
            setTranscript('');
            setFeedback(t('voice_listening') + '...');
            startListening();
            recognitionRef.current?.start();
        }
    };

    // Hide on Auth pages
    if (location.pathname === '/auth' || location.pathname === '/auth-face') {
        return null;
    }

    return (
        <div data-tour="voice-assistant" className="fixed bottom-24 right-6 z-50 flex flex-col items-end gap-3">
            {/* Feedback Panel */}
            <AnimatePresence>
                {(isListening || isProcessing || feedback) && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.9 }}
                        className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl p-4 max-w-xs"
                    >
                        {/* Close Button */}
                        <button
                            onClick={() => { setFeedback(''); stopListening(); }}
                            className="absolute top-2 right-2 p-1 text-slate-600 dark:text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                        >
                            <X size={14} />
                        </button>

                        {/* Status Header */}
                        <div className="flex items-center gap-2 mb-2">
                            <div className={`w-2 h-2 rounded-full ${isProcessing ? 'bg-amber-500 animate-pulse' : isListening ? 'bg-green-500 animate-pulse' : 'bg-organic-green'}`} />
                            <span className="text-xs uppercase tracking-wider font-bold text-organic-green">
                                {isProcessing ? t('ai_processing') : isListening ? t('voice_listening') : t('voice_assistant')}
                            </span>
                            {isProcessing && <Loader2 className="animate-spin w-3 h-3 text-organic-green" />}
                        </div>

                        {/* Transcript / Feedback */}
                        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed pr-4">
                            {feedback || transcript || "..."}
                        </p>

                        {/* Speak Button */}
                        {feedback && !isListening && !isProcessing && (
                            <button
                                onClick={() => speakText(feedback, language)}
                                className="mt-3 flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-organic-green transition-colors"
                            >
                                <Volume2 size={14} /> Listen Again
                            </button>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Voice Button */}
            <div className="relative">
                {/* Pulse Ring Effect for High Impact Visuals */}
                <AnimatePresence>
                    {isListening && (
                        <>
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: [0.6, 0.1, 0.6], scale: [1, 1.8, 1] }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                                className="absolute inset-0 bg-gradient-to-br from-green-400 to-green-600 rounded-full blur-sm"
                            />
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: [0.3, 0], scale: [1, 2.5] }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 1.2, repeat: Infinity, ease: "easeOut", delay: 0.3 }}
                                className="absolute inset-0 bg-organic-green border border-organic-green-300 rounded-full"
                            />
                            {/* Audio Frequency Bars (Fake Mock) */}
                            <motion.div 
                                className="absolute -top-12 left-1/2 -translate-x-1/2 flex items-end gap-1 px-4 py-2 bg-slate-900/80 backdrop-blur rounded-full pointer-events-none"
                            >
                                {[...Array(5)].map((_, i) => (
                                    <motion.div
                                        key={i}
                                        animate={{ height: ["4px", `${Math.random() * 16 + 8}px`, "4px"] }}
                                        transition={{ duration: 0.5 + Math.random() * 0.5, repeat: Infinity, ease: "easeInOut" }}
                                        className="w-1.5 bg-green-400 rounded-full"
                                    />
                                ))}
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>

                {/* Main Button */}
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleToggle}
                    disabled={isProcessing}
                    className={`relative w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 z-10 
                        ${isListening
                            ? 'bg-gradient-to-br from-organic-green-500 to-organic-green-600 text-white shadow-green-glow border-2 border-organic-green-300'
                            : isProcessing
                                ? 'bg-gradient-to-br from-slate-700 to-slate-800 text-organic-green border-2 border-organic-green cursor-wait'
                                : 'bg-gradient-to-br from-organic-green-600 to-organic-green-700 text-white border-2 border-organic-green-400 hover:shadow-green-glow'
                        }`}
                >
                    {isProcessing ? (
                        <div className="relative">
                            <Sparkles className="animate-pulse" size={24} />
                            <motion.div 
                                className="absolute inset-0 rounded-full border-t-2 border-white"
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            />
                        </div>
                    ) : isListening ? (
                        <motion.div
                            animate={{ scale: [1, 1.2, 1], rotate: [0, -5, 5, 0] }}
                            transition={{ duration: 0.8, repeat: Infinity }}
                            className="relative"
                        >
                            <Mic size={26} className="text-white drop-shadow-md" />
                        </motion.div>
                    ) : (
                        <Mic size={24} className="group-hover:scale-110 transition-transform" />
                    )}
                </motion.button>

                {/* Tooltip */}
                {!isListening && !isProcessing && !feedback && (
                    <motion.div
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-white dark:bg-slate-900 dark:bg-slate-700 text-slate-900 dark:text-white text-xs font-medium px-3 py-1.5 rounded-lg whitespace-nowrap shadow-lg"
                    >
                        Voice Assistant
                        <div className="absolute top-1/2 -translate-y-1/2 -right-1 w-2 h-2 bg-white dark:bg-slate-900 dark:bg-slate-700 rotate-45" />
                    </motion.div>
                )}
            </div>
        </div>
    );
};

export default VoiceFloatingButton;
