import React from 'react';
import { motion } from 'framer-motion';
import {
    BadgePercent,
    Building2,
    Landmark,
    ExternalLink,
    Users,
    Tractor,
    Calculator,
    ChevronRight
} from 'lucide-react';

/**
 * SubsidyInfo Component
 * 
 * Displays government subsidy information.
 * Features:
 * - Central and state subsidies
 * - Eligibility criteria
 * - Applicable equipment
 * - Application links
 */

const SubsidyInfo = ({ subsidies, isLoading = false }) => {
    if (isLoading) {
        return (
            <div className="glass-panel p-6 rounded-2xl animate-pulse">
                <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-1/2 mb-6" />
                <div className="space-y-4">
                    {[1, 2].map((i) => (
                        <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-xl" />
                    ))}
                </div>
            </div>
        );
    }

    if (!subsidies) {
        return (
            <div className="glass-panel p-6 rounded-2xl text-center">
                <BadgePercent size={48} className="mx-auto text-slate-600 dark:text-gray-400 mb-4" />
                <p className="text-slate-500 dark:text-gray-500 dark:text-gray-400">
                    No subsidy information available
                </p>
            </div>
        );
    }

    const { central_subsidies = [], state_subsidies = [], total_schemes } = subsidies;

    const SubsidyCard = ({ subsidy, type }) => {
        const searchQuery = [
            subsidy.scheme_name,
            subsidy.state,
            subsidy.source,
            'subsidy apply'
        ].filter(Boolean).join(' ');
        const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`;

        return (
            <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-xl"
            >
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                    {type === 'central' ? (
                        <Landmark size={18} className="text-green-600 dark:text-green-400" />
                    ) : (
                        <Building2 size={18} className="text-blue-600 dark:text-blue-400" />
                    )}
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${type === 'central'
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400'
                            : 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400'
                        }`}>
                        {type === 'central' ? 'Central Govt' : subsidy.state || 'State Govt'}
                    </span>
                </div>
                <div className="text-right">
                    <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {subsidy.subsidy_percentage}%
                    </span>
                    <p className="text-xs text-slate-500 dark:text-gray-500 dark:text-gray-400">subsidy</p>
                </div>
            </div>

            <h4 className="font-semibold text-gray-800 dark:text-white mb-2">
                {subsidy.scheme_name}
            </h4>

            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                {subsidy.description}
            </p>

            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-gray-500 dark:text-gray-400 mb-3">
                <Calculator size={14} />
                <span>Max: {subsidy.formatted_max_amount}</span>
            </div>

            {/* Eligibility */}
            {subsidy.eligibility && subsidy.eligibility.length > 0 && (
                <div className="mb-3">
                    <h5 className="text-xs font-semibold text-slate-500 dark:text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                        <Users size={12} />
                        Eligibility
                    </h5>
                    <div className="flex flex-wrap gap-1">
                        {subsidy.eligibility.slice(0, 3).map((item, idx) => (
                            <span
                                key={idx}
                                className="text-xs px-2 py-0.5 bg-white/50 dark:bg-gray-800/50 text-gray-700 dark:text-gray-300 rounded-full"
                            >
                                {item}
                            </span>
                        ))}
                        {subsidy.eligibility.length > 3 && (
                            <span className="text-xs text-slate-500 dark:text-gray-500 dark:text-gray-400">
                                +{subsidy.eligibility.length - 3} more
                            </span>
                        )}
                    </div>
                </div>
            )}

            {/* Applicable Equipment */}
            {subsidy.applicable_equipment && subsidy.applicable_equipment.length > 0 && (
                <div className="mb-3">
                    <h5 className="text-xs font-semibold text-slate-500 dark:text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                        <Tractor size={12} />
                        Applicable Equipment
                    </h5>
                    <div className="flex flex-wrap gap-1">
                        {subsidy.applicable_equipment.slice(0, 4).map((item, idx) => (
                            <span
                                key={idx}
                                className="text-xs px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full"
                            >
                                {item}
                            </span>
                        ))}
                        {subsidy.applicable_equipment.length > 4 && (
                            <span className="text-xs text-slate-500 dark:text-gray-500 dark:text-gray-400">
                                +{subsidy.applicable_equipment.length - 4} more
                            </span>
                        )}
                    </div>
                </div>
            )}

            {/* Apply Button */}
            {subsidy.application_url && (
                <a
                    href={subsidy.application_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-2 mt-3 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
                >
                    Apply Now
                    <ExternalLink size={14} />
                </a>
            )}
            <a
                href={searchUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center justify-center gap-2 w-full py-2 ${subsidy.application_url ? 'mt-2' : 'mt-3'} bg-white/80 dark:bg-gray-800/80 text-gray-700 dark:text-gray-200 text-sm font-medium rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-white dark:hover:bg-gray-800 transition-colors`}
            >
                Search Online
                <ExternalLink size={14} />
            </a>
        </motion.div>
        );
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-panel p-6 rounded-2xl"
        >
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-xl">
                    <BadgePercent size={24} className="text-green-600 dark:text-green-400" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-gray-800 dark:text-white">
                        Government Subsidies
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-gray-500 dark:text-gray-400">
                        {total_schemes} scheme{total_schemes !== 1 ? 's' : ''} available
                    </p>
                </div>
            </div>

            {/* Central Subsidies */}
            {central_subsidies.length > 0 && (
                <div className="mb-6">
                    <h4 className="text-xs font-semibold text-slate-500 dark:text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <Landmark size={14} />
                        Central Government Schemes
                    </h4>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {central_subsidies.map((subsidy, index) => (
                            <SubsidyCard key={index} subsidy={subsidy} type="central" />
                        ))}
                    </div>
                </div>
            )}

            {/* State Subsidies */}
            {state_subsidies.length > 0 && (
                <div>
                    <h4 className="text-xs font-semibold text-slate-500 dark:text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <Building2 size={14} />
                        State Government Schemes
                    </h4>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {state_subsidies.map((subsidy, index) => (
                            <SubsidyCard key={index} subsidy={subsidy} type="state" />
                        ))}
                    </div>
                </div>
            )}

            {/* No Subsidies */}
            {central_subsidies.length === 0 && state_subsidies.length === 0 && (
                <div className="text-center py-8">
                    <BadgePercent size={48} className="mx-auto text-slate-600 dark:text-gray-400 mb-4" />
                    <p className="text-slate-500 dark:text-gray-500 dark:text-gray-400">
                        No matching subsidy schemes found
                    </p>
                    <p className="text-sm text-slate-600 dark:text-gray-400 dark:text-gray-500 mt-2">
                        Try analyzing different equipment to find applicable schemes
                    </p>
                </div>
            )}
        </motion.div>
    );
};

export default SubsidyInfo;
