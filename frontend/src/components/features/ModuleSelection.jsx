import React from 'react';
import { useTranslation } from 'react-i18next';
import { Droplets, Sprout, CloudRain, ShoppingCart, ArrowRight, Mic } from 'lucide-react';
import { Link } from 'react-router-dom';

const ModuleCard = ({ icon: Icon, title, desc, color, to }) => (
    <Link to={to} className="group relative overflow-hidden bg-white dark:bg-white/5 shadow-sm dark:shadow-none backdrop-blur-sm border border-slate-200 dark:border-white/10 p-6 rounded-2xl hover:bg-white/10 transition-all duration-300">
        <div className={`absolute top-0 left-0 w-1 h-full ${color}`} />
        <div className="flex items-center gap-4 mb-3">
            <div className={`p-3 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-white group-hover:bg-slate-200 dark:group-hover:bg-white/10 transition-colors`}>
                <Icon size={24} />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h3>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">{desc}</p>
        <div className={`flex items-center gap-2 text-xs font-bold uppercase tracking-wider ${color.replace('bg-', 'text-')} opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0`}>
            Launch Module <ArrowRight size={14} />
        </div>
    </Link>
);

const ModuleSelection = () => {
    const { t } = useTranslation();

    return (
        <section className="py-20 bg-slate-50 dark:bg-slate-950 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-20 pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-organic-green/10 rounded-full blur-[120px] pointer-events-none" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="text-center mb-16">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-white/5 shadow-sm dark:shadow-none border border-slate-200 dark:border-white/10 mb-6">
                        <span className="w-2 h-2 rounded-full bg-organic-green animate-pulse" />
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest">System Operational</span>
                    </div>
                    <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-6">
                        One Platform. <span className="text-organic-green">Endless Possibilities.</span>
                    </h2>
                    <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                        Explore integrated modules designed to transform every acre of your farm with AI-driven precision.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <ModuleCard
                        icon={Droplets}
                        title="Smart Irrigation"
                        desc="Automated water management based on real-time soil moisture levels."
                        color="bg-blue-500"
                        to="/dashboard"
                    />
                    <ModuleCard
                        icon={Sprout}
                        title="Fertilizer AI"
                        desc="Precision nutrient recommendations to maximize yield and minimize waste."
                        color="bg-amber-500"
                        to="/crop-health"
                    />
                    <ModuleCard
                        icon={CloudRain}
                        title="Weather Intel"
                        desc="Hyper-local forecasts and severe weather alerts for crop protection."
                        color="bg-sky-500"
                        to="/dashboard"
                    />
                    <ModuleCard
                        icon={ShoppingCart}
                        title="Mandi Prices"
                        desc="Live market rates and price trend analysis for informed selling."
                        color="bg-organic-green"
                        to="/dashboard"
                    />
                </div>
            </div>
        </section>
    );
};

export default ModuleSelection;
