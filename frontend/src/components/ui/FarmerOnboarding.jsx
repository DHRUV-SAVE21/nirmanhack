/**
 * FarmerOnboarding.jsx
 * ─────────────────────────────────────────────────────────────────
 * One-time welcome wizard shown when a new user first visits /dashboard.
 * Collects: role → soil type → field size → name
 * Saved to localStorage as  "farmerOnboardingData"
 * so it never shows again for the same browser session.
 * ─────────────────────────────────────────────────────────────────
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Sprout, Ruler, User, ChevronRight,
    ChevronLeft, CheckCircle, Tractor, X,
    Layers, MapPin, Loader2
} from 'lucide-react';
import { API_BASE_URL } from '../../config/api';

const SOIL_TYPES = [
    { id: 'Alluvial',       label: 'Alluvial',          sub: 'River plains, very fertile',   emoji: '🟤' },
    { id: 'Black Cotton',   label: 'Black Cotton',      sub: 'Cotton belt, Vidarbha, Deccan', emoji: '⬛' },
    { id: 'Black (Regur)',  label: 'Black / Regur',     sub: 'Swells wet, cracks dry',        emoji: '🔲' },
    { id: 'Red',            label: 'Red Soil',          sub: 'Deccan plateau, dry areas',     emoji: '🔴' },
    { id: 'Laterite',       label: 'Laterite',          sub: 'High rainfall, leached',        emoji: '🟥' },
    { id: 'Desert / Arid',  label: 'Desert / Arid',     sub: 'Rajasthan, Gujarat',            emoji: '🟨' },
    { id: 'Loamy',          label: 'Loamy',             sub: 'Best for most crops',           emoji: '🌿' },
    { id: 'Sandy',          label: 'Sandy',             sub: 'Poor nutrient retention',       emoji: '🏜️' },
    { id: 'Clay',           label: 'Clay',              sub: 'High water retention',          emoji: '💧' },
];

const STEP_KEYS = ['role', 'soil', 'size', 'name'];

const variants = {
    enter: (dir) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
    center:       ({ x: 0, opacity: 1 }),
    exit:  (dir) => ({ x: dir > 0 ? -60 : 60, opacity: 0 }),
};

export default function FarmerOnboarding({ onComplete }) {
    const [step,      setStep]      = useState(0);
    const [direction, setDirection] = useState(1);
    const [saving,    setSaving]    = useState(false);
    const [data,      setData]      = useState({
        role:       null,
        soil_type:  '',
        farm_size:  '',
        name:       '',
    });

    const go = (delta) => {
        setDirection(delta);
        setStep(s => s + delta);
    };

    const finish = async () => {
        const profile = {
            name:       data.name.trim(),
            soil_type:  data.soil_type,
            farm_size:  data.farm_size.trim(),
            role:       data.role,
        };
        localStorage.setItem('farmerOnboardingData', JSON.stringify(profile));

        // Save to Supabase via backend
        try {
            setSaving(true);
            const userData = JSON.parse(localStorage.getItem('user') || '{}');
            const userId   = userData.id || 'HARDWARE_DEFAULT';
            await fetch(`${API_BASE_URL}/api/report/farmer-profile`, {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id:      userId,
                    farmer_name:  profile.name || userData.full_name || 'Farmer',
                    farm_size:    profile.farm_size,
                    soil_type:    profile.soil_type,
                    role:         profile.role,
                }),
            });
        } catch (e) {
            console.warn('Profile save warning (non-fatal):', e);
        } finally {
            setSaving(false);
        }

        onComplete(profile);
    };

    // ── Step 0 : Role picker ─────────────────────────────────────
    const StepRole = () => (
        <div className="space-y-5 text-center">
            <div className="flex justify-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-violet-800 flex items-center justify-center shadow-xl">
                    <Sprout size={32} className="text-white" />
                </div>
            </div>
            <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Welcome to Annadata Saathi!</h2>
                <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
                    Before we begin, tell us a little about yourself.
                </p>
            </div>

            <p className="font-semibold text-slate-700 dark:text-slate-200 text-base">Are you a farmer?</p>

            <div className="grid grid-cols-2 gap-3">
                {[
                    { id: 'farmer',    icon: Tractor,  label: 'Yes, I am a Farmer',  sub: 'Get full farm analytics', color: 'violet' },
                    { id: 'visitor',   icon: User,     label: 'No, I am a Visitor',  sub: 'Browse in view mode',    color: 'slate'  },
                ].map(({ id, icon: Icon, label, sub, color }) => (
                    <button
                        key={id}
                        onClick={() => {
                            setData(d => ({ ...d, role: id }));
                            // If visitor, finish immediately with default profile
                            if (id === 'visitor') {
                                const profile = { role: 'visitor', name: '', soil_type: '', farm_size: '' };
                                localStorage.setItem('farmerOnboardingData', JSON.stringify(profile));
                                onComplete(profile);
                            } else {
                                go(1);
                            }
                        }}
                        className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer
                            ${data.role === id
                                ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20'
                                : 'border-slate-200 dark:border-slate-700 hover:border-violet-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                            }`}
                    >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center
                            ${color === 'violet'
                                ? 'bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400'
                                : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                            }`}>
                            <Icon size={22} />
                        </div>
                        <div>
                            <p className="font-semibold text-sm text-slate-800 dark:text-white leading-tight">{label}</p>
                            <p className="text-xs text-slate-400 mt-0.5">{sub}</p>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );

    // ── Step 1 : Soil Type ───────────────────────────────────────
    const StepSoil = () => (
        <div className="space-y-4">
            <div className="flex justify-center">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg">
                    <Layers size={28} className="text-white" />
                </div>
            </div>
            <div className="text-center">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">What is your soil type?</h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Select the type that best describes your field.</p>
            </div>

            <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1 no-scrollbar">
                {SOIL_TYPES.map(soil => (
                    <button
                        key={soil.id}
                        onClick={() => setData(d => ({ ...d, soil_type: soil.id }))}
                        className={`flex items-center gap-2.5 p-3 rounded-xl border-2 text-left transition-all duration-150
                            ${data.soil_type === soil.id
                                ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20'
                                : 'border-slate-200 dark:border-slate-700 hover:border-violet-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                            }`}
                    >
                        <span className="text-xl">{soil.emoji}</span>
                        <div>
                            <p className="font-semibold text-xs text-slate-800 dark:text-white leading-tight">{soil.label}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">{soil.sub}</p>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );

    // ── Step 2 : Field Size ──────────────────────────────────────
    const StepSize = () => (
        <div className="space-y-5">
            <div className="flex justify-center">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
                    <Ruler size={28} className="text-white" />
                </div>
            </div>
            <div className="text-center">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">How big is your farm?</h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Enter your total field size in acres.</p>
            </div>

            <div className="space-y-3">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Field Size (Acres)
                </label>
                <input
                    type="number"
                    min="0.1"
                    step="0.1"
                    placeholder="e.g.  2.5"
                    value={data.farm_size}
                    onChange={e => setData(d => ({ ...d, farm_size: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-lg font-semibold text-center focus:outline-none focus:border-violet-500 transition placeholder:text-slate-300 dark:placeholder:text-slate-600"
                    autoFocus
                />

                {/* Quick selectors */}
                <div className="grid grid-cols-4 gap-2">
                    {['0.5', '1', '2', '5'].map(v => (
                        <button
                            key={v}
                            onClick={() => setData(d => ({ ...d, farm_size: v }))}
                            className={`py-2 rounded-lg text-sm font-semibold border-2 transition
                                ${data.farm_size === v
                                    ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300'
                                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-violet-300'
                                }`}
                        >
                            {v} ac
                        </button>
                    ))}
                </div>
            </div>

            {/* GPS hint */}
            <div className="flex items-start gap-2 p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800">
                <MapPin size={16} className="text-blue-500 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-blue-700 dark:text-blue-300">
                    You can also enter your GPS coordinates when generating a report for more precise location data.
                </p>
            </div>
        </div>
    );

    // ── Step 3 : Name ────────────────────────────────────────────
    const StepName = () => (
        <div className="space-y-5">
            <div className="flex justify-center">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center shadow-lg">
                    <User size={28} className="text-white" />
                </div>
            </div>
            <div className="text-center">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">What should we call you?</h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Your name will appear on your soil health report.</p>
            </div>

            <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Full Name</label>
                <input
                    type="text"
                    placeholder="e.g.  Ramesh Patil"
                    value={data.name}
                    onChange={e => setData(d => ({ ...d, name: e.target.value }))}
                    onKeyDown={e => e.key === 'Enter' && data.name.trim() && finish()}
                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-base font-semibold focus:outline-none focus:border-violet-500 transition placeholder:text-slate-300 dark:placeholder:text-slate-600"
                    autoFocus
                />
            </div>

            {/* Summary card */}
            {data.soil_type && data.farm_size && (
                <div className="p-4 rounded-xl bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20 border border-violet-100 dark:border-violet-800 space-y-2">
                    <p className="text-xs font-bold text-violet-700 dark:text-violet-300 uppercase tracking-wider">Your Farm Profile</p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                            <p className="text-slate-400 text-xs">Soil Type</p>
                            <p className="font-semibold text-slate-800 dark:text-white">{data.soil_type}</p>
                        </div>
                        <div>
                            <p className="text-slate-400 text-xs">Farm Size</p>
                            <p className="font-semibold text-slate-800 dark:text-white">{data.farm_size} Acres</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );

    const steps  = [StepRole, StepSoil, StepSize, StepName];
    const StepComponent = steps[step];

    // ── Nav logic ────────────────────────────────────────────────
    const canNext = () => {
        if (step === 0) return !!data.role;
        if (step === 1) return !!data.soil_type;
        if (step === 2) return !!data.farm_size && parseFloat(data.farm_size) > 0;
        if (step === 3) return !!data.name.trim();
        return false;
    };

    const isLast = step === STEP_KEYS.length - 1;

    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
                initial={{ opacity: 0, scale: 0.88, y: 32 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden"
            >
                {/* Progress bar */}
                <div className="h-1.5 bg-slate-100 dark:bg-slate-800">
                    <motion.div
                        className="h-full bg-gradient-to-r from-violet-500 to-purple-500 rounded-full"
                        initial={{ width: '0%' }}
                        animate={{ width: `${((step) / (STEP_KEYS.length - 1)) * 100}%` }}
                        transition={{ duration: 0.4, ease: 'easeOut' }}
                    />
                </div>

                {/* Step dots */}
                <div className="flex justify-center gap-2 pt-4">
                    {STEP_KEYS.map((_, i) => (
                        <div
                            key={i}
                            className={`h-1.5 rounded-full transition-all duration-300 ${
                                i < step  ? 'w-6 bg-violet-500' :
                                i === step ? 'w-8 bg-violet-600' :
                                'w-2 bg-slate-200 dark:bg-slate-700'
                            }`}
                        />
                    ))}
                </div>

                {/* Step content with slide animation */}
                <div className="px-6 pt-5 pb-2 min-h-[340px] relative overflow-hidden">
                    <AnimatePresence custom={direction} mode="wait">
                        <motion.div
                            key={step}
                            custom={direction}
                            variants={variants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{ duration: 0.25, ease: 'easeInOut' }}
                        >
                            <StepComponent />
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Navigation */}
                <div className="px-6 pb-6 pt-3 flex items-center gap-3">
                    {step > 0 && (
                        <button
                            onClick={() => go(-1)}
                            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 border-2 border-slate-200 dark:border-slate-700 hover:border-violet-300 hover:text-violet-600 dark:hover:text-violet-400 transition"
                        >
                            <ChevronLeft size={16} /> Back
                        </button>
                    )}

                    {/* Skip - only shown on non-role steps */}
                    {step > 0 && step < STEP_KEYS.length - 1 && (
                        <button
                            onClick={() => go(1)}
                            className="text-sm text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition px-2"
                        >
                            Skip
                        </button>
                    )}

                    <button
                        onClick={() => {
                            if (isLast) finish();
                            else go(1);
                        }}
                        disabled={!canNext()}
                        className="ml-auto flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white
                            bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700
                            disabled:opacity-40 disabled:cursor-not-allowed
                            shadow-lg shadow-violet-500/30 transition-all active:scale-95"
                    >
                        {isLast ? (
                            <>{saving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />} {saving ? 'Saving...' : 'All Done!'}</>
                        ) : (
                            <>Next <ChevronRight size={16} /></>
                        )}
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
