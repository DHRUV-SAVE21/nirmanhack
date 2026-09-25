import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wifi, WifiOff, RefreshCw, CloudOff } from 'lucide-react';

const OfflineIndicator = () => {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [showRestored, setShowRestored] = useState(false);

    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            setShowRestored(true);
            setTimeout(() => setShowRestored(false), 4000);
        };

        const handleOffline = () => {
            setIsOnline(false);
            setShowRestored(false);
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    return (
        <AnimatePresence>
            {!isOnline && (
                <motion.div
                    initial={{ y: -100, opacity: 0, scale: 0.8 }}
                    animate={{ y: 0, opacity: 1, scale: 1 }}
                    exit={{ y: -100, opacity: 0, scale: 0.8 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className="fixed top-24 left-1/2 -translate-x-1/2 z-[60] flex flex-col items-center"
                >
                    <div className="bg-red-600 text-white px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-4 border-2 border-red-400">
                        <div className="p-2 bg-white/20 rounded-full animate-pulse">
                            <WifiOff size={32} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold font-display">You are Offline</h3>
                            <p className="text-sm text-red-100">Don't worry, Annadata is caching your data.</p>
                        </div>
                    </div>
                    {/* Hanging wire animation */}
                    <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: 40 }}
                        className="w-1 bg-red-400"
                    />
                    <div className="bg-red-600 p-2 rounded-full border-2 border-red-400">
                        <CloudOff size={20} className="text-slate-900 dark:text-white" />
                    </div>
                </motion.div>
            )}

            {showRestored && (
                <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0, opacity: 0 }}
                    className="fixed inset-0 z-[60] flex items-center justify-center pointer-events-none" // Overlay style for "Crazy" effect
                >
                    <div className="bg-organic-green text-dark-navy px-12 py-8 rounded-3xl shadow-[0_0_50px_rgba(34,197,94,0.6)] flex flex-col items-center gap-4 border-4 border-white">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                            className="p-4 bg-dark-navy/10 rounded-full"
                        >
                            <RefreshCw size={48} className="text-dark-navy animate-spin-slow" />
                        </motion.div>
                        <div className="text-center">
                            <h3 className="text-3xl font-bold font-display">Successfully Connected!</h3>
                            <p className="text-lg font-medium opacity-80">Syncing your farm data...</p>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default OfflineIndicator;
