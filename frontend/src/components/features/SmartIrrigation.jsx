import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getApiUrl } from '../../config/api';
import { motion } from 'framer-motion';
import { Droplets, Power, Thermometer, Clock, Gauge } from 'lucide-react';

const SmartIrrigation = ({ sensorData }) => {
    const { t } = useTranslation();
    const [activePumps, setActivePumps] = useState({ p1: false, p2: false, p3: false });
    const [latestHash, setLatestHash] = useState(null);
    const [showQr, setShowQr] = useState(false);

    // QR Schedule Data (Mock)
    const scheduleData = {
        farm_id: "FARM-001",
        last_irrigation: new Date().toISOString(),
        next_scheduled: new Date(Date.now() + 3600000).toISOString(), // +1 hr
        mode: "Smart-Auto"
    };
    const qrValue = JSON.stringify(scheduleData);

    const moistureLevel = sensorData?.soil_moisture || 0;
    const lastUpdate = sensorData?.last_updated ? new Date(sensorData.last_updated).toLocaleTimeString() : "N/A";

    const openTextLog = (hash, action, timestamp) => {
        const textContent =
            "LETS GO 3.0 - IMMUTABLE BLOCKCHAIN LOG\n" +
            "--------------------------------------\n" +
            "Event:       " + (action || 'IRRIGATION_START') + "\n" +
            "Timestamp:   " + (timestamp || new Date().toISOString()) + "\n" +
            "Batch ID:    ACTIVE-BATCH (Automated)\n" +
            "--------------------------------------\n" +
            "BLOCKCHAIN PROOF:\n" +
            "Hash: " + hash + "\n" +
            "--------------------------------------\n" +
            "Status:      CONFIRMED";

        const blob = new Blob([textContent.trim()], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
    };

    const togglePump = async (pump) => {
        const newState = !activePumps[pump];
        setActivePumps(prev => ({ ...prev, [pump]: newState }));

        // Hardware Control for Pump 1
        if (pump === 'p1') {
            const action = newState ? 'on' : 'off';
            try {
                // Call backend proxy
                const res = await fetch(getApiUrl(`api/feature2/motor/${action}`));
                const data = await res.json();

                if (data.status === 'success' && action === 'on') {
                    // Show success feedback
                    if (data.blockchain_hash) {
                        setLatestHash(data.blockchain_hash);
                        // Open text log directly
                        openTextLog(data.blockchain_hash, "IRRIGATION_START", new Date().toISOString());
                    }
                }
            } catch (e) {
                console.error("Motor Error:", e);
                // Revert state on error if needed
            }
        }
    };

    const activeCount = Object.values(activePumps).filter(Boolean).length;

    // Determine moisture status
    const getMoistureColor = () => {
        if (moistureLevel < 30) return 'text-red-500';
        if (moistureLevel < 50) return 'text-amber-500';
        return 'text-blue-500';
    };

    const getMoistureBg = () => {
        if (moistureLevel < 30) return 'stroke-red-500';
        if (moistureLevel < 50) return 'stroke-amber-500';
        return 'stroke-blue-500';
    };

    return (
        <div className="gov-card h-full flex flex-col overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                        <Gauge size={20} />
                    </div>
                    <div>
                        <h3 className="font-semibold text-slate-900 dark:text-white">{t('smart_controls') || 'Smart Controls'}</h3>
                        <p className="text-xs text-slate-500">{t('active_zones') || 'Active Zones'}: {activeCount}/3</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowQr(!showQr)}
                        className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-blue-500 transition-colors"
                        title="View Schedule QR"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="5" height="5" x="3" y="3" rx="1" /><rect width="5" height="5" x="16" y="3" rx="1" /><rect width="5" height="5" x="3" y="16" rx="1" /><path d="M21 16h-3a2 2 0 0 0-2 2v3" /><path d="M21 21v.01" /><path d="M12 7v3a2 2 0 0 1-2 2H7" /><path d="M3 12h.01" /><path d="M12 3h.01" /><path d="M12 16v.01" /><path d="M16 12h1" /><path d="M21 12v.01" /><path d="M12 21v-1" /></svg>
                    </button>
                    <span className={`gov-badge ${activeCount > 0 ? 'gov-badge-success' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                        {activeCount > 0 ? t('active') || 'Active' : t('idle') || 'Idle'}
                    </span>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 p-4 relative">
                {/* QR Code Overlay */}
                {showQr && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="absolute inset-0 z-20 bg-white/95 dark:bg-slate-900/95 flex flex-col items-center justify-center p-6 text-center backdrop-blur-sm"
                    >
                        <h4 className="font-bold text-slate-900 dark:text-white mb-2">Irrigation Schedule</h4>
                        <div className="p-2 bg-white rounded-xl shadow-lg border border-slate-200">
                            <img
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrValue)}`}
                                alt="Schedule QR"
                                className="w-32 h-32"
                            />
                        </div>
                        <p className="mt-4 text-xs text-slate-500 font-mono">Scan to verify schedule & last activity</p>
                        <button
                            onClick={() => setShowQr(false)}
                            className="mt-4 px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-400"
                        >
                            Close
                        </button>
                    </motion.div>
                )}

                <div className="flex gap-4 h-full">
                    {/* Left: Moisture Gauge */}
                    <div className="w-2/5 flex flex-col items-center justify-center">
                        <div className="relative w-28 h-28">
                            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                                <circle
                                    cx="50"
                                    cy="50"
                                    r="42"
                                    fill="none"
                                    strokeWidth="10"
                                    className="stroke-slate-200 dark:stroke-slate-700"
                                />
                                <motion.circle
                                    initial={{ pathLength: 0 }}
                                    animate={{ pathLength: moistureLevel / 100 }}
                                    transition={{ duration: 1.5, ease: "easeOut" }}
                                    cx="50"
                                    cy="50"
                                    r="42"
                                    fill="none"
                                    strokeWidth="10"
                                    strokeLinecap="round"
                                    className={getMoistureBg()}
                                    style={{
                                        strokeDasharray: `${2 * Math.PI * 42}`,
                                        strokeDashoffset: `${2 * Math.PI * 42 * (1 - moistureLevel / 100)}`
                                    }}
                                />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <Droplets size={16} className={getMoistureColor()} />
                                <span className={`text-2xl font-bold ${getMoistureColor()}`}>{moistureLevel}%</span>
                                <span className="text-[10px] text-slate-600 dark:text-slate-400 uppercase">{t('moisture') || 'Moisture'}</span>
                            </div>
                        </div>

                        {/* Temp Badge */}
                        <div className="mt-4 flex items-center gap-2 px-3 py-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                            <Thermometer size={16} className="text-red-500" />
                            <span className="text-sm font-bold text-red-600 dark:text-red-400">28°C</span>
                        </div>
                    </div>

                    {/* Right: Pump Controls */}
                    <div className="flex-1 flex flex-col gap-3">
                        <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Pump Controls</p>
                        <div className="grid grid-cols-3 gap-3 flex-1">
                            {['p1', 'p2', 'p3'].map((pump, idx) => (
                                <button
                                    key={pump}
                                    onClick={() => togglePump(pump)}
                                    className={`rounded-xl flex flex-col items-center justify-center gap-2 transition-all border-2 min-h-[80px] ${activePumps[pump]
                                        ? 'bg-organic-green border-organic-green-400 text-white shadow-lg shadow-organic-green/20'
                                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 hover:border-organic-green hover:text-organic-green dark:hover:border-organic-green'
                                        }`}
                                >
                                    <Power size={20} className={activePumps[pump] ? 'animate-pulse' : ''} />
                                    <span className="text-xs font-bold uppercase">Zone {idx + 1}</span>
                                    <span className="text-[10px]">{activePumps[pump] ? 'ON' : 'OFF'}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Clock size={12} />
                    <span>Last Update: {lastUpdate}</span>
                </div>
                <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                    {t('flow_rate') || 'Flow Rate'}: 8 ml/s
                </span>
            </div>

            {/* Blockchain Hash Display */}
            {latestHash && (
                <div className="px-3 py-2 bg-emerald-50 dark:bg-emerald-900/10 border-t border-emerald-100 dark:border-emerald-800/30 flex justify-between items-center animate-in slide-in-from-bottom-2 fade-in duration-500">
                    <div className="flex items-center gap-2 overflow-hidden">
                        <div className="p-1 rounded bg-emerald-100 dark:bg-emerald-800 text-emerald-600 dark:text-emerald-400">
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>
                        </div>
                        <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-400 truncate max-w-[150px]">
                            {latestHash}
                        </span>
                    </div>
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            openTextLog(latestHash, "IRRIGATION_START", new Date().toISOString());
                        }}
                        className="text-[10px] font-bold text-emerald-600 hover:underline flex-shrink-0 ml-2 bg-transparent border-none cursor-pointer"
                    >
                        View Log
                    </button>
                </div>
            )}
        </div>
    );
};

export default SmartIrrigation;
