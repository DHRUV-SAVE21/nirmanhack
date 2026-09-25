import React from 'react';
import { FileText, MapPin, Percent, ArrowRight, ExternalLink, ShieldCheck } from 'lucide-react';

const SchemeCard = ({ scheme, onApply }) => {
    // Custom Badge Colors
    const getBadgeStyle = (category) => {
        if (category === 'Central Scheme') return 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-200/50';
        if (category === 'State Scheme' || category === 'Maharashtra') return 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-200/50';
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200/50';
    };

    return (
        <div className="group relative bg-white dark:bg-white/5 backdrop-blur-sm border border-slate-200 dark:border-white/10 rounded-2xl p-6 hover:shadow-2xl hover:shadow-organic-green/10 hover:border-organic-green/40 transition-all duration-300">
            {/* Top Row: Category & State */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex gap-2">
                    <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-md border ${getBadgeStyle(scheme.category)}`}>
                        {scheme.category || 'Scheme'}
                    </span>
                    {scheme.state && (
                        <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-md bg-amber-500/10 text-amber-600 border border-amber-200/50">
                            <MapPin size={10} className="inline mr-1 -mt-0.5" />
                            {scheme.state}
                        </span>
                    )}
                </div>
                <div className="text-slate-300 dark:text-white/10 group-hover:text-organic-green/50 transition-colors">
                    <ShieldCheck size={20} />
                </div>
            </div>

            {/* Scheme Title */}
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3 group-hover:text-organic-green transition-colors leading-tight min-h-[3.5rem] line-clamp-2">
                {scheme.scheme_name}
            </h3>

            {/* description */}
            <p className="text-sm text-slate-500 dark:text-gray-400 mb-6 line-clamp-3 leading-relaxed">
                {scheme.description}
            </p>

            {/* Benefit Grid */}
            <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-slate-50 dark:bg-black/20 rounded-xl p-3 border border-slate-100 dark:border-white/5">
                    <div className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1">Benefit</div>
                    <div className="text-organic-green text-lg font-black">{scheme.formatted_max_amount}</div>
                </div>
                <div className="bg-slate-50 dark:bg-black/20 rounded-xl p-3 border border-slate-100 dark:border-white/5">
                    <div className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1">Subsidy</div>
                    <div className="text-slate-900 dark:text-white text-lg font-black flex items-center">
                        <Percent size={14} className="mr-1 text-organic-green" />
                        {scheme.subsidy_percentage}%
                    </div>
                </div>
            </div>

            {/* Eligibility Highlights */}
            {scheme.eligibility && scheme.eligibility.length > 0 && (
                <div className="mb-6">
                    <div className="flex flex-wrap gap-2">
                        {scheme.eligibility.slice(0, 3).map((e, i) => (
                            <span key={i} className="text-[10px] font-medium text-slate-600 dark:text-gray-400 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 px-2 py-1 rounded-lg">
                                • {e}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col gap-3">
                <button
                    onClick={() => onApply(scheme)}
                    className="w-full bg-organic-green hover:bg-green-600 active:scale-95 text-white py-3 px-6 rounded-xl text-sm font-bold shadow-lg shadow-organic-green/20 transition-all flex items-center justify-center gap-2 group/btn"
                >
                    Apply with AI Assistant
                    <ArrowRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />
                </button>
                
                {scheme.application_url && (
                    <a
                        href={scheme.application_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full text-center py-2.5 hover:bg-slate-50 dark:hover:bg-white/5 text-slate-400 hover:text-organic-green text-xs font-bold tracking-widest uppercase transition-all flex items-center justify-center gap-2"
                    >
                        Visit Official Portal
                        <ExternalLink size={14} />
                    </a>
                )}
            </div>
            
            {/* Hover Decorator */}
            <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-organic-green to-transparent opacity-0 group-hover:opacity-60 transition-opacity rounded-b-2xl" />
        </div>
    );
};

export default SchemeCard;

