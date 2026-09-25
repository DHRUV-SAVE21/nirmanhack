import React from 'react';
import { useTranslation } from 'react-i18next';
import { MapPin, Maximize2 } from 'lucide-react';
import { Tilt } from 'react-tilt';

const ZoneMap = () => {
    const { t } = useTranslation();

    const zones = [
        { id: 'A', status: 'good', color: 'organic-green', position: { top: '15%', left: '8%', width: '35%', height: '50%' } },
        { id: 'B', status: 'wet', color: 'blue', position: { top: '15%', right: '10%', width: '38%', height: '35%' } },
        { id: 'C', status: 'dry', color: 'amber', position: { bottom: '15%', right: '10%', width: '38%', height: '38%' }, pulse: true },
    ];

    const getStatusStyles = (color) => {
        const styles = {
            'organic-green': {
                bg: 'bg-organic-green/20 dark:bg-organic-green/30',
                border: 'border-organic-green',
                text: 'text-organic-green-700 dark:text-organic-green-400',
                hover: 'hover:bg-organic-green/30 dark:hover:bg-organic-green/40'
            },
            'blue': {
                bg: 'bg-blue-500/20 dark:bg-blue-500/30',
                border: 'border-blue-500',
                text: 'text-blue-600 dark:text-blue-400',
                hover: 'hover:bg-blue-500/30 dark:hover:bg-blue-500/40'
            },
            'amber': {
                bg: 'bg-amber-500/20 dark:bg-amber-500/30',
                border: 'border-amber-500',
                text: 'text-amber-600 dark:text-amber-400',
                hover: 'hover:bg-amber-500/30 dark:hover:bg-amber-500/40'
            }
        };
        return styles[color] || styles['organic-green'];
    };

    return (
        <Tilt className="w-full h-full" options={{ max: 8, scale: 1.01, speed: 300 }}>
            <div className="gov-card h-full flex flex-col overflow-hidden">
                {/* Header */}
                <div className="p-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <MapPin size={16} className="text-organic-green" />
                        <span className="text-sm font-semibold text-slate-900 dark:text-white">
                            {t('dashboard.yourFarm') || 'Your Farm'}
                        </span>
                    </div>
                    <span className="text-xs font-bold text-organic-green bg-organic-green/10 px-2 py-1 rounded-lg">
                        4.2 {t('dashboard.acres') || 'Acres'}
                    </span>
                </div>

                {/* Map Area */}
                <div className="flex-1 relative p-3">
                    <div className="w-full h-full bg-slate-100 dark:bg-slate-800 rounded-xl relative overflow-hidden min-h-[150px]">
                        {/* Grid Pattern */}
                        <div
                            className="absolute inset-0 opacity-30 dark:opacity-10"
                            style={{
                                backgroundImage: 'linear-gradient(#94a3b8 1px, transparent 1px), linear-gradient(90deg, #94a3b8 1px, transparent 1px)',
                                backgroundSize: '24px 24px'
                            }}
                        />

                        {/* Zones */}
                        {zones.map((zone) => {
                            const styles = getStatusStyles(zone.color);
                            return (
                                <div
                                    key={zone.id}
                                    className={`absolute ${styles.bg} ${styles.border} ${styles.hover} border-2 rounded-lg flex items-center justify-center cursor-pointer transition-all ${zone.pulse ? 'animate-pulse' : ''}`}
                                    style={zone.position}
                                >
                                    <div className="text-center">
                                        <span className={`font-bold text-sm ${styles.text}`}>
                                            {t(`dashboard.zone${zone.id}`) || `Zone ${zone.id}`}
                                        </span>
                                        <span className={`block text-[10px] ${styles.text} opacity-80`}>
                                            {t(`dashboard.${zone.status}`) || zone.status}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}

                        {/* Expand Button */}
                        <button className="absolute top-2 right-2 p-1.5 bg-white dark:bg-slate-700 rounded-lg shadow-sm border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors">
                            <Maximize2 size={14} className="text-slate-500" />
                        </button>
                    </div>
                </div>

                {/* Legend */}
                <div className="px-4 py-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-center gap-4 bg-slate-50 dark:bg-slate-800/50">
                    <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded bg-organic-green" />
                        <span className="text-[10px] font-medium text-slate-500">{t('dashboard.optimal') || 'Optimal'}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded bg-blue-500" />
                        <span className="text-[10px] font-medium text-slate-500">{t('dashboard.wet') || 'Wet'}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded bg-amber-500" />
                        <span className="text-[10px] font-medium text-slate-500">{t('dashboard.dry') || 'Dry'}</span>
                    </div>
                </div>
            </div>
        </Tilt>
    );
};

export default ZoneMap;
