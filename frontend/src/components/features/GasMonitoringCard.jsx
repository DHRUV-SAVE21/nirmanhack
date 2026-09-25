import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wind, AlertTriangle, ShieldCheck, PhoneCall, Activity, RefreshCw } from 'lucide-react';
import { API_BASE_URL } from '../../config/api';

// Thresholds - Updated for MQ2 sensor
const GAS_SAFE_MAX = 600;
const GAS_MODERATE_MAX = 2000;

const classifyGas = (ppm) => {
    if (ppm < GAS_SAFE_MAX) return 'safe';
    if (ppm <= GAS_MODERATE_MAX) return 'moderate';
    return 'dangerous';
};

const GasMonitoringCard = () => {
    const [gasData, setGasData] = useState({
        level: 0,
        status: 'safe',
        unit: 'ppm',
        last_updated: null,
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isError, setIsError] = useState(false);

    const fetchGasStatus = useCallback(async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/hardware/fire-gas/latest`);
            const result = await res.json();

            if (result.status === 'success' && result.data) {
                const mq2Value = result.data.mq2_value || 0;
                const classification = classifyGas(mq2Value);

                setGasData({
                    level: mq2Value,
                    status: classification,
                    unit: 'ppm',
                    last_updated: result.data.last_updated,
                });
                setIsError(false);
            } else {
                setIsError(true);
            }
        } catch (err) {
            console.error('Error fetching gas status:', err);
            setIsError(true);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchGasStatus();
        const interval = setInterval(fetchGasStatus, 5000);
        return () => clearInterval(interval);
    }, [fetchGasStatus]);

    const status = gasData.status || 'safe';
    const level = gasData.level || 0;

    // Theme Configuration - Full Card
    const theme = {
        safe: {
            container: 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800',
            header: 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-700',
            accent: 'text-emerald-600 dark:text-emerald-400',
            badge: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300',
            ring: 'border-emerald-100 dark:border-emerald-900/30 text-emerald-600 dark:text-emerald-400',
            icon: <ShieldCheck className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />,
            label: 'Safe',
            desc: 'Gas Content'
        },
        moderate: {
            container: 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800 shadow-lg shadow-amber-500/10',
            header: 'bg-amber-100/50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800',
            accent: 'text-amber-700 dark:text-amber-400',
            badge: 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300',
            ring: 'border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400',
            icon: <AlertTriangle className="w-10 h-10 text-amber-600 dark:text-amber-400" />,
            label: 'Moderate',
            desc: 'Ventilation Needed'
        },
        dangerous: {
            container: 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800 shadow-xl shadow-red-500/20',
            header: 'bg-red-100/50 dark:bg-red-900/30 border-red-200 dark:border-red-800',
            accent: 'text-red-700 dark:text-red-400',
            badge: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 animate-pulse',
            ring: 'border-red-200 dark:border-red-800 text-red-700 dark:text-red-400',
            icon: <Activity className="w-10 h-10 text-red-600 dark:text-red-400 animate-pulse" />,
            label: 'Dangerous',
            desc: 'Evacuate Now!'
        }
    };

    const currentTheme = theme[status] || theme.safe;

    return (
        <div className={`gov-card-elevated h-full flex flex-col relative overflow-hidden transition-all duration-500 border-2 ${currentTheme.container}`}>
            {/* Header */}
            <div className={`px-5 py-4 border-b flex justify-between items-center transition-colors duration-500 ${currentTheme.header}`}>
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${currentTheme.badge}`}>
                        <Wind size={18} />
                    </div>
                    <div>
                        <h3 className={`text-sm font-bold transition-colors ${currentTheme.accent}`}>Gas Monitor</h3>
                        <p className="text-xs opacity-70">Real-time Sensor</p>
                    </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider transition-colors ${currentTheme.badge}`}>
                    {currentTheme.label}
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 p-6 flex flex-col items-center justify-center relative">

                {isLoading ? (
                    <div className="text-center">
                        <div className="w-16 h-16 border-4 border-slate-300 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-sm text-slate-600 dark:text-slate-400">Connecting to sensor...</p>
                    </div>
                ) : isError ? (
                    <div className="text-center">
                        <div className="w-36 h-36 rounded-full border-[6px] border-slate-300 dark:border-slate-700 flex items-center justify-center backdrop-blur-sm mb-4">
                            <span className="text-6xl">⚠️</span>
                        </div>
                        <h2 className="text-xl font-bold text-slate-600 dark:text-slate-400 mb-1">Sensor Offline</h2>
                        <p className="text-xs text-slate-500">Check hardware connection</p>
                    </div>
                ) : (
                    <>
                        <div className="relative mb-6">
                            {/* Status Ring */}
                            <div className={`w-36 h-36 rounded-full border-[6px] flex items-center justify-center bg-white/50 dark:bg-black/20 backdrop-blur-sm transition-colors duration-500 ${currentTheme.ring}`}>
                                <div className="text-center">
                                    <span className="text-5xl font-black tracking-tighter block">
                                        {Math.round(level)}
                                    </span>
                                    <span className="text-xs font-bold opacity-60 uppercase mt-1 block">
                                        ppm
                                    </span>
                                </div>
                            </div>
                            {/* Icon Badge */}
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                key={status}
                                className="absolute -bottom-3 -right-3 p-3 rounded-full bg-white dark:bg-slate-800 shadow-lg border border-slate-100 dark:border-slate-700"
                            >
                                {currentTheme.icon}
                            </motion.div>
                        </div>

                        <h2 className={`text-2xl font-bold mb-1 transition-colors ${currentTheme.accent} text-center`}>
                            {currentTheme.desc}
                        </h2>
                        <div className="text-xs font-medium opacity-60 text-center">
                            Threshold: {status === 'safe' ? '< 600' : status === 'moderate' ? '600-2000' : '> 2000'} ppm
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default GasMonitoringCard;
