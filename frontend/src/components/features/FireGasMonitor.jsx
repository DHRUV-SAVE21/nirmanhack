import React, { useState, useEffect } from 'react';
import { Flame, Wind, AlertTriangle, CheckCircle, Activity } from 'lucide-react';
import { motion } from 'framer-motion';
import { API_BASE_URL } from '../../config/api';

const FireGasMonitor = () => {
    const [fireGasData, setFireGasData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchFireGasData = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/hardware/fire-gas/latest`);

            if (!response.ok) {
                throw new Error('Failed to fetch fire/gas data');
            }

            const result = await response.json();
            // Data is nested inside result.data
            if (result.status === 'success' && result.data) {
                setFireGasData(result.data);
            } else {
                setFireGasData(result);
            }
            setError(null);
        } catch (err) {
            console.error('Error fetching fire/gas data:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFireGasData();
        // Poll every 2 seconds for real-time monitoring
        const interval = setInterval(fetchFireGasData, 2000);
        return () => clearInterval(interval);
    }, []);

    if (loading) {
        return (
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-lg border border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-center h-32">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-lg border border-red-500">
                <div className="flex items-center gap-3 text-red-500">
                    <AlertTriangle className="w-6 h-6" />
                    <div>
                        <h3 className="font-bold">Sensor Offline</h3>
                        <p className="text-sm text-slate-500">{error}</p>
                    </div>
                </div>
            </div>
        );
    }

    const mq2Value = fireGasData?.mq2_value || 0;
    const fireStatus = fireGasData?.fire_status || 'Unknown';

    // Determine gas level status based on new thresholds
    const getGasLevel = (value) => {
        if (value < 600) return { level: 'Safe', color: 'green', icon: CheckCircle };
        if (value < 2000) return { level: 'Moderate', color: 'yellow', icon: Activity };
        return { level: 'Dangerous', color: 'red', icon: AlertTriangle };
    };

    const gasLevel = getGasLevel(mq2Value);
    const GasIcon = gasLevel.icon;

    // Fire status is displayed directly from API

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Fire Detection Card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-lg border-2 border-slate-200 dark:border-slate-700"
            >
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-3 rounded-xl bg-orange-500">
                            <Flame className="w-6 h-6 text-slate-900 dark:text-white" />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                                Fire Detection
                            </h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                Real-time monitoring
                            </p>
                        </div>
                    </div>
                </div>

                <div className="text-center py-4">
                    <div className="text-5xl font-black text-slate-900 dark:text-white mb-3">
                        🔥
                    </div>
                    <div className="text-2xl font-bold text-slate-900 dark:text-white uppercase">
                        {fireStatus}
                    </div>
                    <div className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                        Current Status
                    </div>
                </div>
            </motion.div>

            {/* Gas Detection Card (MQ2) */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className={`rounded-2xl p-6 shadow-lg border-2 bg-${gasLevel.color}-500/10 border-${gasLevel.color}-500`}
            >
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className={`p-3 rounded-xl bg-${gasLevel.color}-500`}>
                            <Wind className="w-6 h-6 text-slate-900 dark:text-white" />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                                Gas Detection (MQ2)
                            </h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                Air quality sensor
                            </p>
                        </div>
                    </div>
                </div>

                <div className="text-center py-4">
                    <div className="text-5xl font-black text-slate-900 dark:text-white">
                        {mq2Value}
                    </div>
                    <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        PPM (Parts Per Million)
                    </div>

                    <div className={`mt-4 flex items-center justify-center gap-2 text-${gasLevel.color}-600`}>
                        <GasIcon className="w-5 h-5" />
                        <span className="font-bold text-lg">{gasLevel.level}</span>
                    </div>
                </div>

                {/* Gas Level Indicator */}
                <div className="mt-4">
                    <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
                        <span>0</span>
                        <span>600</span>
                        <span>2000</span>
                        <span>Max</span>
                    </div>
                    <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                            className={`h-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 transition-all duration-500`}
                            style={{ width: `${Math.min((mq2Value / 3000) * 100, 100)}%` }}
                        />
                    </div>
                </div>

                {/* Warning Messages */}
                {gasLevel.level === 'Dangerous' && (
                    <div className="mt-4 p-3 bg-red-500/20 rounded-lg border border-red-500">
                        <p className="text-sm font-bold text-red-700 dark:text-red-400 text-center">
                            ⚠️ DANGEROUS GAS LEVELS - EVACUATE AREA
                        </p>
                    </div>
                )}
                {gasLevel.level === 'Moderate' && (
                    <div className="mt-4 p-3 bg-yellow-500/20 rounded-lg border border-yellow-500">
                        <p className="text-sm font-bold text-yellow-700 dark:text-yellow-400 text-center">
                            ⚠️ Moderate gas levels - Ventilate area
                        </p>
                    </div>
                )}
            </motion.div>

            {/* Combined Status Summary */}
            <div className="md:col-span-2 bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-lg border border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-orange-500" />
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                Fire: {fireStatus}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full bg-${gasLevel.color}-500`} />
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                Gas: {gasLevel.level} ({mq2Value} PPM)
                            </span>
                        </div>
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                        Last updated: {new Date().toLocaleTimeString()}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FireGasMonitor;
