import React from 'react';
import { useTranslation } from 'react-i18next';
import { Brain, TrendingUp, CloudRain, Flower2, ChevronRight, Sparkles } from 'lucide-react';
import { Tilt } from 'react-tilt';

const AIExplanationCard = () => {
    const { t } = useTranslation();

    const insights = [
        {
            icon: TrendingUp,
            iconColor: 'text-blue-500',
            iconBg: 'bg-blue-100 dark:bg-blue-900/30',
            text: t('dashboard.soilMoistureDropped') || 'Soil moisture dropped by',
            value: '12%',
            suffix: t('dashboard.sinceYesterday') || 'since yesterday'
        },
        {
            icon: CloudRain,
            iconColor: 'text-amber-500',
            iconBg: 'bg-amber-100 dark:bg-amber-900/30',
            text: t('dashboard.noRainForecast') || 'No rain forecast for next',
            value: '5',
            suffix: t('dashboard.days') || 'days'
        },
        {
            icon: Flower2,
            iconColor: 'text-purple-500',
            iconBg: 'bg-purple-100 dark:bg-purple-900/30',
            text: t('dashboard.cropInFlowering') || 'Crop is in',
            value: t('dashboard.floweringStage') || 'Flowering Stage',
            suffix: `(${t('dashboard.highWaterNeed') || 'High water need'})`
        }
    ];

    return (
        <Tilt className="w-full h-full" options={{ max: 8, scale: 1.01, speed: 300 }}>
            <div className="gov-card h-full flex flex-col overflow-hidden">
                {/* Header */}
                <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg">
                            <Brain size={20} />
                        </div>
                        <div>
                            <h3 className="font-semibold text-slate-900 dark:text-white">
                                {t('dashboard.whyThisDecision') || 'AI Insights'}
                            </h3>
                            <p className="text-xs text-slate-500">Explainable AI Analysis</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1 text-purple-600 dark:text-purple-400">
                        <Sparkles size={14} />
                        <span className="text-xs font-semibold">Powered by AI</span>
                    </div>
                </div>

                {/* Confidence Score */}
                <div className="p-4 bg-gradient-to-r from-organic-green/5 to-transparent dark:from-organic-green/10">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                            {t('dashboard.confidenceScore') || 'Decision Confidence'}
                        </span>
                        <span className="text-lg font-bold text-organic-green">92%</span>
                    </div>
                    <div className="gov-progress">
                        <div className="gov-progress-bar bg-gradient-to-r from-organic-green-600 to-organic-green-400" style={{ width: '92%' }} />
                    </div>
                </div>

                {/* Insights List */}
                <div className="flex-1 p-4 space-y-3">
                    {insights.map((item, i) => (
                        <div
                            key={i}
                            className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700"
                        >
                            <div className={`p-2 rounded-lg ${item.iconBg} ${item.iconColor} flex-shrink-0`}>
                                <item.icon size={16} />
                            </div>
                            <div className="flex-1 text-sm text-slate-600 dark:text-slate-300">
                                {item.text} <span className="font-bold text-slate-900 dark:text-white">{item.value}</span> {item.suffix}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer CTA */}
                <div className="p-3 border-t border-slate-100 dark:border-slate-800">
                    <button className="w-full flex items-center justify-center gap-2 py-2 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-organic-green transition-colors">
                        {t('dashboard.seeHistoricalData') || 'See Historical Data'}
                        <ChevronRight size={16} />
                    </button>
                </div>
            </div>
        </Tilt>
    );
};

export default AIExplanationCard;
