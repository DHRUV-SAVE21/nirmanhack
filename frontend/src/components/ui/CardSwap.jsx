import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const CardSwap = ({ services }) => {
    const [activeIndex, setActiveIndex] = useState(0);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            {/* Left Side - Service List */}
            <div className="space-y-4">
                {services.map((service, index) => (
                    <motion.button
                        key={index}
                        onClick={() => setActiveIndex(index)}
                        className={`w-full text-left p-6 rounded-2xl border-2 transition-all duration-300 ${
                            activeIndex === index
                                ? 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border-green-500 shadow-lg shadow-green-500/20'
                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-green-300 dark:hover:border-green-700'
                        }`}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <div className="flex items-start gap-4">
                            <div
                                className={`w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${
                                    activeIndex === index
                                        ? 'bg-green-500 text-white shadow-lg shadow-green-500/50'
                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                                }`}
                            >
                                <service.icon size={28} />
                            </div>
                            <div className="flex-1">
                                <h3
                                    className={`text-lg font-bold mb-2 transition-colors ${
                                        activeIndex === index
                                            ? 'text-green-600 dark:text-green-400'
                                            : 'text-slate-900 dark:text-white'
                                    }`}
                                >
                                    {service.title}
                                </h3>
                                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                                    {service.desc}
                                </p>
                            </div>
                            {activeIndex === index && (
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="flex-shrink-0"
                                >
                                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                                        <ArrowRight size={16} className="text-slate-900 dark:text-white" />
                                    </div>
                                </motion.div>
                            )}
                        </div>
                    </motion.button>
                ))}
            </div>

            {/* Right Side - Active Service Card */}
            <div className="relative h-[600px] lg:h-[700px]">
                <AnimatePresence mode="wait">
                    {(() => {
                        const ActiveIcon = services[activeIndex].icon;
                        const activeService = services[activeIndex];
                        
                        return (
                            <motion.div
                                key={activeIndex}
                                initial={{ opacity: 0, x: 50, rotateY: -15 }}
                                animate={{ opacity: 1, x: 0, rotateY: 0 }}
                                exit={{ opacity: 0, x: -50, rotateY: 15 }}
                                transition={{ duration: 0.5, ease: 'easeInOut' }}
                                className="absolute inset-0"
                            >
                                <Link
                                    to={activeService.link}
                                    className="block h-full group"
                                >
                                    <div className="relative h-full bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl overflow-hidden shadow-2xl border border-slate-700 hover:shadow-green-500/20 transition-all duration-300">
                                        {/* Background Image */}
                                        <div className="absolute inset-0">
                                            <img
                                                src={activeService.image}
                                                alt={activeService.title}
                                                className="w-full h-full object-cover opacity-40 group-hover:opacity-50 transition-opacity duration-300"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/80 to-transparent" />
                                        </div>

                                        {/* Content */}
                                        <div className="relative h-full flex flex-col justify-end p-8">
                                            {/* Icon Badge */}
                                            <div className="mb-6">
                                                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500 rounded-2xl shadow-lg shadow-green-500/50">
                                                    <ActiveIcon size={32} className="text-slate-900 dark:text-white" />
                                                </div>
                                            </div>

                                            {/* Title */}
                                            <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-4 group-hover:text-green-400 transition-colors">
                                                {activeService.title}
                                            </h2>

                                            {/* Description */}
                                            <p className="text-lg text-slate-700 dark:text-slate-300 mb-6 leading-relaxed">
                                                {activeService.desc}
                                            </p>

                                            {/* Features List */}
                                            <div className="space-y-2 mb-8">
                                                {activeService.features.map((feature, i) => (
                                                    <motion.div
                                                        key={i}
                                                        initial={{ opacity: 0, x: -20 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: i * 0.1 }}
                                                        className="flex items-center gap-3 text-slate-700 dark:text-slate-300"
                                                    >
                                                        <div className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                                                        <span className="text-sm">{feature}</span>
                                                    </motion.div>
                                                ))}
                                            </div>

                                            {/* CTA Button */}
                                            <div className="flex items-center gap-3 text-green-400 font-semibold group-hover:gap-4 transition-all">
                                                <span>Explore Feature</span>
                                                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                                            </div>
                                        </div>

                                        {/* Decorative Elements */}
                                        <div className="absolute top-8 right-8 w-32 h-32 bg-green-500/10 rounded-full blur-3xl" />
                                        <div className="absolute bottom-8 left-8 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl" />
                                    </div>
                                </Link>
                            </motion.div>
                        );
                    })()}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default CardSwap;
