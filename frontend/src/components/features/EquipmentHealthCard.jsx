import React from 'react';
import { motion } from 'framer-motion';
import {
    Wrench,
    AlertTriangle,
    CheckCircle,
    AlertCircle,
    Activity,
    Gauge,
    Info
} from 'lucide-react';

/**
 * EquipmentHealthCard Component
 * 
 * Displays the AI analysis results for equipment.
 * Features:
 * - Equipment identification
 * - Health score with color-coded indicator
 * - Condition status
 * - Issues list with severity
 * - Confidence percentage
 */

const EquipmentHealthCard = ({ analysis, isLoading = false }) => {
    if (isLoading) {
        return (
            <div className="glass-panel p-6 rounded-2xl animate-pulse">
                <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 bg-gray-300 dark:bg-gray-700 rounded-xl" />
                    <div className="flex-1">
                        <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-3/4 mb-2" />
                        <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-1/2" />
                    </div>
                </div>
                <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded-xl" />
            </div>
        );
    }

    if (!analysis) {
        return (
            <div className="glass-panel p-6 rounded-2xl text-center">
                <Wrench size={48} className="mx-auto text-slate-600 dark:text-gray-400 mb-4" />
                <p className="text-slate-500 dark:text-gray-500 dark:text-gray-400">
                    No analysis data available
                </p>
            </div>
        );
    }

    const {
        equipment_name,
        equipment_type,
        brand,
        model,
        health_score,
        condition,
        issues = [],
        summary,
        confidence,
        visual_damage_percentage,
        failure_risk,
        farmer_message,
        damage_severity,
        recommended_action,
        urgency_level,
        next_service_due_in_days
    } = analysis;

    // Health score color mapping
    const getHealthColor = (score) => {
        if (score >= 90) return { bg: 'bg-green-500', text: 'text-green-500', glow: 'shadow-green-500/50' };
        if (score >= 70) return { bg: 'bg-lime-500', text: 'text-lime-500', glow: 'shadow-lime-500/50' };
        if (score >= 50) return { bg: 'bg-yellow-500', text: 'text-yellow-500', glow: 'shadow-yellow-500/50' };
        if (score >= 30) return { bg: 'bg-orange-500', text: 'text-orange-500', glow: 'shadow-orange-500/50' };
        return { bg: 'bg-red-500', text: 'text-red-500', glow: 'shadow-red-500/50' };
    };

    const healthColors = getHealthColor(health_score);

    // Severity color mapping
    const getSeverityColor = (severity) => {
        switch (severity?.toLowerCase()) {
            case 'critical':
            case 'immediate':
                return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
            case 'high':
            case 'urgent':
                return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
            case 'medium':
            case 'soon':
                return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
            case 'low':
            case 'routine':
                return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
            default:
                return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-panel p-6 rounded-2xl relative overflow-hidden"
        >
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl ${healthColors.bg} ${healthColors.glow} shadow-lg text-white`}>
                        <Wrench size={28} />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                            {equipment_name || 'Equipment Analysis'}
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-gray-500 dark:text-gray-400">
                            {equipment_type} • {brand || 'Unknown Brand'}
                        </p>
                    </div>
                </div>

                {/* Confidence & Urgency */}
                <div className="flex flex-col items-end gap-2">
                    {confidence && (
                        <div className="flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                            <Activity size={14} className="text-blue-600 dark:text-blue-400" />
                            <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                                AI Confidence: {Math.round(confidence * 100)}%
                            </span>
                        </div>
                    )}
                    {urgency_level && (
                        <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${getSeverityColor(urgency_level)}`}>
                            {urgency_level} PRIORITY
                        </div>
                    )}
                </div>
            </div>

            {/* Recommended Action - NEW SECTION */}
            {recommended_action && (
                <div className="mb-6 p-4 bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-800 rounded-xl flex items-start gap-4">
                    <div className="p-2 bg-indigo-600 rounded-lg text-slate-900 dark:text-white mt-1">
                        <CheckCircle size={20} />
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-indigo-900 dark:text-indigo-300 uppercase tracking-widest mb-1">
                            Recommended Action
                        </h4>
                        <p className="text-indigo-800 dark:text-indigo-200 font-bold text-lg">
                            {recommended_action}
                        </p>
                        {next_service_due_in_days && (
                            <p className="text-xs text-indigo-500 dark:text-indigo-400 mt-2 font-medium">
                                Suggestion: Schedule next check-up in {next_service_due_in_days} days
                            </p>
                        )}
                    </div>
                </div>
            )}

            {/* farmer_message - Special Callout */}
            {farmer_message && (
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="mb-6 p-4 bg-organic-green/10 dark:bg-organic-green/5 border-l-4 border-organic-green rounded-r-xl"
                >
                    <p className="text-gray-800 dark:text-gray-200 italic font-medium">
                        "{farmer_message}"
                    </p>
                </motion.div>
            )}

            {/* Health Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {/* Health Score Circular Gauge */}
                <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl flex flex-col items-center justify-center">
                    <div className="relative mb-2">
                        <svg className="w-20 h-20 transform -rotate-90">
                            <circle cx="40" cy="40" r="34" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-gray-200 dark:text-gray-700" />
                            <motion.circle
                                cx="40" cy="40" r="34" stroke="currentColor" strokeWidth="6" fill="transparent" strokeLinecap="round"
                                className={healthColors.text}
                                initial={{ strokeDasharray: '0 213.6' }}
                                animate={{ strokeDasharray: `${(health_score / 100) * 213.6} 213.6` }}
                                transition={{ duration: 1 }}
                            />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className={`text-xl font-bold ${healthColors.text}`}>{health_score}%</span>
                        </div>
                    </div>
                    <span className="text-xs font-bold text-slate-500 dark:text-gray-500 uppercase">Health Score</span>
                </div>

                {/* Visual Damage % */}
                <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl flex flex-col items-center justify-center">
                    <div className="text-3xl font-bold text-orange-500 mb-1">
                        {visual_damage_percentage || 0}%
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden mb-2">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${visual_damage_percentage}%` }}
                            className="bg-orange-500 h-full"
                        />
                    </div>
                    <span className="text-xs font-bold text-slate-500 dark:text-gray-500 uppercase">Visual Damage</span>
                </div>

                {/* Failure Risk */}
                <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl flex flex-col items-center justify-center">
                    <div className={`text-xl font-bold mb-2 uppercase ${failure_risk?.toLowerCase() === 'high' ? 'text-red-500' :
                        failure_risk?.toLowerCase() === 'medium' ? 'text-yellow-500' : 'text-green-500'
                        }`}>
                        {failure_risk || 'Low'}
                    </div>
                    <span className="text-xs font-bold text-slate-500 dark:text-gray-500 uppercase">Failure Risk</span>
                </div>
            </div>

            {/* Summary & Issues */}
            <div className="space-y-6">
                <div>
                    <h4 className="text-xs font-bold text-slate-600 dark:text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                        <Gauge size={14} /> AI Diagnostic Summary
                    </h4>
                    <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                        {summary}
                    </p>
                </div>

                {issues.length > 0 && (
                    <div>
                        <h4 className="text-xs font-bold text-slate-600 dark:text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                            <AlertTriangle size={14} /> Critical Areas Detected
                        </h4>
                        <div className="grid grid-cols-1 gap-2">
                            {issues.map((issue, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    className="flex items-start gap-3 p-3 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg shadow-sm"
                                >
                                    <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${issue.severity?.toLowerCase() === 'critical' ? 'bg-red-500' : 'bg-yellow-500'
                                        }`} />
                                    <div className="flex-1">
                                        <div className="flex justify-between items-center mb-1">
                                            <p className="text-sm font-bold text-gray-800 dark:text-white">{issue.name}</p>
                                            <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${getSeverityColor(issue.severity)}`}>
                                                {issue.severity}
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-500 dark:text-gray-500 dark:text-gray-400">
                                            <span className="font-semibold text-slate-600 dark:text-gray-400 uppercase">{issue.affected_part}:</span> {issue.description}
                                        </p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                )}
                {/* No Issues */}
                {issues.length === 0 && (
                    <div className="text-center py-4">
                        <CheckCircle size={32} className="mx-auto text-green-500 mb-2" />
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            No issues detected! Equipment appears to be in good condition.
                        </p>
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export default EquipmentHealthCard;
