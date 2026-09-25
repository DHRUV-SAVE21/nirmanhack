import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Wrench,
    ChevronDown,
    ChevronUp,
    AlertTriangle,
    Clock,
    IndianRupee,
    Hammer,
    ChevronRight
} from 'lucide-react';

/**
 * RepairRecommendations Component
 * 
 * Simplified display of repair recommendations.
 * Shows quick summary by default, detailed steps on expand.
 */

const RepairRecommendations = ({ recommendations = [], isLoading = false }) => {
    const [expandedIndex, setExpandedIndex] = useState(null);

    if (isLoading) {
        return (
            <div className="glass-panel p-6 rounded-2xl animate-pulse">
                <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-1/2 mb-6" />
                <div className="space-y-3">
                    {[1, 2].map((i) => (
                        <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded-xl" />
                    ))}
                </div>
            </div>
        );
    }

    if (!recommendations || recommendations.length === 0) {
        return (
            <div className="glass-panel p-6 rounded-2xl text-center">
                <div className="w-16 h-16 mx-auto bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
                    <Wrench size={32} className="text-green-500" />
                </div>
                <p className="text-lg font-semibold text-gray-800 dark:text-white">
                    No Repairs Needed! ✨
                </p>
                <p className="text-sm text-slate-500 dark:text-gray-500 dark:text-gray-400 mt-1">
                    Your equipment is in good shape
                </p>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-panel p-6 rounded-2xl"
        >
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
                    <Hammer size={24} className="text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-gray-800 dark:text-white">
                        What Needs Fixing
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-gray-500 dark:text-gray-400">
                        {recommendations.length} thing{recommendations.length !== 1 ? 's' : ''} to fix
                    </p>
                </div>
            </div>

            {/* Simplified Recommendations List */}
            <div className="space-y-3">
                {recommendations.map((rec, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.1 }}
                        className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden"
                    >
                        {/* Summary Row - Always Visible */}
                        <button
                            onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
                            className="w-full p-4 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left"
                        >
                            {/* Top row: Badge + Issue Name + Chevron */}
                            <div className="flex items-center gap-3 mb-2">
                                {/* DIY vs Pro Badge */}
                                <span className={`flex-shrink-0 px-2 py-1 text-xs font-bold rounded-lg ${rec.repair_type === 'diy'
                                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                    : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                    }`}>
                                    {rec.repair_type === 'diy' ? 'DIY' : 'Pro'}
                                </span>

                                {/* Issue Name */}
                                <span className="font-semibold text-gray-800 dark:text-white flex-1">
                                    {rec.issue_name}
                                </span>

                                {/* Chevron */}
                                {expandedIndex === index ? (
                                    <ChevronUp size={18} className="text-slate-600 dark:text-gray-400 flex-shrink-0" />
                                ) : (
                                    <ChevronDown size={18} className="text-slate-600 dark:text-gray-400 flex-shrink-0" />
                                )}
                            </div>

                            {/* Bottom row: Time and Cost */}
                            <div className="flex items-center gap-4 text-sm">
                                <span className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                                    <Clock size={14} />
                                    {rec.estimated_time}
                                </span>
                                <span className="flex items-center gap-1 font-semibold text-organic-green">
                                    <IndianRupee size={14} />
                                    {rec.estimated_cost}
                                </span>
                            </div>
                        </button>

                        {/* Expanded Details */}
                        <AnimatePresence>
                            {expandedIndex === index && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="overflow-hidden"
                                >
                                    <div className="p-4 bg-white dark:bg-gray-900/50 space-y-4">
                                        {/* Steps - Simplified */}
                                        {rec.steps && rec.steps.length > 0 && (
                                            <div>
                                                <h5 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                                                    How to fix:
                                                </h5>
                                                <ol className="space-y-2">
                                                    {rec.steps.slice(0, 4).map((step, stepIndex) => (
                                                        <li
                                                            key={stepIndex}
                                                            className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400"
                                                        >
                                                            <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center bg-organic-green text-white rounded-full text-xs font-bold">
                                                                {stepIndex + 1}
                                                            </span>
                                                            <span>{step}</span>
                                                        </li>
                                                    ))}
                                                    {rec.steps.length > 4 && (
                                                        <li className="text-xs text-slate-500 dark:text-gray-500 pl-7">
                                                            +{rec.steps.length - 4} more steps
                                                        </li>
                                                    )}
                                                </ol>
                                            </div>
                                        )}

                                        {/* Tools & Parts - Compact */}
                                        <div className="flex flex-wrap gap-2">
                                            {rec.tools_required?.slice(0, 3).map((tool, i) => (
                                                <span key={i} className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-full">
                                                    🔧 {tool}
                                                </span>
                                            ))}
                                            {rec.parts_needed?.slice(0, 2).map((part, i) => (
                                                <span key={i} className="px-2 py-1 text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full">
                                                    📦 {part}
                                                </span>
                                            ))}
                                        </div>

                                        {/* Safety Warning - Simplified */}
                                        {rec.safety_warnings && rec.safety_warnings.length > 0 && (
                                            <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                                                <AlertTriangle size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
                                                <p className="text-sm text-amber-700 dark:text-amber-400">
                                                    {rec.safety_warnings[0]}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                ))}
            </div>
        </motion.div>
    );
};

export default RepairRecommendations;
