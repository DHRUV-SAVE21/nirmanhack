import React from 'react';
import { useTranslation } from 'react-i18next';
import { Tilt } from 'react-tilt';
import { FlaskConical, TrendingUp, Droplets, Leaf } from 'lucide-react';
import { motion } from 'framer-motion';

// Circular Gauge Component
const CircularGauge = ({ value, max, label, unit, color, status }) => {
    const percentage = Math.min((value / max) * 100, 100);
    const circumference = 2 * Math.PI * 40;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    const colorClasses = {
        green: { stroke: 'stroke-organic-green', text: 'text-organic-green', bg: 'bg-organic-green/10' },
        yellow: { stroke: 'stroke-amber-500', text: 'text-amber-500', bg: 'bg-amber-500/10' },
        red: { stroke: 'stroke-red-500', text: 'text-red-500', bg: 'bg-red-500/10' },
        blue: { stroke: 'stroke-blue-500', text: 'text-blue-500', bg: 'bg-blue-500/10' },
        gray: { stroke: 'stroke-slate-400', text: 'text-slate-400', bg: 'bg-slate-100 dark:bg-slate-800' }
    };

    const colors = colorClasses[color] || colorClasses.gray;

    return (
        <div className="flex flex-col items-center">
            <div className="relative w-[90px] h-[90px]">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    {/* Background circle */}
                    <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        strokeWidth="8"
                        className="stroke-slate-200 dark:stroke-slate-700"
                    />
                    {/* Progress circle */}
                    <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        strokeWidth="8"
                        strokeLinecap="round"
                        className={`${colors.stroke} transition-all duration-500`}
                        style={{
                            strokeDasharray: circumference,
                            strokeDashoffset: strokeDashoffset
                        }}
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className={`text-lg font-bold ${colors.text}`}>{value}</span>
                    <span className="text-[10px] text-slate-600 dark:text-slate-400">{unit}</span>
                </div>
            </div>
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-2">{label}</p>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full mt-1 ${colors.bg} ${colors.text}`}>
                {status}
            </span>
        </div>
    );
};

const SoilHealthCards = ({ sensorData }) => {
    const { t } = useTranslation();
    const {
        nitrogen = 0,
        phosphorus = 0,
        potassium = 0,
        ph = 0,
        soil_moisture = 0,
        last_updated
    } = sensorData || {};

    const lastTestText = last_updated
        ? `${t('dashboard.lastUpdate') || 'Last Update'}: ${new Date(last_updated).toLocaleTimeString()}`
        : t('dashboard.waitingForSensor') || 'Waiting for sensor...';

    const getStatus = (val, type) => {
        if (!sensorData) return { status: t('dashboard.syncing') || 'Syncing', color: 'gray' };

        if (type === 'ph') {
            if (val >= 6.0 && val <= 7.5) return { status: t('dashboard.optimal') || 'Optimal', color: 'green' };
            return { status: t('dashboard.attention') || 'Attention', color: 'yellow' };
        }

        if (val > 200) return { status: t('dashboard.high') || 'High', color: 'red' };
        if (val < 50) return { status: t('dashboard.low') || 'Low', color: 'yellow' };
        return { status: t('dashboard.optimal') || 'Optimal', color: 'green' };
    };

    const getMoistureStatus = (val) => {
        if (val < 20) return { status: t('dashboard.critical') || 'Critical', color: 'red' };
        if (val < 35) return { status: t('dashboard.low') || 'Low', color: 'yellow' };
        if (val > 80) return { status: t('dashboard.high') || 'High', color: 'blue' };
        return { status: t('dashboard.optimal') || 'Optimal', color: 'green' };
    };

    const moistureStatus = getMoistureStatus(soil_moisture);

    return (
        <Tilt className="w-full h-full" options={{ max: 8, scale: 1.01, speed: 300 }}>
            <div className="gov-card h-full flex flex-col overflow-hidden">
                {/* Header */}
                <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-500 rounded-lg">
                            <FlaskConical size={20} />
                        </div>
                        <div>
                            <h3 className="font-semibold text-slate-900 dark:text-white">{t('dashboard.soilNutrition') || 'Soil Nutrition'}</h3>
                            <p className="text-xs text-slate-500">{lastTestText}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-organic-green animate-pulse" />
                        <span className="text-xs font-medium text-organic-green">LIVE</span>
                    </div>
                </div>

                {/* Circular Gauges Grid */}
                <div className="flex-1 p-4">
                    <div className="grid grid-cols-4 gap-3">
                        <CircularGauge label="Nitrogen" value={nitrogen} max={300} unit="kg/ha" {...getStatus(nitrogen, 'n')} />
                        <CircularGauge label="Phosphorus" value={phosphorus} max={100} unit="kg/ha" {...getStatus(phosphorus, 'p')} />
                        <CircularGauge label="Potassium" value={potassium} max={150} unit="kg/ha" {...getStatus(potassium, 'k')} />
                        <CircularGauge label="pH Level" value={ph} max={14} unit="" {...getStatus(ph, 'ph')} />
                    </div>
                </div>

                {/* Moisture Level Footer */}
                <div className={`p-4 flex items-center justify-between ${moistureStatus.color === 'red' ? 'bg-red-50 dark:bg-red-900/10 border-t border-red-200 dark:border-red-900/30' : 'bg-blue-50 dark:bg-blue-900/10 border-t border-blue-200 dark:border-blue-900/30'}`}>
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${moistureStatus.color === 'red' ? 'bg-red-100 dark:bg-red-900/30 text-red-600' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600'}`}>
                            <Droplets size={20} />
                        </div>
                        <div>
                            <p className="text-xs font-medium text-slate-600 dark:text-slate-400">{t('dashboard.moistureLevel') || 'Soil Moisture'}</p>
                            <p className="text-lg font-bold text-slate-900 dark:text-white">{soil_moisture}%</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <span className={`gov-badge ${moistureStatus.color === 'green' ? 'gov-badge-success' : moistureStatus.color === 'yellow' ? 'gov-badge-warning' : moistureStatus.color === 'red' ? 'gov-badge-danger' : 'gov-badge-info'}`}>
                            {moistureStatus.status}
                        </span>
                    </div>
                </div>
            </div>
        </Tilt>
    );
};

export default SoilHealthCards;
