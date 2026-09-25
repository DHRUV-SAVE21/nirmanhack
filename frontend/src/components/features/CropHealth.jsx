import React from 'react';
import { useTranslation } from 'react-i18next';
import { Camera, Scan, Activity, ArrowRight, Leaf, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const CropHealth = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    return (
        <div
            onClick={() => navigate('/crop-health')}
            className="gov-card-interactive h-full flex flex-col cursor-pointer group overflow-hidden"
        >
            {/* Header */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-organic-green/10 rounded-lg text-organic-green">
                        <Leaf size={20} />
                    </div>
                    <div>
                        <h3 className="font-semibold text-slate-900 dark:text-white group-hover:text-organic-green transition-colors">
                            {t('crop_vision') || 'Crop Health'}
                        </h3>
                        <p className="text-xs text-slate-500">{t('ai_disease_detection') || 'AI Disease Detection'}</p>
                    </div>
                </div>
                <ArrowRight size={18} className="text-slate-600 dark:text-slate-400 group-hover:text-organic-green group-hover:translate-x-1 transition-all" />
            </div>

            {/* Camera Viewport */}
            <div className="flex-1 relative bg-slate-100 dark:bg-slate-800 m-4 rounded-xl overflow-hidden min-h-[160px]">
                <div
                    className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1625246333195-78d9c38ad449?q=80&w=1000&auto=format&fit=crop')] bg-cover bg-center opacity-70 dark:opacity-50 group-hover:scale-105 transition-transform duration-500"
                />

                {/* Scanner Overlay */}
                <div className="absolute inset-4 border-2 border-white/30 dark:border-white/20 rounded-lg">
                    <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-organic-green" />
                    <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-organic-green" />
                    <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-organic-green" />
                    <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-organic-green" />

                    {/* Scanning Line */}
                    <motion.div
                        animate={{ y: [0, 100, 0] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        className="w-full h-0.5 bg-gradient-to-r from-transparent via-organic-green to-transparent absolute shadow-lg shadow-organic-green/50"
                    />
                </div>

                {/* Center CTA */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="px-4 py-2 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-lg flex items-center gap-2 shadow-lg border border-slate-200 dark:border-slate-700 group-hover:border-organic-green group-hover:bg-organic-green group-hover:text-white transition-all">
                        <Camera size={16} className="group-hover:text-white" />
                        <span className="text-sm font-semibold">{t('scan_field') || 'Scan Field'}</span>
                    </div>
                </div>
            </div>

            {/* Stats Footer */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-4">
                <div>
                    <span className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                        {t('health_score') || 'Health Score'}
                    </span>
                    <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-bold text-organic-green">94</span>
                        <span className="text-sm text-organic-green">%</span>
                    </div>
                </div>
                <div className="text-right">
                    <span className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                        {t('status') || 'Status'}
                    </span>
                    <span className="gov-badge-success inline-flex items-center gap-1">
                        <CheckCircle size={12} />
                        {t('healthy') || 'Healthy'}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default CropHealth;
