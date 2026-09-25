import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import SplitText from '../components/react-bits/SplitText';
import {
    Sprout, Tractor, LineChart,
    Phone, ArrowRight, UserCheck,
    FileText, Activity, MapPin, Shield, Zap, Users, TrendingUp, Sun, CheckCircle, Camera, CloudSun
} from 'lucide-react';
import AnimatedContent from '../components/react-bits/AnimatedContent';

const HeroSection = () => {
    const { t } = useTranslation();
    
    const handleAnimationComplete = () => {
        // Callback functionality if needed
    };

    return (
        <section className="relative min-h-[100vh] flex items-center overflow-hidden">
            {/* Hero Background Image */}
            <div className="absolute inset-0">
                <img
                    src="/assets/landing.jpg"
                    alt="Farm field with crops"
                    className="w-full h-full object-cover"
                />
                {/* Dark Overlay for text readability */}
                <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/70 to-slate-950/50" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />
            </div>

            {/* Content */}
            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
                <motion.div
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.7 }}
                    className="text-center lg:text-left max-w-3xl"
                >
                    <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold text-white mb-6 leading-tight tracking-tight">
                        
                        <SplitText
                                text="Your Land."
                                className="text-4xl sm:text-5xl lg:text-7xl font-bold !text-white"
                                delay={40}
                                duration={0.8}
                                ease="power3.out"
                                from={{ opacity: 0, y: 30 }}
                                to={{ opacity: 1, y: 0 }}
                                threshold={0.1}
                                textAlign="left"
                                onLetterAnimationComplete={handleAnimationComplete}
                            />
                        
                        <br />
                        <span className="text-green-400 block sm:inline">
                            <SplitText
                                text="Your Legacy."
                                className="text-4xl sm:text-5xl lg:text-7xl font-bold !text-green-400"
                                delay={40}
                                duration={0.8}
                                ease="power3.out"
                                from={{ opacity: 0, y: 30 }}
                                to={{ opacity: 1, y: 0 }}
                                threshold={0.1}
                                textAlign="left"
                                onLetterAnimationComplete={handleAnimationComplete}
                            />
                        </span>
                    </h1>

                    <p className="text-lg sm:text-xl text-white mb-10 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                        Connect with the land that feeds millions. Smart farming tools built for Indian farmers, by farmers who understand your soil.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
                        <Link
                            to="/auth"
                            className="group"
                        >
                            <Button as="span" className="w-full sm:w-auto">
                                {t('get_started') || "Get Started"}
                                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                            </Button>
                        </Link>
                    </div>
                </motion.div>
            </div>
        </section>
    );
};

import CardSwap from '../components/ui/CardSwap';

const ServicesGrid = () => {
    const { t } = useTranslation();

    const services = [
        {
            icon: Sprout,
            title: "Crop Health Monitor",
            desc: "AI-powered disease detection using computer vision. Upload crop images and get instant diagnosis with treatment recommendations.",
            link: "/crop-health",
            image: "/assets/leaf-image.webp",
            features: [
                "Real-time disease detection",
                "Treatment recommendations",
                "Pest identification",
                "Growth tracking"
            ]
        },
        {
            icon: FileText,
            title: "Government Schemes",
            desc: "Access PM-KISAN, PMFBY, and other agricultural schemes. Apply online with guided assistance and track your application status.",
            link: "/schemes",
            image: "/assets/farmer-crop-scan.jpg.png",
            features: [
                "PM-KISAN direct benefits",
                "Crop insurance (PMFBY)",
                "Subsidy applications",
                "Status tracking"
            ]
        },
        {
            icon: Activity,
            title: "IoT Sensor Dashboard",
            desc: "Real-time monitoring of NPK levels, soil moisture, pH, and temperature from your field sensors with AI-driven insights.",
            link: "/dashboard",
            image: "/assets/iot-testing.png",
            features: [
                "NPK level monitoring",
                "Soil moisture tracking",
                "pH & temperature data",
                "Automated alerts"
            ]
        },
        {
            icon: LineChart,
            title: "Market Intelligence",
            desc: "Live mandi prices from across India with AI-powered price predictions. Know the best time to sell your produce.",
            link: "/dashboard",
            image: "/assets/Market.png",
            features: [
                "Live mandi prices",
                "Price predictions",
                "Market trends",
                "Best selling time"
            ]
        },
        {
            icon: Tractor,
            title: "Crop Insurance",
            desc: "Quick insurance claims with satellite-based crop damage verification. Get compensated faster with automated processing.",
            link: "/schemes",
            image: "/assets/leaf-image.webp",
            features: [
                "Satellite verification",
                "Quick claim processing",
                "Damage assessment",
                "Automated compensation"
            ]
        },
        {
            icon: MapPin,
            title: "Smart Farm Mapping",
            desc: "Zone-wise farm management with intelligent irrigation scheduling. Optimize water usage and increase yield efficiency.",
            link: "/dashboard",
            image: "/assets/smart_irrigation.png",
            features: [
                "Zone mapping",
                "Irrigation scheduling",
                "Water optimization",
                "Yield tracking"
            ]
        }
    ];

    return (
        <section className="py-20 bg-slate-50 dark:bg-slate-950">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-16"
                >
                    <span className="inline-block px-4 py-1.5 bg-green-500/10 text-green-600 dark:text-green-400 text-sm font-bold rounded-full mb-4">
                        Platform Features
                    </span>
                    <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-4">
                        Everything Your Farm Needs
                    </h2>
                    <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                        Comprehensive digital tools designed for modern Indian agriculture
                    </p>
                </motion.div>

                <CardSwap services={services} />
            </div>
        </section>
    );
};

const ImpactSection = () => {
    const stats = [
        { value: "15,000+", label: "Registered Farmers", icon: Users },
        { value: "₹2.5 Cr", label: "Claims Processed", icon: TrendingUp },
        { value: "50,000+", label: "Crop Scans", icon: Camera },
        { value: "12", label: "States Covered", icon: MapPin },
    ];

    return (
        <section className="py-20 bg-gradient-to-br from-organic-green-600 to-organic-green-800 text-white relative overflow-hidden">
            {/* Pattern Overlay */}
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }} />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-12"
                >
                    <h2 className="text-3xl sm:text-4xl font-bold mb-4">Our Impact Across India</h2>
                    <p className="text-lg opacity-90 max-w-2xl mx-auto">Empowering farmers with technology and financial support</p>
                </motion.div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                    {stats.map((stat, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                            className="bg-white/15 backdrop-blur-sm rounded-2xl p-6 text-center border border-white/20"
                        >
                            <stat.icon size={32} className="mx-auto mb-3 opacity-80" />
                            <p className="text-3xl sm:text-4xl font-bold mb-1">{stat.value}</p>
                            <p className="text-sm opacity-80">{stat.label}</p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

const HelpLine = () => {
    return (
        <section className="py-16 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
                <div className="flex items-center justify-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-organic-green/10 rounded-full flex items-center justify-center">
                        <Phone size={24} className="text-organic-green" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Farmer Helpline</h3>
                </div>
                <a href="tel:1800-180-1551" className="text-4xl font-bold text-organic-green hover:underline">
                    1800-180-1551
                </a>
                <p className="text-slate-500 dark:text-slate-400 mt-2">Toll-free | 24x7 | Available in Hindi & English</p>
            </div>
        </section>
    );
};

const Footer = () => {
    return (
        <footer className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white py-12 border-t border-slate-200 dark:border-slate-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-3">
                        <img src="/logo.png" alt="Logo" className="w-10 h-10 rounded-xl" />
                        <div>
                            <p className="font-bold">ANNADATA SAATHI</p>
                            <p className="text-xs text-slate-600 dark:text-slate-400">Digital Agriculture Ecosystem</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-6 text-sm text-slate-600 dark:text-slate-400">
                        <Link to="/about" className="hover:text-organic-green transition-colors">About</Link>
                        <Link to="/contact" className="hover:text-organic-green transition-colors">Contact</Link>
                        <Link to="/privacy" className="hover:text-organic-green transition-colors">Privacy</Link>
                        <Link to="/terms" className="hover:text-organic-green transition-colors">Terms</Link>
                    </div>
                    <p className="text-sm text-slate-500">© 2026 Ministry of Agriculture. All Rights Reserved.</p>
                </div>
            </div>
        </footer>
    );
};

import ModuleSelection from '../components/features/ModuleSelection';
import Button from '../components/ui/button';

const LandingPage = () => {
    return (
        <div className="min-h-screen bg-white dark:bg-slate-950">
            <AnimatedContent distance={0} delay={0.2}>
                <HeroSection />
            </AnimatedContent>
            
            <AnimatedContent distance={50} direction="vertical" delay={0.2}>
                <ModuleSelection />
            </AnimatedContent>
            
            <AnimatedContent distance={100} direction="vertical" delay={0.1}>
                <ServicesGrid />
            </AnimatedContent>
            
            <AnimatedContent distance={100} direction="vertical">
                <ImpactSection />
            </AnimatedContent>
            
            <AnimatedContent distance={50} direction="horizontal" reverse={true}>
                <HelpLine />
            </AnimatedContent>
            
            <AnimatedContent distance={0} animateOpacity={true}>
                <Footer />
            </AnimatedContent>
        </div>
    );
};

export default LandingPage;
