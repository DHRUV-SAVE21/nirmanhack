import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tractor, BarChart3, Sparkles, ArrowRight } from 'lucide-react';
import { usePersonaStore } from '../../store/personaStore';

const personas = [
    {
        id: 'farmer',
        icon: Tractor,
        emoji: '🌾',
        title: 'Farmer',
        subtitle: 'Simple, action-focused experience',
        description: 'Large buttons, clear actions, voice guidance, and local language support designed for day-to-day farm management.',
        gradient: 'from-emerald-500 to-green-600',
        ring: 'ring-emerald-400',
        bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    },
    {
        id: 'industrial',
        icon: BarChart3,
        emoji: '🏭',
        title: 'Industrial / Analyst',
        subtitle: 'Data-rich, analytical experience',
        description: 'Detailed charts, export tools, NDVI heatmaps, and comprehensive dashboards for in-depth farm analytics.',
        gradient: 'from-blue-500 to-indigo-600',
        ring: 'ring-blue-400',
        bg: 'bg-blue-50 dark:bg-blue-900/20',
    },
];

const WelcomePersonaModal = () => {
    const { persona, setPersona, startTour } = usePersonaStore();
    const [selected, setSelected] = useState(null);
    const [closing, setClosing] = useState(false);

    // Don't show if persona is already chosen
    if (persona) return null;

    const handleContinue = () => {
        if (!selected) return;
        setClosing(true);
        setTimeout(() => {
            setPersona(selected);
            startTour(); // Auto-start the guided tour on first visit
        }, 500);
    };

    return (
        <AnimatePresence>
            {!closing && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
                >
                    {/* Backdrop */}
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-900/90 via-slate-900/95 to-black/95 backdrop-blur-md" />

                    {/* Content */}
                    <motion.div
                        initial={{ y: 40, opacity: 0, scale: 0.95 }}
                        animate={{ y: 0, opacity: 1, scale: 1 }}
                        exit={{ y: -20, opacity: 0, scale: 0.95 }}
                        transition={{ type: 'spring', damping: 20, stiffness: 200 }}
                        className="relative z-10 w-full max-w-lg"
                    >
                        {/* Header */}
                        <div className="text-center mb-8">
                            <motion.div
                                initial={{ scale: 0.5, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: 0.2, type: 'spring' }}
                                className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 shadow-lg shadow-emerald-500/30 mb-4"
                            >
                                <Sparkles size={32} className="text-white" />
                            </motion.div>
                            <h1 className="text-3xl font-bold text-white mb-2">
                                Welcome to <span className="text-emerald-400">Annadata</span>Saathi
                            </h1>
                            <p className="text-slate-400 text-sm max-w-sm mx-auto">
                                How will you use this application? We'll customize your experience accordingly.
                            </p>
                        </div>

                        {/* Persona Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                            {personas.map((p, idx) => {
                                const Icon = p.icon;
                                const isSelected = selected === p.id;
                                return (
                                    <motion.button
                                        key={p.id}
                                        initial={{ x: idx === 0 ? -30 : 30, opacity: 0 }}
                                        animate={{ x: 0, opacity: 1 }}
                                        transition={{ delay: 0.3 + idx * 0.1 }}
                                        onClick={() => setSelected(p.id)}
                                        className={`relative text-left p-5 rounded-2xl border-2 transition-all duration-300 group
                                            ${isSelected
                                                ? `border-transparent ring-2 ${p.ring} ${p.bg} shadow-xl`
                                                : 'border-slate-700/60 bg-slate-800/60 hover:border-slate-600 hover:bg-slate-800'
                                            }`}
                                    >
                                        {/* Selected indicator */}
                                        {isSelected && (
                                            <motion.div
                                                layoutId="persona-indicator"
                                                className={`absolute -top-2 -right-2 w-7 h-7 rounded-full bg-gradient-to-r ${p.gradient} flex items-center justify-center shadow-lg`}
                                            >
                                                <span className="text-white text-xs font-bold">✓</span>
                                            </motion.div>
                                        )}

                                        <div className="text-3xl mb-3">{p.emoji}</div>
                                        <h3 className="text-white font-bold text-lg mb-0.5">{p.title}</h3>
                                        <p className={`text-xs font-medium mb-2 ${isSelected ? 'text-emerald-400' : 'text-slate-400'}`}>
                                            {p.subtitle}
                                        </p>
                                        <p className="text-xs text-slate-500 leading-relaxed">
                                            {p.description}
                                        </p>
                                    </motion.button>
                                );
                            })}
                        </div>

                        {/* Continue Button */}
                        <motion.button
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.6 }}
                            onClick={handleContinue}
                            disabled={!selected}
                            className={`w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all duration-300
                                ${selected
                                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40 active:scale-[0.98]'
                                    : 'bg-slate-700/50 text-slate-500 cursor-not-allowed'
                                }`}
                        >
                            Continue <ArrowRight size={16} />
                        </motion.button>

                        <p className="text-center text-slate-600 text-xs mt-4">
                            You can change this anytime from Settings
                        </p>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default WelcomePersonaModal;
