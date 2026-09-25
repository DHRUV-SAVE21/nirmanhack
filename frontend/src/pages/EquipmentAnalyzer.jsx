import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
    Camera,
    Upload,
    Scan,
    ArrowLeft,
    Loader2,
    Wrench,
    AlertCircle,
    Sparkles,
    History,
    RefreshCw,
    CalendarDays,
    ShoppingBag
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { speakText } from '../utils/voiceUtils';
import { useLanguageStore } from '../store/themeStore';

// Components
import CameraCapture from '../components/features/CameraCapture';
import ImageUploader from '../components/features/ImageUploader';
import EquipmentHealthCard from '../components/features/EquipmentHealthCard';
import MaintenanceScheduleCard from '../components/features/MaintenanceScheduleCard';
import MaintenanceChart from '../components/features/MaintenanceChart';
import RepairRecommendations from '../components/features/RepairRecommendations';
import NearbyShops from '../components/features/NearbyShops';
import SubsidyInfo from '../components/features/SubsidyInfo';

// Store
import { useEquipmentStore } from '../store/equipmentStore';

/**
 * EquipmentAnalyzer Page
 * 
 * Main page for the multi-agent equipment analysis system.
 * Features:
 * - Camera capture / Image upload
 * - AI-powered analysis
 * - Maintenance scheduling
 * - Repair recommendations
 * - Price comparison for parts
 * - Government subsidy information
 */

const EquipmentAnalyzer = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('upload'); // 'upload' | 'camera'
    const [userLocation, setUserLocation] = useState(null);
    const [lastMaintenanceDate, setLastMaintenanceDate] = useState('');

    React.useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setUserLocation([position.coords.latitude, position.coords.longitude]);
                },
                (error) => {
                    console.error("Error getting location:", error);
                }
            );
        }
    }, [isCameraOpen]); // Re-check when camera opens or just once on mount (empty dep array is better usually, but react sometimes needs triggers)


    // Store state
    const {
        capturedImage,
        imageSource,
        analysisResult,
        isAnalyzing,
        analysisError,
        maintenanceSchedule,
        repairRecommendations,
        damagedParts,
        nearbyShops,
        isShopsLoading,
        findNearbyShops,
        subsidies,
        analyzeEquipment,
        clearImage,
        reset
    } = useEquipmentStore();

    const [equipmentMetadata, setEquipmentMetadata] = useState({
        equipmentType: 'Tractor',
        ageDays: '',
        usageHours: '',
        environment: 'normal',
        repairCost: '',
        replacementCost: ''
    });

    const handleAnalyze = async () => {
        await analyzeEquipment({
            ...equipmentMetadata,
            lastServiceDate: lastMaintenanceDate
        });
    };

    const handleMetadataChange = (e) => {
        const { name, value } = e.target;
        setEquipmentMetadata(prev => ({ ...prev, [name]: value }));
    };

    // Trigger shop search when analysis completes
    React.useEffect(() => {
        if (analysisResult) {
            // Use current location or default to India center
            const lat = userLocation ? userLocation[0] : 20.5937;
            const lng = userLocation ? userLocation[1] : 78.9629;
            const partName = damagedParts.length > 0
                ? damagedParts[0].part_name
                : (analysisResult.equipment_type || 'farm equipment parts');
            findNearbyShops(lat, lng, partName);

            // Audio feedback for equipment health
            const feedback = `आपका ${analysisResult.equipment_type} विश्लेषण पूरा हो गया है। स्वास्थ्य स्कोर ${analysisResult.health_score} है और स्थिति ${analysisResult.condition} है।`;
            speakText(feedback, 'hi');
        }
    }, [analysisResult, userLocation, findNearbyShops]);

    const handleReset = () => {
        reset();
    };

    return (
        <div data-tour="equipment-main" className="min-h-screen pt-24 px-4 pb-12 max-w-7xl mx-auto z-10 relative">
            {/* Camera Modal */}
            <CameraCapture
                isOpen={isCameraOpen}
                onClose={() => setIsCameraOpen(false)}
            />

            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    >
                        <ArrowLeft size={24} className="text-gray-600 dark:text-gray-400" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                            <Wrench className="text-organic-green" />
                            {t('equipment_analyzer_title')}
                        </h1>
                        <p className="text-slate-500 dark:text-gray-500 dark:text-gray-400 mt-1">
                            {t('equipment_analyzer_subtitle')}
                        </p>
                    </div>
                </div>

                {/* Reset Button */}
                {(capturedImage || analysisResult) && (
                    <motion.button
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        onClick={handleReset}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg text-gray-700 dark:text-gray-300 transition-colors"
                    >
                        <RefreshCw size={18} />
                        {t('new_analysis')}
                    </motion.button>
                )}
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Image Input & Analysis */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Image Input Section */}
                    {!analysisResult && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="glass-panel p-6 rounded-2xl"
                        >
                            <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                                <Scan className="text-organic-green" size={20} />
                                {t('capture_equipment')}
                            </h2>

                            {/* Tab Buttons */}
                            <div className="flex gap-2 mb-6">
                                <button
                                    onClick={() => setActiveTab('upload')}
                                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-all ${activeTab === 'upload'
                                        ? 'bg-organic-green text-white shadow-lg'
                                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                                        }`}
                                >
                                    <Upload size={18} />
                                    {t('upload')}
                                </button>
                                <button
                                    onClick={() => setActiveTab('camera')}
                                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-all ${activeTab === 'camera'
                                        ? 'bg-organic-green text-white shadow-lg'
                                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                                        }`}
                                >
                                    <Camera size={18} />
                                    {t('camera')}
                                </button>
                            </div>

                            {/* Upload or Camera Preview */}
                            {activeTab === 'upload' && (
                                <ImageUploader />
                            )}

                            {activeTab === 'camera' && (
                                <div className="space-y-4">
                                    {capturedImage && imageSource === 'camera' ? (
                                        <div className="relative rounded-2xl overflow-hidden">
                                            <img
                                                src={capturedImage}
                                                alt="Captured equipment"
                                                className="w-full h-64 object-cover"
                                            />
                                            <button
                                                onClick={clearImage}
                                                className="absolute top-3 right-3 p-2 bg-red-500 hover:bg-red-600 rounded-full text-white shadow-lg transition-colors"
                                            >
                                                <RefreshCw size={18} />
                                            </button>
                                        </div>
                                    ) : (
                                        <motion.button
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => setIsCameraOpen(true)}
                                            className="w-full py-16 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-2xl hover:border-organic-green hover:bg-organic-green/5 transition-all"
                                        >
                                            <Camera size={48} className="mx-auto text-slate-600 dark:text-gray-400 mb-4" />
                                            <p className="text-gray-600 dark:text-gray-400 font-medium">
                                                {t('click_open_camera')}
                                            </p>
                                        </motion.button>
                                    )}
                                </div>
                            )}

                            {/* Equipment Metadata Form */}
                            {capturedImage && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    className="mt-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl space-y-4 border border-gray-200 dark:border-gray-700"
                                >
                                    <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                        <Wrench size={16} />
                                        {t('equipment_details')}
                                    </h3>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <label className="text-xs font-semibold text-slate-500 dark:text-gray-500 uppercase tracking-wider">{t('type')}</label>
                                            <select
                                                name="equipmentType"
                                                value={equipmentMetadata.equipmentType}
                                                onChange={handleMetadataChange}
                                                className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
                                            >
                                                <option value="Tractor">Tractor</option>
                                                <option value="Rotavator">Rotavator</option>
                                                <option value="Power Tiller">Power Tiller</option>
                                                <option value="Pump Set">Pump Set</option>
                                                <option value="Thresher">Thresher</option>
                                                <option value="Sprayer">Sprayer</option>
                                            </select>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-semibold text-slate-500 dark:text-gray-500 uppercase tracking-wider">{t('environment')}</label>
                                            <select
                                                name="environment"
                                                value={equipmentMetadata.environment}
                                                onChange={handleMetadataChange}
                                                className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
                                            >
                                                <option value="normal">Normal</option>
                                                <option value="dusty">Dusty</option>
                                                <option value="wet">Wet/Muddy</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <label className="text-xs font-semibold text-slate-500 dark:text-gray-500 uppercase tracking-wider">{t('age_days')}</label>
                                            <input
                                                type="number"
                                                name="ageDays"
                                                placeholder="e.g. 500"
                                                value={equipmentMetadata.ageDays}
                                                onChange={handleMetadataChange}
                                                className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-semibold text-slate-500 dark:text-gray-500 uppercase tracking-wider">{t('usage_hours')}</label>
                                            <input
                                                type="number"
                                                name="usageHours"
                                                placeholder="e.g. 1200"
                                                value={equipmentMetadata.usageHours}
                                                onChange={handleMetadataChange}
                                                className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-slate-500 dark:text-gray-500 uppercase tracking-wider">{t('last_service_date')}</label>
                                        <input
                                            type="date"
                                            value={lastMaintenanceDate}
                                            onChange={(e) => setLastMaintenanceDate(e.target.value)}
                                            max={new Date().toISOString().split('T')[0]}
                                            className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <label className="text-xs font-semibold text-slate-500 dark:text-gray-500 uppercase tracking-wider">{t('repair_cost_est')}</label>
                                            <input
                                                type="number"
                                                name="repairCost"
                                                placeholder="₹"
                                                value={equipmentMetadata.repairCost}
                                                onChange={handleMetadataChange}
                                                className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-semibold text-slate-500 dark:text-gray-500 uppercase tracking-wider">{t('replace_cost_est')}</label>
                                            <input
                                                type="number"
                                                name="replacementCost"
                                                placeholder="₹"
                                                value={equipmentMetadata.replacementCost}
                                                onChange={handleMetadataChange}
                                                className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
                                            />
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {/* Analyze Button */}
                            {capturedImage && (
                                <motion.button
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={handleAnalyze}
                                    disabled={isAnalyzing}
                                    className="w-full mt-4 py-4 bg-gradient-to-r from-organic-green to-emerald-500 hover:from-organic-green-600 hover:to-emerald-600 text-white font-bold rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 transition-all"
                                >
                                    {isAnalyzing ? (
                                        <>
                                            <Loader2 size={22} className="animate-spin" />
                                            {t('analyzing')}
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles size={22} />
                                            {t('analyze_equipment')}
                                        </>
                                    )}
                                </motion.button>
                            )}

                            {/* Error Message */}
                            {analysisError && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl"
                                >
                                    <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                                        <AlertCircle size={18} />
                                        <span className="font-medium">{t('analysis_failed')}</span>
                                    </div>
                                    <p className="text-sm text-red-500 dark:text-red-400 mt-1">
                                        {analysisError}
                                    </p>
                                </motion.div>
                            )}
                        </motion.div>
                    )}

                    {/* Equipment Health Card */}
                    <EquipmentHealthCard
                        analysis={analysisResult}
                        isLoading={isAnalyzing}
                    />

                    {/* Analyzed Image Preview (when analysis is done) */}
                    {analysisResult && capturedImage && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="glass-panel p-4 rounded-2xl"
                        >
                            <h3 className="text-sm font-semibold text-slate-500 dark:text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                                {t('analyzed_image')}
                            </h3>
                            <img
                                src={capturedImage}
                                alt="Analyzed equipment"
                                className="w-full h-48 object-cover rounded-xl"
                            />
                        </motion.div>
                    )}
                </div>

                {/* Right Column - Results */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Loading State */}
                    {isAnalyzing && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="glass-panel p-12 rounded-2xl text-center"
                        >
                            <div className="relative w-24 h-24 mx-auto mb-6">
                                <div className="absolute inset-0 border-4 border-organic-green/20 rounded-full" />
                                <div className="absolute inset-0 border-4 border-organic-green border-t-transparent rounded-full animate-spin" />
                                <Wrench size={32} className="absolute inset-0 m-auto text-organic-green" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
                                {t('analyzing_title')}
                            </h3>
                            <p className="text-slate-500 dark:text-gray-500 dark:text-gray-400">
                                {t('analyzing_desc')}
                            </p>
                            <div className="mt-6 space-y-2 text-sm text-slate-500 dark:text-gray-500 dark:text-gray-400">
                                <p className="flex items-center justify-center gap-2">
                                    <Loader2 size={14} className="animate-spin" />
                                    {t('identifying_type')}
                                </p>
                            </div>
                        </motion.div>
                    )}

                    {/* No Analysis State */}
                    {!analysisResult && !isAnalyzing && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="glass-panel p-12 rounded-2xl text-center"
                        >
                            <Wrench size={64} className="mx-auto text-slate-700 dark:text-gray-300 dark:text-gray-600 mb-6" />
                            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
                                {t('ready_to_analyze')}
                            </h3>
                            <p className="text-slate-500 dark:text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                                {t('upload_instruction')}
                            </p>
                            <div className="mt-6 grid grid-cols-2 gap-4 max-w-lg mx-auto">
                                {[
                                    t('health_assessment'),
                                    t('maintenance_schedule'),
                                    t('repair_guide'),
                                    t('part_prices'),
                                    t('subsidy_info'),
                                    t('expert_tips')
                                ].map((feature, idx) => (
                                    <div
                                        key={idx}
                                        className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400"
                                    >
                                        <span className="w-2 h-2 bg-organic-green rounded-full" />
                                        {feature}
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* Results Grid */}
                    {analysisResult && !isAnalyzing && (
                        <div className="space-y-6">
                            {/* Maintenance Chart - Only show if equipment is NOT critical */}
                            {analysisResult.health_score >= 30 &&
                                !['critical', 'poor'].includes(analysisResult.condition?.toLowerCase()) && (
                                    <MaintenanceChart
                                        lastMaintenanceDate={lastMaintenanceDate}
                                        maintenanceSchedule={maintenanceSchedule}
                                    />
                                )}

                            {/* Warning if equipment is critical */}
                            {(analysisResult.health_score < 30 ||
                                ['critical', 'poor'].includes(analysisResult.condition?.toLowerCase())) && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl"
                                    >
                                        <div className="flex items-center gap-3">
                                            <AlertCircle className="text-red-500" size={24} />
                                            <div>
                                                <h4 className="font-bold text-red-700 dark:text-red-400">
                                                    {t('immediate_repair_title')}
                                                </h4>
                                                <p className="text-sm text-red-600 dark:text-red-300">
                                                    {t('immediate_repair_desc')}
                                                </p>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}

                            {/* Marketplace Integration - Agentic AI Cart */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-gradient-to-br from-indigo-900/40 to-slate-900 p-6 rounded-2xl border border-indigo-500/30 shadow-lg relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl"></div>

                                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-3 relative z-10">
                                    <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-400">
                                        <ShoppingBag size={24} />
                                    </div>
                                    {t('recommended_parts')}
                                </h3>

                                <div className="space-y-6 relative z-10">
                                    <p className="text-sm text-slate-600 dark:text-gray-400">
                                        {t('agent_cart_desc')}
                                    </p>

                                    {/* Real Marketplace Recommendations */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {useEquipmentStore.getState().marketplaceRecommendations && useEquipmentStore.getState().marketplaceRecommendations.length > 0 ? (
                                            useEquipmentStore.getState().marketplaceRecommendations.map((product) => (
                                                <div key={product.id} className="bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl p-3 flex gap-3 hover:border-indigo-500/50 transition-all">
                                                    <img
                                                        src={product.image || 'https://placehold.co/100x100?text=Part'}
                                                        alt={product.name}
                                                        className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                                                    />
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="text-slate-900 dark:text-white font-bold text-sm truncate">{product.name}</h4>
                                                        <p className="text-indigo-400 font-bold text-sm">₹{product.price}</p>
                                                        <p className="text-slate-500 dark:text-gray-500 text-xs line-clamp-1 mt-1">{product.description}</p>
                                                        <button
                                                            onClick={() => window.open(`https://farmer-mart-drab.vercel.app/cart?items=${encodeURIComponent(product.name)}:1:${product.price}`, '_blank')}
                                                            className="mt-2 text-xs bg-indigo-600 hover:bg-indigo-500 text-slate-900 dark:text-white px-3 py-1 rounded-md font-bold transition-colors"
                                                        >
                                                            {t('buy_now')}
                                                        </button>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="col-span-2 bg-black/20 rounded-xl p-4 border border-slate-200 dark:border-white/5 space-y-2">
                                                {damagedParts.length > 0 ? (
                                                    damagedParts.map((part, idx) => (
                                                        <div key={idx} className="flex items-center justify-between text-sm">
                                                            <span className="text-slate-900 dark:text-white font-medium flex items-center gap-2">
                                                                <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full"></span>
                                                                {part.part_name}
                                                            </span>
                                                            <span className={`text-xs px-2 py-0.5 rounded ${part.urgency === 'immediate' ? 'bg-red-500/20 text-red-400' :
                                                                part.urgency === 'soon' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-green-500/20 text-green-400'
                                                                }`}>
                                                                {part.urgency}
                                                            </span>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-gray-400">
                                                        <span className="w-1.5 h-1.5 bg-gray-500 rounded-full"></span>
                                                        {t('maintenance_kit')} {analysisResult?.equipment_type}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* General Order Button */}
                                    <button
                                        onClick={() => {
                                            const recs = useEquipmentStore.getState().marketplaceRecommendations;
                                            if (recs && recs.length > 0) {
                                                const items = recs.map(p => `${encodeURIComponent(p.name)}:1:${p.price}`).join(',');
                                                window.open(`https://farmer-mart-drab.vercel.app/cart?items=${items}`, '_blank');
                                            } else {
                                                const items = damagedParts.length > 0
                                                    ? damagedParts.map(p => p.part_name)
                                                    : [`Maintenance Kit for ${analysisResult.equipment_type}`];
                                                const query = items.map(i => `${encodeURIComponent(i)}:1:500`).join(',');
                                                window.open(`https://farmer-mart-drab.vercel.app/cart?items=${query}`, '_blank');
                                            }
                                        }}
                                        className="w-full py-4 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-900/20 flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02]"
                                    >
                                        <ShoppingBag size={20} />
                                        {t('order_all_parts')}
                                    </button>
                                </div>
                            </motion.div>

                            {/* Repair Recommendations */}
                            <RepairRecommendations
                                recommendations={repairRecommendations}
                            />

                            {/* Nearby Shops Map - Always show when analysis is complete */}
                            <NearbyShops
                                shops={nearbyShops}
                                isLoading={isShopsLoading}
                                userLocation={userLocation}
                            />

                            {/* Subsidy Information */}
                            <SubsidyInfo
                                subsidies={subsidies}
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EquipmentAnalyzer;
