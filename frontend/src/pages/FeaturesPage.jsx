import React from 'react';
import { motion } from 'framer-motion';
import { Sprout, BarChart3, Scan, FlaskConical, BrainCircuit, ArrowUpRight } from 'lucide-react';

const features = [
    {
        id: 'recommendation',
        title: 'Crop Recommendation',
        desc: 'Advanced ML algorithms analyze your soil composition (NPK), pH levels, and local climate data to suggest the most profitable crops for your specific plot.',
        icon: Sprout,
        color: 'text-green-500',
        bg: 'bg-green-500/10'
    },
    {
        id: 'yield',
        title: 'Yield Prediction',
        desc: 'Forecast your harvest volume with precision using historical weather patterns and real-time crop health monitoring, enabling better market planning.',
        icon: BarChart3,
        color: 'text-yellow-500',
        bg: 'bg-yellow-500/10'
    },
    {
        id: 'disease',
        title: 'Disease Detection',
        desc: 'Instant visual diagnosis of crop diseases. Simply upload a photo of an affected leaf, and our Computer Vision model identifies the pathogen and suggests remedies.',
        icon: Scan,
        color: 'text-red-500',
        bg: 'bg-red-500/10'
    },
    {
        id: 'soil',
        title: 'Soil Analysis',
        desc: 'Digital twins of your soil health. Monitor nutrient degradation over time and receive precise fertilizer schedules to restore soil vitality.',
        icon: FlaskConical,
        color: 'text-brown-500',
        bg: 'bg-orange-500/10'
    },
    {
        id: 'insights',
        title: 'Smart Insights',
        desc: 'real-time advisory engine that connects weather alerts, market trends, and agronomy best practices into actionable daily tasks.',
        icon: BrainCircuit,
        color: 'text-blue-500',
        bg: 'bg-blue-500/10'
    }
];

const FeatureCard = ({ feature, index }) => (
    <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: index * 0.1, duration: 0.5 }}
        className="glass-panel p-8 flex flex-col h-full hover:bg-white/20 dark:hover:bg-white/5 transition-all duration-300 group border-t-2 border-transparent hover:border-organic-green"
    >
        <div className={`w-14 h-14 rounded-2xl ${feature.bg} flex items-center justify-center mb-6 transition-transform group-hover:scale-110`}>
            <feature.icon size={28} className={feature.color} />
        </div>

        <h3 className="text-2xl font-bold text-dark-navy dark:text-white mb-3">{feature.title}</h3>
        <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-6 flex-grow">{feature.desc}</p>

        <div className="flex items-center gap-2 text-organic-green font-semibold cursor-pointer group/link">
            <span>Explore Module</span>
            <ArrowUpRight size={18} className="transition-transform group-hover/link:translate-x-1 group-hover/link:-translate-y-1" />
        </div>
    </motion.div>
);

const FeaturesPage = () => {
    return (
        <div className="min-h-screen pt-32 pb-24 px-6 relative z-10 w-full max-w-7xl mx-auto">

            {/* Header Section */}
            <div className="text-center mb-20">
                <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="px-4 py-2 rounded-full bg-organic-green/10 text-organic-green-700 dark:text-organic-green font-bold text-sm uppercase tracking-wider mb-4 inline-block"
                >
                    Our Technology
                </motion.span>
                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-4xl md:text-6xl font-bold text-dark-navy dark:text-white mb-6"
                >
                    Intelligence for <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-organic-green to-teal-500">Every Acre</span>
                </motion.h1>
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-xl text-slate-500 dark:text-gray-500 dark:text-gray-400 max-w-2xl mx-auto"
                >
                    Leveraging AI, Computer Vision, and IoT to transform traditional farming into precise, data-driven agriculture.
                </motion.p>
            </div>

            {/* Grid Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {features.map((feature, index) => (
                    <FeatureCard key={feature.id} feature={feature} index={index} />
                ))}
            </div>

            {/* Bottom Call to Action */}
            <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                className="mt-24 p-12 rounded-3xl bg-gradient-to-r from-organic-green to-emerald-600 text-center relative overflow-hidden shadow-2xl"
            >
                <div className="relative z-10">
                    <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-6">Ready to Modernize Your Farm?</h2>
                    <p className="text-white/90 text-lg mb-8 max-w-2xl mx-auto">Join thousands of farmers using Annadata Saathi to reduce costs and increase yields.</p>
                    <button className="bg-white text-organic-green-700 hover:bg-gray-100 px-8 py-4 rounded-full font-bold text-lg transition-colors shadow-lg">
                        Get Started Now
                    </button>
                </div>
                {/* Decorative Circles */}
                <div className="absolute top-0 left-0 w-64 h-64 bg-slate-100 dark:bg-white/10 shadow-sm dark:shadow-none rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
                <div className="absolute bottom-0 right-0 w-96 h-96 bg-black/10 rounded-full blur-3xl translate-x-1/3 translate-y-1/3"></div>
            </motion.div>

        </div>
    );
};

export default FeaturesPage;
