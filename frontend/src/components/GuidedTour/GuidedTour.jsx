import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Joyride, { STATUS, ACTIONS, EVENTS } from 'react-joyride';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { Bot, Sparkles, Volume2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { usePersonaStore } from '../../store/personaStore';
import { useTourVoice } from '../../hooks/useTourVoice';
import { getTourSteps } from '../../constants/tourConfig';

// ─── Custom Joyride Tooltip ─────────────────────────────────────────
const CustomTooltip = ({
    continuous,
    index,
    step,
    backProps,
    closeProps,
    primaryProps,
    tooltipProps,
    isLastStep,
    size,
}) => {
    const { t } = useTranslation();
    const { speak } = useTourVoice();

    return (
    <motion.div
        {...tooltipProps}
        initial={{ opacity: 0, y: 20, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.95 }}
        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 max-w-sm overflow-hidden"
    >
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-3 flex items-center gap-2">
            <Sparkles size={18} className="text-white" />
            <span className="text-white font-bold text-sm">{step.title}</span>
            <span className="ml-auto flex items-center gap-2 text-white/90 text-xs font-medium border-l border-white/20 pl-3">
                <button 
                    onClick={() => speak(step.content)}
                    className="p-1 hover:bg-white/20 rounded-md transition-colors"
                    title="Play Audio"
                >
                    <Volume2 size={16} />
                </button>
                {index + 1} / {size}
            </span>
        </div>

        {/* Body */}
        <div className="px-5 py-4">
            <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed">
                {step.content}
            </p>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <button
                {...closeProps}
                className="text-xs text-slate-400 hover:text-red-400 transition-colors font-medium"
            >
                {t('skip_tour', 'Skip Tour')}
            </button>
            <div className="flex items-center gap-2">
                {index > 0 && (
                    <button
                        {...backProps}
                        className="px-4 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                        {t('back', 'Back')}
                    </button>
                )}
                <button
                    {...primaryProps}
                    className="px-4 py-1.5 text-xs font-bold rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md hover:shadow-lg transition-all active:scale-95"
                >
                    {isLastStep ? t('finish', '🎉 Finish') : t('next', 'Next →')}
                </button>
            </div>
        </div>
    </motion.div>
    );
};

// ─── Guide Arrival Animation ────────────────────────────────────────
const GuideArrival = ({ onComplete }) => {
    useEffect(() => {
        const timer = setTimeout(onComplete, 2800);
        return () => clearTimeout(timer);
    }, [onComplete]);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9998] flex items-center justify-center pointer-events-none"
        >
            {/* Soft backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/20 dark:bg-black/40 backdrop-blur-sm"
            />

            {/* Guide character + text */}
            <motion.div
                initial={{ y: 80, opacity: 0, scale: 0.8 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: -40, opacity: 0, scale: 0.9 }}
                transition={{ type: 'spring', damping: 15, stiffness: 200, delay: 0.3 }}
                className="relative z-10 flex flex-col items-center gap-4"
            >
                {/* Glow ring */}
                <motion.div
                    animate={{
                        boxShadow: [
                            '0 0 0px rgba(16,185,129,0.3)',
                            '0 0 40px rgba(16,185,129,0.6)',
                            '0 0 0px rgba(16,185,129,0.3)',
                        ],
                    }}
                    transition={{ repeat: 2, duration: 1 }}
                    className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-2xl"
                >
                    <Bot size={48} className="text-white" />
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                    className="text-center"
                >
                    <h2 className="text-2xl font-bold text-white drop-shadow-lg">
                        🙏 Namaste! I'm your Guide
                    </h2>
                    <p className="text-white/80 text-sm mt-1 max-w-xs drop-shadow">
                        Let me walk you through this application step by step
                    </p>
                </motion.div>

                {/* Animated dots */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.5 }}
                    className="flex gap-1.5"
                >
                    {[0, 1, 2].map((i) => (
                        <motion.div
                            key={i}
                            animate={{ y: [0, -8, 0] }}
                            transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.15 }}
                            className="w-2 h-2 rounded-full bg-emerald-400"
                        />
                    ))}
                </motion.div>
            </motion.div>
        </motion.div>
    );
};

// ─── Main Guided Tour Component ─────────────────────────────────────
const GuidedTour = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { t, i18n } = useTranslation();

    const {
        tourActive,
        tourCompleted,
        tourStepIndex,
        stopTour,
        completeTour,
        setTourStepIndex,
    } = usePersonaStore();

    const { speak, stop: stopVoice } = useTourVoice();

    // Show arrival animation before starting Joyride
    const [showArrival, setShowArrival] = useState(false);
    const [joyrideReady, setJoyrideReady] = useState(false);
    const [isNavigating, setIsNavigating] = useState(false); // Controls pausing during route change

    // Get ALL steps translated for an end-to-end website tour
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const allSteps = useMemo(() => {
        return getTourSteps(t);
    }, [t, i18n.language]);

    // When tour becomes active, show the arrival animation first
    useEffect(() => {
        if (tourActive && !joyrideReady && !isNavigating) {
            setShowArrival(true);
        }
    }, [tourActive, joyrideReady, isNavigating]);

    // After arrival completes, start Joyride
    const handleArrivalComplete = useCallback(() => {
        setShowArrival(false);
        setJoyrideReady(true);
    }, []);

    // Reset joyride state when tour stops
    useEffect(() => {
        if (!tourActive) {
            setJoyrideReady(false);
            setIsNavigating(false);
        }
    }, [tourActive]);

    // ─── Cross-Route Navigation Sync ────────────────────────────────
    // Ensure the browser is on the correct page for the current step
    useEffect(() => {
        if (tourActive && joyrideReady && allSteps[tourStepIndex]) {
            const stepPage = allSteps[tourStepIndex].page;
            
            // If the next step is on a different page, pause joyride and navigate
            if (stepPage && location.pathname !== stepPage) {
                setIsNavigating(true); // Pause tour immediately
                navigate(stepPage);
            } 
            // Once we land on the correct page, unpause joyride
            else if (stepPage && location.pathname === stepPage && isNavigating) {
                // Give the DOM a tiny fraction of a second to render the new component structure
                const timer = setTimeout(() => {
                    setIsNavigating(false);
                }, 300);
                return () => clearTimeout(timer);
            }
        }
    }, [tourActive, joyrideReady, tourStepIndex, allSteps, location.pathname, navigate, isNavigating]);

    // ─── Joyride Callback ───────────────────────────────────────────
    const handleJoyrideCallback = useCallback((data) => {
        const { status, action, type, step, index } = data;

        // When user clicks Next or Back interactively
        if (type === EVENTS.STEP_AFTER) {
            // Update the global step index manually (making it fully controlled)
            const newIndex = index + (action === ACTIONS.PREV ? -1 : 1);
            setTourStepIndex(newIndex);
        }

        // When moving to a step BEFORE it renders
        if (type === EVENTS.STEP_BEFORE) {
            // Speak the content of this step
            if (step?.content && !isNavigating) {
                speak(step.content);
            }
        }

        if (type === EVENTS.TARGET_NOT_FOUND) {
            console.warn(`Tour target not found: ${step?.target}. Might still be rendering.`);
        }

        // User clicked "Skip" or "Close"
        if (action === ACTIONS.CLOSE || action === ACTIONS.SKIP) {
            stopVoice();
            stopTour();
            return;
        }

        // Tour ended naturally
        if (status === STATUS.FINISHED) {
            stopVoice();
            completeTour();
            navigate('/dashboard'); // Return to dashboard when done!
            return;
        }

        // Tour was skipped implicitly
        if (status === STATUS.SKIPPED) {
            stopVoice();
            stopTour();
            return;
        }
    }, [speak, stopVoice, stopTour, completeTour, setTourStepIndex, isNavigating, navigate]);

    // Don't render anything if tour is not active
    if (!tourActive) return null;

    return (
        <>
            {/* Arrival Animation */}
            <AnimatePresence>
                {showArrival && (
                    <GuideArrival onComplete={handleArrivalComplete} />
                )}
            </AnimatePresence>

            {/* Joyride Tour */}
            {joyrideReady && allSteps.length > 0 && (
                <Joyride
                    key={i18n.language}
                    steps={allSteps}
                    stepIndex={tourStepIndex} // Controlled component!
                    run={!isNavigating} // PAUSE execution during route transition!
                    continuous={true}
                    showSkipButton={true}
                    showProgress={true}
                    disableOverlayClose={true} // prevent clicking out to close
                    disableScrolling={false}
                    spotlightClicks={false}
                    tooltipComponent={CustomTooltip}
                    callback={handleJoyrideCallback}
                    styles={{
                        options: {
                            zIndex: 10000,
                            arrowColor: 'transparent',
                            overlayColor: 'rgba(0, 0, 0, 0.45)',
                        },
                        spotlight: {
                            borderRadius: '16px',
                        },
                    }}
                    floaterProps={{
                        disableAnimation: true,
                    }}
                    locale={{
                        back: t('back', 'Back'),
                        close: t('close', 'Close'),
                        last: t('finish', 'Finish'),
                        next: t('next', 'Next'),
                        skip: t('skip', 'Skip'),
                    }}
                />
            )}
        </>
    );
};

export default GuidedTour;
