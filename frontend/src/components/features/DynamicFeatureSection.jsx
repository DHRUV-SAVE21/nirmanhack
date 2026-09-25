import React, { useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Droplets, Sprout, CloudRain, ShoppingCart, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Tilt } from 'react-tilt';

// Moved features inside the component to use translation hook or use keys here and translate in component
const getFeatures = (t) => [
    {
        id: 'irrigation',
        title: t('smart_irrigation'),
        desc: t('smart_irrigation_card_desc'),
        icon: Droplets,
        color: 'from-blue-500 to-cyan-400',
        image: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?q=80&w=1000&auto=format&fit=crop',
        link: '/dashboard'
    },
    {
        id: 'fertilizer',
        title: t('fertilizer_ai'),
        desc: t('fertilizer_ai_desc'),
        icon: Sprout,
        color: 'from-yellow-500 to-orange-400',
        image: 'https://plus.unsplash.com/premium_photo-1661962692059-55d5a4319814?q=80&w=1000&auto=format&fit=crop',
        link: '/dashboard'
    },
    {
        id: 'weather',
        title: t('weather_intel'),
        desc: t('weather_intel_desc'),
        icon: CloudRain,
        color: 'from-sky-500 to-indigo-400',
        image: 'https://images.unsplash.com/photo-1590055531792-708d36353895?q=80&w=1000&auto=format&fit=crop',
        link: '/dashboard'
    },
    {
        id: 'mandi',
        title: t('mandi_prices'),
        desc: t('mandi_prices_desc'),
        icon: ShoppingCart,
        color: 'from-green-500 to-emerald-400',
        image: 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?q=80&w=1000&auto=format&fit=crop',
        link: '/mandi'
    }
];

// Memoized feature card component
const FeatureCard = React.memo(({ feature, index, activeTab, onTabChange }) => {
    const isActive = activeTab === index;

    return (
        <div
            onClick={() => onTabChange(index)}
            className={`p-6 rounded-2xl cursor-pointer transition-all border ${isActive
                ? 'bg-white/40 dark:bg-white/10 border-organic-green scale-105 shadow-[0_0_30px_rgba(34,197,94,0.1)]'
                : 'bg-transparent border-dark-navy/5 dark:border-white/5 hover:bg-white/50 dark:hover:bg-white/5'
                }`}
        >
            <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl bg-gradient-to-br ${feature.color} text-white shadow-lg`}>
                    <feature.icon size={24} />
                </div>
                <div className="flex-1">
                    <h3 className={`text-xl font-bold transition-colors ${isActive ? 'text-dark-navy dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
                        {feature.title}
                    </h3>
                    {isActive && (
                        <motion.p
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="text-gray-600 dark:text-gray-300 text-sm mt-2"
                        >
                            {feature.desc}
                        </motion.p>
                    )}
                </div>
                {isActive && (
                    <motion.div layoutId="arrow">
                        <ArrowRight className="text-organic-green-600 dark:text-organic-green" />
                    </motion.div>
                )}
            </div>
        </div>
    );
});

FeatureCard.displayName = 'FeatureCard';

const DynamicFeatureSection = () => {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState(0);
    const features = useMemo(() => getFeatures(t), [t]);

    const handleTabChange = useCallback((index) => {
        setActiveTab(index);
    }, []);

    const activeFeature = useMemo(() => features[activeTab], [activeTab]);

    const tiltOptions = useMemo(() => ({
        max: 15,
        scale: 1.02,
        speed: 400
    }), []);

    return (
        <section className="py-24 px-6 relative z-10 max-w-7xl mx-auto">
            <div className="text-center mb-16">
                <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-dark-navy to-gray-500 dark:from-white dark:to-gray-400 p-2">
                    {t('one_platform')} <span className="text-organic-green-600 dark:text-organic-green">{t('endless_possibilities')}</span>
                </h2>
                <p className="text-slate-500 dark:text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">{t('explore_modules')}</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                {/* Left: Interactive Tabs */}
                <div className="space-y-4">
                    {features.map((feature, index) => (
                        <FeatureCard
                            key={feature.id}
                            feature={feature}
                            index={index}
                            activeTab={activeTab}
                            onTabChange={handleTabChange}
                        />
                    ))}
                </div>

                {/* Right: Dynamic Visual (3D Tilt Card) */}
                <div className="h-[500px] relative">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, x: 50, rotateY: 20 }}
                            animate={{ opacity: 1, x: 0, rotateY: 0 }}
                            exit={{ opacity: 0, x: -50, rotateY: -20 }}
                            transition={{ duration: 0.5 }}
                            className="absolute inset-0"
                        >
                            <Tilt className="w-full h-full" options={tiltOptions}>
                                <div className="w-full h-full rounded-3xl overflow-hidden relative group border-2 border-white/20 dark:border-white/10 shadow-2xl">
                                    {/* Background Image */}
                                    <img
                                        src={activeFeature.image}
                                        alt={activeFeature.title}
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                        loading="lazy"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-dark-navy via-transparent to-transparent opacity-90" />

                                    {/* Floating Content */}
                                    <div className="absolute bottom-0 left-0 w-full p-8 translate-y-4 group-hover:translate-y-0 transition-transform">
                                        <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">{activeFeature.title}</h3>
                                        <p className="text-slate-700 dark:text-gray-300 mb-6">{activeFeature.desc}</p>
                                        <Link
                                            to={activeFeature.link}
                                            className="inline-flex items-center gap-2 px-6 py-3 bg-organic-green text-dark-navy font-bold rounded-xl hover:bg-organic-green-400 transition-colors"
                                        >
                                            {t('launch_module')} <ArrowRight size={18} />
                                        </Link>
                                    </div>
                                </div>
                            </Tilt>
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </section>
    );
};

export default DynamicFeatureSection;
