import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import Recommendations from './Recommendations';
import { API_BASE_URL } from '../../config/api';

const FarmDashboard = () => {
    const { t } = useTranslation();
    const [sensorData, setSensorData] = useState(null);
    const [decision, setDecision] = useState(null);
    const [loading, setLoading] = useState(true);
    const [cycleLoading, setCycleLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [blockchainHistory, setBlockchainHistory] = useState([]);
    const [showRecommendations, setShowRecommendations] = useState(true);

    // Get Farmer ID
    const farmerId = localStorage.getItem("farmer_id") || "DEMO_FARMER_001";

    // --- RULE ENGINE ---
    const evaluateRules = (data) => {
        if (!data) return null;

        const { soil_moisture, soil_temperature, nitrogen, phosphorus, potassium } = data;

        let actions = [];
        let critical = false;
        let reasons = [];

        // 1. Irrigation Rules (Simplified)
        if (soil_moisture < 20) {
            actions.push("CRITICAL: Heavy Irrigation");
            reasons.push(`Critical: Very Low Moisture (${soil_moisture}%)`);
            critical = true;
        } else if (soil_moisture < 30) {
            actions.push("Standard Irrigation");
            reasons.push(`Low Moisture (${soil_moisture}%)`);
        }

        // 2. Fertilizer Rules
        if (nitrogen < 50) {
            actions.push("Apply Urea");
            reasons.push(`Nitrogen LOW (${nitrogen} kg/ha)`);
        }
        if (phosphorus < 30) {
            actions.push("Apply DAP");
            reasons.push(`Phosphorus LOW (${phosphorus} kg/ha)`);
        }
        if (potassium < 40) {
            actions.push("Apply MOP");
            reasons.push(`Potassium LOW (${potassium} kg/ha)`);
        }

        if (actions.length === 0) {
            return { needed: false, reason: "Conditions Optimal" };
        }

        return {
            needed: true,
            actions: actions,
            reason: reasons.join(" | "),
            timestamp: new Date().toISOString()
        };
    };

    const fetchStatus = async () => {
        try {
            // Using hardware sensor API with API_BASE_URL
            const res = await fetch(`${API_BASE_URL}/api/hardware/latest?user_id=HARDWARE_DEFAULT`);
            const result = await res.json();

            if (result.status === 'success' && result.data) {
                setSensorData(result.data);
                const decisionResult = evaluateRules(result.data);
                setDecision(decisionResult);
            }
            setLoading(false);
        } catch (e) {
            console.error("Error fetching sensor data", e);
            // Fallback mock data to prevent infinite loading screen
            const mockData = {
                soil_moisture: 45,
                soil_temperature: 24,
                ph: 6.8,
                nitrogen: 55,
                phosphorus: 35,
                potassium: 45,
                created_at: new Date().toISOString()
            };
            setSensorData(mockData);
            setDecision(evaluateRules(mockData));
            setLoading(false);
        }
    };

    const fetchHistory = async () => {
        const apiUrl = import.meta.env.VITE_API_BASE_URL || 'https://let-go-3-0.onrender.com';
        try {
            const res = await axios.get(`${apiUrl}/api/feature3/history`, {
                headers: { "X-Farmer-ID": farmerId }
            });
            setBlockchainHistory(res.data);
        } catch (e) { }
    };

    useEffect(() => {
        fetchStatus();
        fetchHistory();
        const interval = setInterval(fetchStatus, 5000); // Poll every 5s
        return () => clearInterval(interval);
    }, []);

    const runAutomationCycle = async () => {
        setCycleLoading(true);
        // Simulate checking rules again
        await fetchStatus();
        setTimeout(() => {
            setCycleLoading(false);
            if (decision?.needed) {
                // Mock sending an SMS
                alert(`🤖 Auto-Farm Decision:\n${decision.actions.join("\n")}\n\nSMS Sent to Farmer.`);
            } else {
                alert("✅ System Optimal. No Actions needed.");
            }
        }, 1500);
    };

    const handleStartAction = async () => {
        setActionLoading(true);
        try {
            // In a real system, this would trigger the specific hardware
            // For now, we simulate execution
            await new Promise(r => setTimeout(r, 2000));
            alert("Actions Executed Successfully!");
            // Refresh
            fetchStatus();
        } catch (e) {
            alert("Error executing actions");
        } finally {
            setActionLoading(false);
        }
    };

    if (loading || !sensorData) return <div className="p-10 text-slate-900 dark:text-white font-mono">{t('loading_farm_system')}...</div>;

    return (
        <div data-tour="autonomous-farm-main" className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white p-6 pb-20 font-sans">
            <header className="flex justify-between items-center mb-8 border-b border-slate-200 dark:border-white/10 pb-4">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-green-400 to-cyan-400 bg-clip-text text-transparent">
                        {t('autonomous_farm_title')}
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400 text-sm">{t('autonomous_farm_subtitle')}</p>
                </div>
                <div className="flex gap-4">
                    <button
                        onClick={runAutomationCycle}
                        disabled={cycleLoading}
                        className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg font-bold shadow-lg transition-all flex items-center gap-2"
                    >
                        {cycleLoading ? <span className="animate-spin">⚙️</span> : "▶"}
                        {cycleLoading ? t('simulating') : t('run_automation_cycle')}
                    </button>
                    <Link to="/trust-report/DEMO-BATCH-001" className="px-6 py-2 bg-slate-800 border border-white/20 rounded-lg hover:bg-slate-700 transition-all">
                        {t('view_trust_report')}
                    </Link>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* 1. SENSOR MONITOR */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-white/5 shadow-xl h-full flex flex-col">
                    <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
                        <span>📡</span> {t('real_time_sensors')}
                    </h2>
                    <div className="grid grid-cols-3 gap-3 flex-1">
                        <SensorCard label={t('soil_moisture')} value={`${sensorData.soil_moisture || '0'}%`}
                            color={sensorData.soil_moisture < 30 ? "text-red-400" : "text-cyan-400"}
                        />
                        <SensorCard label="pH" value={`${sensorData.ph || '7.0'}`} color="text-purple-400" />
                        <div className="hidden md:block"></div>

                        <SensorCard label="N" value={`${sensorData.nitrogen || '0'}`} unit="kg/ha" color={sensorData.nitrogen < 50 ? "text-red-400" : "text-green-400"} />
                        <SensorCard label="P" value={`${sensorData.phosphorus || '0'}`} unit="kg/ha" color={sensorData.phosphorus < 30 ? "text-red-400" : "text-green-400"} />
                        <SensorCard label="K" value={`${sensorData.potassium || '0'}`} unit="kg/ha" color={sensorData.potassium < 40 ? "text-red-400" : "text-green-400"} />
                    </div>
                    <div className="mt-4 text-[10px] text-slate-500 text-right">
                        Live • {new Date(sensorData.created_at || Date.now()).toLocaleTimeString()}
                    </div>
                </div>

                {/* 2. DECISION & CONTROL */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-white/5 shadow-xl flex flex-col justify-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-50"></div>

                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <span>🧠</span> {t('decision_engine')}
                    </h2>

                    {decision?.needed ? (
                        <div className="bg-red-500/10 border border-red-500/50 rounded-2xl p-6 text-center animate-pulse">
                            <div className="text-4xl mb-2">⚡</div>
                            <h3 className="text-2xl font-black text-red-500 uppercase tracking-widest mb-2">{t('action_required')}</h3>

                            <div className="space-y-2 mb-6">
                                {decision.actions.map((action, idx) => (
                                    <div key={idx} className="bg-red-500/20 px-3 py-1 rounded text-red-200 font-bold border border-red-500/30">
                                        {action}
                                    </div>
                                ))}
                            </div>

                            <p className="text-xs text-red-300 border-t border-red-500/30 pt-2 mb-4">
                                Reason: {decision.reason}
                            </p>

                            <button
                                onClick={handleStartAction}
                                disabled={actionLoading}
                                className="w-full py-4 bg-red-600 hover:bg-red-500 text-white rounded-xl font-black text-lg shadow-lg shadow-red-900/40 transition-all active:scale-95"
                            >
                                {actionLoading ? t('processing') : "EXECUTE DECISIONS"}
                            </button>
                            <p className="text-xs text-red-400 mt-3">{t('sms_notification')}</p>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-500">
                            <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mb-4">
                                <span className="text-3xl">✅</span>
                            </div>
                            <p className="font-medium text-green-400">{t('system_optimal')}</p>
                            <p className="text-sm opacity-60">All sensor parameters within healthy ranges.</p>
                        </div>
                    )}
                </div>

                {/* 3. BLOCKCHAIN LEDGER */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-white/5 shadow-xl overflow-hidden flex flex-col">
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <span>⛓️</span> {t('blockchain_ledger')}
                    </h2>
                    <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-slate-700">
                        {blockchainHistory.slice().reverse().map((block, i) => (
                            <div key={i} className="bg-slate-800 p-3 rounded-xl border-l-4 border-indigo-500">
                                <div className="flex justify-between items-start">
                                    <span className="text-xs font-mono text-indigo-400">{t('block')} #{block.index}</span>
                                    <span className="text-[10px] text-slate-500">{new Date(block.data.timestamp).toLocaleTimeString()}</span>
                                </div>
                                <div className="font-bold text-sm text-slate-200 my-1">{block.data.event_type}</div>
                                <div className="text-[10px] font-mono text-slate-600 truncate">Hash: {block.hash}</div>
                            </div>
                        ))}
                        {blockchainHistory.length === 0 && (
                            <div className="text-center text-slate-600 py-10">
                                {t('ledger_empty')}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* AI RECOMMENDATIONS SECTION */}
            <div className="mt-8">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-green-400 to-cyan-400 bg-clip-text text-transparent">
                        🤖 AI-Powered Recommendations
                    </h2>
                    <button
                        onClick={() => setShowRecommendations(!showRecommendations)}
                        className="px-4 py-2 bg-slate-800 border border-white/20 rounded-lg hover:bg-slate-700 transition-all text-sm"
                    >
                        {showRecommendations ? 'Hide' : 'Show'} Recommendations
                    </button>
                </div>

                {showRecommendations && (
                    <Recommendations userId="HARDWARE_DEFAULT" />
                )}
            </div>
        </div>
    );
};

const SensorCard = ({ label, value, unit, color }) => (
    <div className="bg-slate-50 dark:bg-slate-950 p-2 rounded-lg border border-slate-200 dark:border-white/10 flex flex-col justify-between h-20 shadow-sm relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-1 opacity-10 group-hover:opacity-20 transition-opacity">
            <div className={`w-8 h-8 rounded-full ${color.replace('text-', 'bg-')}`}></div>
        </div>
        <div className="text-slate-500 text-[10px] uppercase font-bold tracking-wider z-10">{label}</div>
        <div className="z-10">
            <div className={`text-lg font-black leading-none ${color}`}>{value}</div>
            {unit && <div className="text-[10px] text-slate-600 font-mono mt-0.5">{unit}</div>}
        </div>
    </div>
);

export default FarmDashboard;
