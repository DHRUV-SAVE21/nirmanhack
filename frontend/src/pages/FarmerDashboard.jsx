import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Tilt } from 'react-tilt';
import TodaysActionCard from '../components/features/TodaysActionCard';
import ZoneMap from '../components/features/ZoneMap';
import AIExplanationCard from '../components/features/AIExplanationCard';
import SoilHealthCards from '../components/features/SoilHealthCards';
import CropHealth from '../components/features/CropHealth';
import MandiPrices from '../components/features/MandiPrices';
import WeatherForecast from '../components/features/WeatherForecast';
import SmartIrrigation from '../components/features/SmartIrrigation';
import GasMonitoringCard from '../components/features/GasMonitoringCard';
import FireDetectionCard from '../components/features/FireDetectionCard';
import { ArrowRight, Bell, Settings, Activity, Plus, ChevronDown, FileText, X, Loader2, CheckCircle } from 'lucide-react';
import { API_BASE_URL } from '../config/api';
import FarmerOnboarding from '../components/ui/FarmerOnboarding';

const DashboardSection = ({ title, children, className = "" }) => (
    <div className={`flex flex-col h-full ${className}`}>
        {title && <h3 className="gov-section-header">{title}</h3>}
        {children}
    </div>
);

const FarmerDashboard = () => {
    const { t } = useTranslation();
    const [user, setUser] = useState(null);
    const [isReportDropdownOpen, setIsReportDropdownOpen] = useState(false);

    // Report generation state
    const [showReportModal, setShowReportModal]   = useState(false);
    const [reportLang,      setReportLang]        = useState('en');
    const [reportLoading,   setReportLoading]     = useState(false);
    const [reportSuccess,   setReportSuccess]     = useState(false);
    const [farmerProfile,   setFarmerProfile]     = useState({
        name:             '',
        farm_size:        '',
        soil_type:        'Alluvial',
        gps:              '',
        irrigation_status: true,
    });
    // Onboarding
    const [showOnboarding, setShowOnboarding] = useState(false);

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.08 }
        }
    };

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    };

    const [sensorData, setSensorData] = useState(null);

    useEffect(() => {
        // Get user data
        const userData = localStorage.getItem('user');
        if (userData) {
            try {
                const parsedUser = JSON.parse(userData);
                setUser(parsedUser);
                // Pre-fill farmer name from auth user if no onboarding data yet
                const savedProfile = localStorage.getItem('farmerOnboardingData');
                if (!savedProfile) {
                    setFarmerProfile(prev => ({
                        ...prev,
                        name: parsedUser?.full_name || '',
                    }));
                }
            } catch (e) { console.error(e); }
        }

        // ── Onboarding check ────────────────────────────────────
        const savedOnboarding = localStorage.getItem('farmerOnboardingData');
        if (!savedOnboarding) {
            // First visit — show onboarding after a brief delay
            setTimeout(() => setShowOnboarding(true), 600);
        } else {
            // Already completed — prefill report form from saved data
            try {
                const saved = JSON.parse(savedOnboarding);
                setFarmerProfile(prev => ({
                    ...prev,
                    name:      saved.name      || prev.name,
                    farm_size: saved.farm_size || prev.farm_size,
                    soil_type: saved.soil_type || prev.soil_type,
                }));
            } catch (e) { console.error('Onboarding parse error:', e); }
        }

        const fetchSensorData = async () => {
            try {
                const user = JSON.parse(localStorage.getItem('user') || '{}');
                const userId = user.id || 'HARDWARE_DEFAULT';

                console.log(`Fetching sensor data for ${userId}...`);
                const response = await fetch(`${API_BASE_URL}/api/hardware/latest?user_id=HARDWARE_DEFAULT`);

                const result = await response.json();

                if (result.status === 'success' && result.data) {
                    setSensorData(result.data);
                }
            } catch (error) {
                console.error('Error fetching sensor data from backend:', error);
            }
        };

        fetchSensorData();
        const intervalId = setInterval(fetchSensorData, 5000);

        return () => clearInterval(intervalId);
    }, []);

    const currentHour = new Date().getHours();
    const greeting = currentHour < 12 ? t('good_morning') || 'Good Morning' : currentHour < 17 ? t('good_afternoon') || 'Good Afternoon' : t('good_evening') || 'Good Evening';

    const LANG_LABELS = {
        en: { label: 'English',  flag: '🇬🇧' },
        hi: { label: 'Hindi',    flag: '🇮🇳' },
        mr: { label: 'Marathi',  flag: '🟠' },
    };

    const handleOnboardingComplete = (profile) => {
        setShowOnboarding(false);
        // Prefill the report modal form with onboarding answers
        setFarmerProfile(prev => ({
            ...prev,
            name:      profile.name      || user?.full_name || prev.name,
            farm_size: profile.farm_size || prev.farm_size,
            soil_type: profile.soil_type || prev.soil_type,
        }));
    };

    const openReportModal = (lang) => {
        // Also pull latest onboarding data in case it was just completed
        const saved = localStorage.getItem('farmerOnboardingData');
        if (saved) {
            try {
                const s = JSON.parse(saved);
                setFarmerProfile(prev => ({
                    ...prev,
                    name:      s.name      || user?.full_name || prev.name,
                    farm_size: s.farm_size || prev.farm_size,
                    soil_type: s.soil_type || prev.soil_type,
                }));
            } catch (_) {}
        } else {
            setFarmerProfile(prev => ({
                ...prev,
                name: user?.full_name || prev.name,
            }));
        }
        setReportLang(lang);
        setIsReportDropdownOpen(false);
        setReportSuccess(false);
        setShowReportModal(true);
    };

    const handleGenerateReport = async () => {
        setReportLoading(true);
        try {
            const userData = JSON.parse(localStorage.getItem('user') || '{}');
            const userId   = userData.id || 'HARDWARE_DEFAULT';

            // Backend will pull profile from Supabase; form values override if filled
            const payload = {
                user_id:           userId,
                language:          reportLang,
                name:              farmerProfile.name              || undefined,
                farm_size:         farmerProfile.farm_size         || undefined,
                soil_type:         farmerProfile.soil_type         || undefined,
                gps:               farmerProfile.gps               || undefined,
                irrigation_status: farmerProfile.irrigation_status,
            };

            const response = await fetch(`${API_BASE_URL}/api/report/generate`, {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify(payload),
            });

            if (!response.ok) {
                const err = await response.json().catch(() => ({}));
                throw new Error(err.detail || 'Report generation failed');
            }

            const blob     = await response.blob();
            const url      = window.URL.createObjectURL(blob);
            const a        = document.createElement('a');
            a.href         = url;
            const date     = new Date().toISOString().slice(0, 10);
            a.download     = `soil_report_${reportLang}_${date}.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
            setReportSuccess(true);
            setTimeout(() => setShowReportModal(false), 1800);
        } catch (err) {
            console.error('Report error:', err);
            alert(`Failed to generate report: ${err.message}`);
        } finally {
            setReportLoading(false);
        }
    };

    return (
        <div className="min-h-screen pt-24 px-4 sm:px-6 lg:px-8 pb-12 max-w-7xl mx-auto">

            {/* ── First-time Onboarding Wizard ── */}
            {showOnboarding && (
                <FarmerOnboarding onComplete={handleOnboardingComplete} />
            )}

            {/* Page Header */}
            <div data-tour="dashboard-greeting" className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                    <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-1">
                        <span>{greeting}</span>
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white">
                        {t('namaste') || 'Namaste'}, <span className="text-organic-green">{user?.full_name?.split(' ')[0] || t('farmer') || 'Farmer'}</span>
                    </h1>
                </div>

                <div className="flex items-center gap-3">
                    {/* Generate Report Group */}
                    <div className="relative z-50">
                        {/* Desktop Generate Report Button */}
                        <div className="hidden sm:flex items-stretch bg-[#6B46C1] text-white rounded-[16px] shadow-lg border border-white/10 group transition-all duration-200">
                            <button 
                                className="flex items-center py-2 px-3 border-r border-white/20 hover:bg-[#5A38A3] active:bg-[#4A2D85] transition-colors rounded-l-[16px]"
                                onClick={() => openReportModal(reportLang || 'en')}
                            >
                                <div className="bg-white/20 rounded-[8px] p-1 mr-2 flex items-center justify-center">
                                    <Plus size={16} strokeWidth={2.5} />
                                </div>
                                <span className="font-medium text-[15px] pr-1 tracking-wide">{t('Generate report') || 'Generate Report'}</span>
                            </button>
                            <button 
                                className="px-3 flex items-center justify-center hover:bg-[#5A38A3] active:bg-[#4A2D85] transition-colors rounded-r-[16px]"
                                onClick={() => setIsReportDropdownOpen(!isReportDropdownOpen)}
                            >
                                <ChevronDown size={18} strokeWidth={2.5} className={`transition-transform duration-200 ${isReportDropdownOpen ? 'rotate-180' : ''}`} />
                            </button>
                        </div>

                        {/* Mobile Generate Report Button (Icon Only) */}
                        <button 
                            className="sm:hidden flex items-center justify-center p-2.5 bg-[#6B46C1] hover:bg-[#5A38A3] active:bg-[#4A2D85] text-white rounded-xl shadow-lg transition-all duration-200"
                            onClick={() => setIsReportDropdownOpen(!isReportDropdownOpen)}
                        >
                            <Plus size={20} strokeWidth={2.5} />
                        </button>

                        {/* Language Dropdown Menu */}
                        {isReportDropdownOpen && (
                            <div className="absolute top-full right-0 mt-2 w-44 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden z-50">
                                <div className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-700">
                                    Select Report Language
                                </div>
                                {[['en','🇬🇧','English'],['hi','🇮🇳','Hindi'],['mr','🟠','Marathi']].map(([code, flag, label]) => (
                                    <button
                                        key={code}
                                        className="w-full text-left px-4 py-2.5 text-sm font-medium text-slate-800 dark:text-slate-200 hover:bg-violet-50 dark:hover:bg-violet-900/30 transition-colors border-b last:border-0 border-slate-100 dark:border-slate-700/50 flex items-center gap-2"
                                        onClick={() => openReportModal(code)}
                                    >
                                        <span>{flag}</span>
                                        <span>{label}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <button className="relative p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-organic-green transition-colors shadow-sm">
                        <Bell size={20} className="text-slate-600 dark:text-slate-300" />
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white dark:border-slate-800">3</span>
                    </button>
                    <button className="p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-organic-green transition-colors shadow-sm">
                        <Settings size={20} className="text-slate-600 dark:text-slate-300" />
                    </button>
                </div>
            </div>

            {/* Main Dashboard Grid */}
            <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 md:grid-cols-12 gap-6"
            >
                {/* ROW 1: PRIMARY ACTION & MAP */}
                <motion.div variants={item} className="col-span-1 md:col-span-6 lg:col-span-5 min-h-[380px]">
                    <DashboardSection title={t('primary_decision') || 'Primary Decision'}>
                        <div data-tour="primary-decision" className="h-full">
                            <TodaysActionCard sensorData={sensorData} />
                        </div>
                    </DashboardSection>
                </motion.div>

                <motion.div variants={item} className="col-span-1 md:col-span-6 lg:col-span-3 min-h-[250px]">
                    <DashboardSection title={t('irrigation_zones') || 'Irrigation Zones'}>
                        <div data-tour="zone-map" className="gov-card-elevated h-full overflow-hidden">
                            <ZoneMap />
                        </div>
                    </DashboardSection>
                </motion.div>

                <motion.div variants={item} className="col-span-1 md:col-span-12 lg:col-span-4 min-h-[250px]">
                    <DashboardSection title={t('ai_insights') || 'AI Insights'}>
                        <div data-tour="ai-insights" className="h-full">
                            <AIExplanationCard />
                        </div>
                    </DashboardSection>
                </motion.div>

                {/* ROW 2: SOIL HEALTH & WEATHER */}
                <motion.div variants={item} className="col-span-1 md:col-span-7 lg:col-span-5 min-h-[200px]">
                    <DashboardSection title={t('soil_health_title') || 'Soil Health'}>
                        <div data-tour="soil-health" className="h-full">
                            <SoilHealthCards sensorData={sensorData} />
                        </div>
                    </DashboardSection>
                </motion.div>

                <motion.div variants={item} className="col-span-1 md:col-span-5 lg:col-span-3 min-h-[200px]">
                    <DashboardSection title={t('field_weather') || 'Weather'}>
                        <div data-tour="weather-forecast" className="h-full">
                            <Tilt className="w-full h-full" options={{ max: 8, scale: 1.01, speed: 300 }}>
                                <WeatherForecast />
                            </Tilt>
                        </div>
                    </DashboardSection>
                </motion.div>

                <motion.div variants={item} className="col-span-1 md:col-span-12 lg:col-span-4 min-h-[200px]">
                    <DashboardSection title={t('smart_controls') || 'Smart Controls'}>
                        <div data-tour="smart-irrigation" className="h-full">
                            <Tilt className="w-full h-full" options={{ max: 8, scale: 1.01, speed: 300 }}>
                                <SmartIrrigation sensorData={sensorData} />
                            </Tilt>
                        </div>
                    </DashboardSection>
                </motion.div>

                {/* ROW 3: CROP HEALTH & MARKET */}
                <motion.div variants={item} className="col-span-1 md:col-span-6 lg:col-span-6">
                    <DashboardSection title={t('crop_vision') || 'Crop Health'}>
                        <div data-tour="crop-health" className="h-full">
                            <Tilt className="w-full h-full" options={{ max: 8, scale: 1.01, speed: 300 }}>
                                <CropHealth />
                            </Tilt>
                        </div>
                    </DashboardSection>
                </motion.div>

                <motion.div variants={item} className="col-span-1 md:col-span-6 lg:col-span-6">
                    <DashboardSection title={t('market_intel') || 'Market Prices'}>
                        <div data-tour="market-prices" className="h-full">
                            <Tilt className="w-full h-full" options={{ max: 8, scale: 1.01, speed: 300 }}>
                                <MandiPrices />
                            </Tilt>
                        </div>
                    </DashboardSection>
                </motion.div>

                {/* ROW 4: WAREHOUSE SAFETY MONITORING */}
                <motion.div variants={item} className="col-span-1 md:col-span-6 lg:col-span-6 min-h-[350px]">
                    <DashboardSection title="Gas Monitoring">
                        <GasMonitoringCard />
                    </DashboardSection>
                </motion.div>

                <motion.div variants={item} className="col-span-1 md:col-span-6 lg:col-span-6 min-h-[350px]">
                    <DashboardSection title="Fire Detection">
                        <FireDetectionCard />
                    </DashboardSection>
                </motion.div>
            </motion.div>

            {/* AI Learning Progress Footer */}
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="mt-10 gov-card p-6"
            >
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div className="flex-shrink-0">
                        <h4 className="font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
                            <Activity size={18} className="text-organic-green" />
                            {t('ai_learning_progress') || 'AI Learning Progress'}
                        </h4>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{t('ai_learning_desc') || 'Your personalized model is improving.'}</p>
                    </div>

                    <div className="flex-1 w-full md:max-w-md">
                        <div className="flex justify-between text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">
                            <span>{t('day_1') || 'Day 1'}</span>
                            <span className="text-organic-green font-bold">Day 19 (65%)</span>
                            <span>{t('day_30') || 'Day 30'}</span>
                        </div>
                        <div className="gov-progress">
                            <div className="gov-progress-bar bg-gradient-to-r from-organic-green-600 to-organic-green-400" style={{ width: '65%' }} />
                        </div>
                    </div>

                    <button className="gov-btn-outline flex-shrink-0">
                        {t('view_analysis') || 'View Analysis'} <ArrowRight size={16} />
                    </button>
                </div>
            </motion.div>

            {/* ── Report Generation Modal ─────────────────────────── */}
            {showReportModal && (
                <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm"
                     onClick={(e) => e.target === e.currentTarget && setShowReportModal(false)}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.92, y: 24 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.92 }}
                        transition={{ type: 'spring', stiffness: 320, damping: 26 }}
                        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden"
                    >
                        {/* Modal Header */}
                        <div className="bg-[#6B46C1] px-6 py-4 flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <div className="bg-white/20 rounded-lg p-1.5">
                                    <FileText size={18} className="text-white" />
                                </div>
                                <div>
                                    <h2 className="text-white font-bold text-base leading-tight">Generate Soil Report</h2>
                                    <p className="text-violet-200 text-xs mt-0.5">
                                        Language: <strong className="text-white">
                                            {reportLang === 'en' ? '🇬🇧 English' : reportLang === 'hi' ? '🇮🇳 Hindi' : '🟠 Marathi'}
                                        </strong>
                                    </p>
                                </div>
                            </div>
                            <button onClick={() => setShowReportModal(false)}
                                    className="text-white/70 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Success State */}
                        {reportSuccess ? (
                            <div className="px-6 py-10 flex flex-col items-center justify-center gap-3">
                                <CheckCircle size={52} className="text-green-500" />
                                <p className="text-slate-800 dark:text-white font-semibold text-lg">Report Downloaded!</p>
                                <p className="text-slate-500 dark:text-slate-400 text-sm text-center">Your soil health PDF has been saved to your downloads.</p>
                            </div>
                        ) : (
                            <div className="px-6 py-5 space-y-4">
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    Fill in your farm details. Real-time soil sensor data will be automatically included.
                                </p>

                                {/* Farmer Name */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                        Farmer Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={farmerProfile.name}
                                        onChange={e => setFarmerProfile(p => ({ ...p, name: e.target.value }))}
                                        placeholder="Enter farmer name"
                                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 transition"
                                    />
                                </div>

                                {/* Farm Size */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                        Farm Size (Acres) <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={farmerProfile.farm_size}
                                        onChange={e => setFarmerProfile(p => ({ ...p, farm_size: e.target.value }))}
                                        placeholder="e.g. 2.5"
                                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 transition"
                                    />
                                </div>

                                {/* Soil Type */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                        Soil Type <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={farmerProfile.soil_type}
                                        onChange={e => setFarmerProfile(p => ({ ...p, soil_type: e.target.value }))}
                                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 transition"
                                    >
                                        {['Alluvial','Black (Regur)','Red','Laterite','Desert / Arid','Clay','Sandy','Loamy'].map(s => (
                                            <option key={s} value={s}>{s}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* GPS */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                        GPS Coordinates <span className="text-slate-400 text-xs">(optional)</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={farmerProfile.gps}
                                        onChange={e => setFarmerProfile(p => ({ ...p, gps: e.target.value }))}
                                        placeholder="e.g. 16.117°N  75.800°E"
                                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 transition"
                                    />
                                </div>

                                {/* Irrigation */}
                                <div className="flex items-center justify-between py-1">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                        Irrigation Available
                                    </label>
                                    <button
                                        onClick={() => setFarmerProfile(p => ({ ...p, irrigation_status: !p.irrigation_status }))}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${farmerProfile.irrigation_status ? 'bg-violet-600' : 'bg-slate-300 dark:bg-slate-600'}`}
                                    >
                                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${farmerProfile.irrigation_status ? 'translate-x-6' : 'translate-x-1'}`} />
                                    </button>
                                </div>

                                {/* Submit */}
                                <button
                                    onClick={handleGenerateReport}
                                    disabled={reportLoading}
                                    className="w-full flex items-center justify-center gap-2 py-3 mt-2 bg-[#6B46C1] hover:bg-[#5A38A3] active:bg-[#4A2D85] text-white font-semibold rounded-xl transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed shadow-lg"
                                >
                                    {reportLoading ? (
                                        <><Loader2 size={18} className="animate-spin" /> Generating PDF...</>
                                    ) : (
                                        <><FileText size={18} /> Generate &amp; Download PDF</>
                                    )}
                                </button>
                            </div>
                        )}
                    </motion.div>
                </div>
            )}

        </div>
    );
};

export default FarmerDashboard;
