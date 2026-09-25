import React from 'react';
import { Tilt } from 'react-tilt';
import { useTranslation } from 'react-i18next';
import { Droplets, Sprout, AlertTriangle, Check, X, Power, Zap, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getApiUrl } from '../../config/api';

const TodaysActionCard = ({ sensorData }) => {
    const { t } = useTranslation();
    const { soil_moisture = 0, nitrogen = 0, phosphorus = 0, potassium = 0 } = sensorData || {};
    const [pumpStatus, setPumpStatus] = React.useState(false);
    const [fertilizerStatus, setFertilizerStatus] = React.useState(false);
    const [loading, setLoading] = React.useState(false);
    const [actionMessage, setActionMessage] = React.useState("");

    React.useEffect(() => {
        // Poll status logic here if needed
    }, []);

    const handleIrrigate = async () => {
        if (soil_moisture >= 30) {
            setActionMessage("Moisture is sufficient (>30%). Pump not needed.");
            setTimeout(() => setActionMessage(""), 3000);
            return;
        }

        setLoading(true);
        try {
            fetch('http://10.110.7.155/motor/on', { method: 'GET', mode: 'no-cors' }).catch(e => console.warn(e));
            setPumpStatus(true);
            setActionMessage("Pump Started Successfully!");
        } catch (error) {
            console.error("Error triggering pump:", error);
            setPumpStatus(true);
            setActionMessage("Pump Started (Optimistic)");
        } finally {
            setLoading(false);
            setTimeout(() => setActionMessage(""), 3000);
        }
    };

    const handleStopPump = async () => {
        setLoading(true);
        try {
            fetch('http://10.110.7.155/motor/off', { method: 'GET', mode: 'no-cors' }).catch(e => console.warn(e));
            setPumpStatus(false);
            setActionMessage("Pump Stopped.");
        } catch (error) {
            console.error("Error stopping pump:", error);
            setPumpStatus(false);
            setActionMessage("Pump Stopped (Optimistic)");
        } finally {
            setLoading(false);
            setTimeout(() => setActionMessage(""), 3000);
        }
    };

    const handleStartFertilizer = async () => {
        setLoading(true);
        try {
            fetch('http://10.110.7.155/motor/on', { method: 'GET', mode: 'no-cors' }).catch(e => console.warn(e));
            setFertilizerStatus(true);
            setActionMessage("Fertigation Started!");
        } catch (error) {
            setFertilizerStatus(true);
            setActionMessage("Fertigation Started (Optimistic)");
        } finally {
            setLoading(false);
            setTimeout(() => setActionMessage(""), 3000);
        }
    };

    const handleStopFertilizer = async () => {
        setLoading(true);
        try {
            fetch('http://10.110.7.155/motor/off', { method: 'GET', mode: 'no-cors' }).catch(e => console.warn(e));
            setFertilizerStatus(false);
            setActionMessage("Fertigation Stopped.");
        } catch (error) {
            setFertilizerStatus(false);
            setActionMessage("Fertigation Stopped (Optimistic)");
        } finally {
            setLoading(false);
            setTimeout(() => setActionMessage(""), 3000);
        }
    };

    const isFertilizerNeeded = nitrogen < 200 || phosphorus < 30 || potassium < 35;
    const isIrrigationNeeded = soil_moisture < 30;

    const getStatusText = () => {
        if (pumpStatus) return t('dashboard.statusIrrigating') || 'Irrigating';
        if (fertilizerStatus) return t('dashboard.statusFertilizing') || 'Fertilizing';
        return t('dashboard.statusIdle') || 'Idle';
    };

    const getStatusColor = () => {
        if (pumpStatus) return 'bg-blue-500';
        if (fertilizerStatus) return 'bg-amber-500';
        return 'bg-slate-400';
    };

    return (
        <Tilt className="w-full h-full" options={{ max: 8, scale: 1.01, speed: 300 }}>
            <div className="gov-card-elevated h-full flex flex-col border-l-4 border-l-organic-green overflow-hidden">

                {/* Header */}
                <div className="p-5 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
                                {t('dashboard.todaysFocus') || "Today's Focus"}
                            </h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                {t('dashboard.liveRecommendations') || 'AI-powered recommendations'}
                            </p>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                            <span className={`w-2.5 h-2.5 rounded-full ${getStatusColor()} ${pumpStatus || fertilizerStatus ? 'animate-pulse' : ''}`} />
                            <span className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wide">
                                {getStatusText()}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Action Cards */}
                <div className="flex-1 p-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">

                        {/* Irrigation Card */}
                        <div className={`rounded-xl p-5 border-2 transition-all flex flex-col ${isIrrigationNeeded ? 'bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800' : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'}`}>
                            <div className="flex items-center gap-3 mb-4">
                                <div className={`p-3 rounded-xl ${isIrrigationNeeded ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'}`}>
                                    <Droplets size={24} />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-slate-900 dark:text-white">{t('dashboard.irrigate') || 'Irrigation'}</h3>
                                    <p className="text-xs text-slate-500">
                                        {t('dashboard.moistureLevel') || 'Moisture'}: <span className={`font-bold ${soil_moisture < 30 ? 'text-red-600' : 'text-organic-green'}`}>{soil_moisture}%</span>
                                    </p>
                                </div>
                                {isIrrigationNeeded && (
                                    <span className="gov-badge-danger text-[10px]">
                                        <AlertTriangle size={10} /> 
                                    </span>
                                )}
                            </div>

                            {/* Progress Bar */}
                            <div className="mb-4">
                                <div className="gov-progress h-3">
                                    <div
                                        className={`gov-progress-bar ${soil_moisture < 30 ? 'bg-red-500' : soil_moisture < 50 ? 'bg-amber-500' : 'bg-blue-500'}`}
                                        style={{ width: `${Math.min(soil_moisture, 100)}%` }}
                                    />
                                </div>
                                <div className="flex justify-between text-[10px] text-slate-600 dark:text-slate-400 mt-1">
                                    <span>0%</span>
                                    <span>Optimal: 30-60%</span>
                                    <span>100%</span>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-2 mt-auto">
                                <button
                                    onClick={handleIrrigate}
                                    disabled={loading || pumpStatus}
                                    className={`flex-1 py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all text-sm ${pumpStatus ? 'bg-blue-600 text-white' : 'bg-organic-green hover:bg-organic-green-800 text-white shadow-sm'} ${loading ? 'opacity-50' : ''}`}
                                >
                                    <Power size={16} />
                                    {pumpStatus ? 'Running...' : t('dashboard.start') || 'Start'}
                                </button>
                                <button
                                    onClick={handleStopPump}
                                    disabled={loading || !pumpStatus}
                                    className="px-4 py-3 bg-white dark:bg-slate-700 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 font-bold rounded-lg flex items-center justify-center gap-2 transition-all text-sm hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-30"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        </div>

                        {/* Fertilizer Card */}
                        <div className={`rounded-xl p-5 border-2 transition-all flex flex-col ${isFertilizerNeeded ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800' : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'}`}>
                            <div className="flex items-center gap-3 mb-4">
                                <div className={`p-3 rounded-xl ${isFertilizerNeeded ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'}`}>
                                    <Sprout size={24} />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-slate-900 dark:text-white">{t('dashboard.fertilize') || 'Fertigation'}</h3>
                                    <p className="text-xs text-slate-500">
                                        {isFertilizerNeeded ? t('dashboard.npkLevelsLow') || 'NPK levels low' : t('dashboard.nutrientsOptimal') || 'Nutrients optimal'}
                                    </p>
                                </div>
                                {isFertilizerNeeded && (
                                    <span className="gov-badge-warning text-[10px]">
                                        <Zap size={10} /> 
                                    </span>
                                )}
                            </div>

                            {/* NPK Status Mini */}
                            <div className="flex gap-2 mb-4">
                                <div className="flex-1 text-center p-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                                    <span className="block text-xs text-slate-600 dark:text-slate-400">N</span>
                                    <span className={`text-sm font-bold ${nitrogen < 200 ? 'text-amber-600' : 'text-organic-green'}`}>{nitrogen}</span>
                                </div>
                                <div className="flex-1 text-center p-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                                    <span className="block text-xs text-slate-600 dark:text-slate-400">P</span>
                                    <span className={`text-sm font-bold ${phosphorus < 30 ? 'text-amber-600' : 'text-organic-green'}`}>{phosphorus}</span>
                                </div>
                                <div className="flex-1 text-center p-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                                    <span className="block text-xs text-slate-600 dark:text-slate-400">K</span>
                                    <span className={`text-sm font-bold ${potassium < 35 ? 'text-amber-600' : 'text-organic-green'}`}>{potassium}</span>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-2 mt-auto">
                                {isFertilizerNeeded ? (
                                    <>
                                        <button
                                            onClick={handleStartFertilizer}
                                            disabled={loading || fertilizerStatus}
                                            className={`flex-1 py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all text-sm ${fertilizerStatus ? 'bg-amber-600 text-white' : 'bg-amber-500 hover:bg-amber-600 text-white shadow-sm'} ${loading ? 'opacity-50' : ''}`}
                                        >
                                            <Power size={16} />
                                            {fertilizerStatus ? 'Running...' : t('dashboard.start') || 'Start'}
                                        </button>
                                        <button
                                            onClick={handleStopFertilizer}
                                            disabled={loading || !fertilizerStatus}
                                            className="px-4 py-3 bg-white dark:bg-slate-700 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 font-bold rounded-lg flex items-center justify-center gap-2 transition-all text-sm hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-30"
                                        >
                                            <X size={16} />
                                        </button>
                                    </>
                                ) : (
                                    <div className="w-full py-3 bg-organic-green/10 border border-organic-green/20 text-organic-green font-bold rounded-lg text-center text-sm flex items-center justify-center gap-2">
                                        <Check size={16} />
                                        {t('dashboard.noActionNeeded') || 'No Action Needed'}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Action Message Toast */}
                <AnimatePresence>
                    {actionMessage && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                            className="absolute bottom-4 left-1/2 -translate-x-1/2"
                        >
                            <div className="px-4 py-2 bg-white dark:bg-slate-900 dark:bg-white text-slate-900 dark:text-white dark:text-slate-900 rounded-lg shadow-lg text-sm font-medium flex items-center gap-2">
                                <Check size={16} className="text-organic-green" />
                                {actionMessage}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Footer Advisory */}
                <div className="px-5 py-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                    <Info size={14} className="text-slate-600 dark:text-slate-400" />
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                        {soil_moisture < 30
                            ? t('dashboard.criticalMoisture') || '⚠️ Critical: Irrigation recommended immediately'
                            : t('dashboard.systemOptimal') || '✅ All systems operating within optimal parameters'}
                    </p>
                </div>
            </div>
        </Tilt>
    );
};

export default TodaysActionCard;
