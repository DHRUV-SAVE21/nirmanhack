import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Flame, ShieldCheck } from 'lucide-react';
import { API_BASE_URL } from '../../config/api';

const FireDetectionCard = () => {
    const [fireData, setFireData] = useState({
        status: 'No Fire',
        last_updated: null,
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isError, setIsError] = useState(false);

    const fetchFireStatus = useCallback(async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/hardware/fire-gas/latest`);
            const result = await res.json();

            if (result.status === 'success' && result.data) {
                setFireData({
                    status: result.data.fire_status || 'Unknown',
                    last_updated: result.data.last_updated,
                });
                setIsError(false);
            } else {
                setIsError(true);
            }
        } catch (err) {
            console.error('Error fetching fire status:', err);
            setIsError(true);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchFireStatus();
        const interval = setInterval(fetchFireStatus, 5000);
        return () => clearInterval(interval);
    }, [fetchFireStatus]);

    // Display fire status directly from API
    const statusLower = (fireData.status || '').toLowerCase();
    const isFireDetected = statusLower !== 'safe' && statusLower !== 'no fire' && statusLower !== 'unknown';

    // Theme Configuration
    const theme = isFireDetected ? {
        container: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 shadow-xl shadow-red-500/20',
        header: 'bg-red-100/50 dark:bg-red-900/30 border-red-200 dark:border-red-800',
        accent: 'text-red-700 dark:text-red-400',
        badge: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 animate-pulse',
        ring: 'border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 bg-white/50 dark:bg-black/20',
        icon: <Flame className="w-16 h-16 text-red-600 dark:text-red-400 animate-bounce" />,
        label: 'DANGER',
        subtext: 'Auto-Emergency Response Active'
    } : {
        container: 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800',
        header: 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-700',
        accent: 'text-emerald-600 dark:text-emerald-400',
        badge: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300',
        ring: 'border-emerald-100 dark:border-emerald-900/30 text-emerald-600 dark:text-emerald-400 bg-white/50 dark:bg-black/20',
        icon: <ShieldCheck className="w-16 h-16 text-emerald-600 dark:text-emerald-400" />,
        label: 'SAFE',
        subtext: 'Monitoring Active'
    };

    return (
        <div className={`gov-card-elevated h-full flex flex-col relative overflow-hidden transition-all duration-500 border-l-8 ${theme.container}`}>

            {/* Header */}
            <div className={`px-5 py-4 border-b flex justify-between items-center transition-colors duration-500 ${theme.header}`}>
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${theme.badge}`}>
                        <Flame size={18} />
                    </div>
                    <div>
                        <h3 className={`text-sm font-bold transition-colors ${theme.accent}`}>Fire Safety</h3>
                        <p className="text-xs opacity-70">Real-time Check</p>
                    </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider transition-colors ${theme.badge}`}>
                    {theme.label}
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 p-6 flex flex-col items-center justify-center relative">

                {isFireDetected && (
                    <div className="absolute inset-0 bg-red-500/5 dark:bg-red-500/10 animate-pulse pointer-events-none" />
                )}

                {isLoading ? (
                    <div className="text-center">
                        <div className="w-16 h-16 border-4 border-slate-300 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-sm text-slate-600 dark:text-slate-400">Connecting to sensor...</p>
                    </div>
                ) : isError ? (
                    <div className="text-center">
                        <div className="w-40 h-40 rounded-full border-[6px] border-slate-300 dark:border-slate-700 flex items-center justify-center backdrop-blur-sm mb-6">
                            <span className="text-6xl">⚠️</span>
                        </div>
                        <h2 className="text-xl font-bold text-slate-600 dark:text-slate-400 mb-1">Sensor Offline</h2>
                        <p className="text-xs text-slate-500">Check hardware connection</p>
                    </div>
                ) : (
                    <>
                        <div className="relative mb-6 z-10">
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                key={isFireDetected ? 'fire' : 'safe'}
                                className={`w-40 h-40 rounded-full border-[6px] flex items-center justify-center backdrop-blur-sm transition-colors duration-500 ${theme.ring}`}
                            >
                                {theme.icon}
                            </motion.div>
                        </div>

                        <h2 className={`text-2xl font-black mb-1 transition-colors ${theme.accent} text-center relative z-10 tracking-tight uppercase`}>
                            {fireData.status}
                        </h2>
                        <div className="text-xs font-bold opacity-60 uppercase tracking-widest text-center relative z-10">
                            {theme.subtext}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default FireDetectionCard;
