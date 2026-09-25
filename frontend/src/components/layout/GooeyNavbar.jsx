import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Menu, X, Sun, Moon, LogIn, LogOut, User, Home, LayoutDashboard, CloudRain, Tractor, MapPin, Sprout, FileText, Package, ShoppingCart, ChevronRight, ChevronDown, HelpCircle } from 'lucide-react';
import { useThemeStore } from '../../store/themeStore';
import { usePersonaStore } from '../../store/personaStore';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import GoogleTranslate from '../ui/GoogleTranslate';

const NavItem = ({ to, label, icon: Icon, isActive, onClick, isMobile = false, isLandingPageTop = false }) => {
    if (isMobile) {
        return (
            <Link
                to={to}
                onClick={onClick}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${isActive
                    ? "bg-organic-green/10 text-organic-green font-semibold border-l-4 border-organic-green -ml-px"
                    : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
            >
                {Icon && <Icon size={20} className={isActive ? "text-organic-green" : "text-slate-400"} />}
                <span className="flex-1">{label}</span>
                <ChevronRight size={16} className="text-slate-700 dark:text-slate-300 dark:text-slate-600" />
            </Link>
        );
    }

    return (
        <Link
            to={to}
            onClick={onClick}
            className={`px-3 py-2 text-sm font-medium rounded-lg transition-all duration-300 ${isActive
                ? "bg-organic-green text-white shadow-sm"
                : isLandingPageTop 
                    ? "text-white hover:bg-white/10" 
                    : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
        >
            {label}
        </Link>
    );
};

const Navbar = () => {
    const { t } = useTranslation();
    const { theme, toggleTheme } = useThemeStore();
    const [isOpen, setIsOpen] = useState(false);
    const [servicesOpen, setServicesOpen] = useState(false); // For mobile or desktop click
    const [user, setUser] = useState(null);
    const [scrolled, setScrolled] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const { resetTour } = usePersonaStore();

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const isLandingPage = location.pathname === '/' || location.pathname === '/landing' || location.pathname === '/enhanced' || location.pathname === '/modern';
    const isLandingPageTop = isLandingPage && !scrolled;

    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (userData) {
            try {
                setUser(JSON.parse(userData));
            } catch (e) { console.error(e); }
        }
    }, [location]);

    // Close drawer on route change
    useEffect(() => {
        setIsOpen(false);
    }, [location.pathname]);

    // Prevent body scroll when drawer is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    const handleLogout = () => {
        localStorage.removeItem('user');
        setUser(null);
        setIsOpen(false);
        navigate('/');
    };

    // Reorganized Links
    const MAIN_LINKS = [
        { to: '/dashboard', label: t('dashboard_nav'), icon: LayoutDashboard },
        { to: '/crop-yield-prediction', label: t('crop_ai'), icon: Tractor },
        { to: '/schemes-assistant', label: t('schemes'), icon: FileText },
        { to: '/mark-my-land', label: t('land_map'), icon: MapPin },
    ];

    const SERVICE_LINKS = [
        { to: '/disaster-news', label: t('disaster_news'), icon: CloudRain },
        { to: '/equipment', label: t('equipment'), icon: Tractor },
        { to: '/inventory', label: t('inventory'), icon: Package },
        { to: '/marketplace', label: t('marketplace') || 'Marketplace', icon: ShoppingCart },
    ];

    return (
        <>
            <nav 
                className={`fixed top-0 z-[5000] w-full transition-all duration-500 print:hidden ${
                    isLandingPageTop 
                        ? "bg-transparent border-transparent shadow-none py-2" 
                        : "bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-800/50 shadow-lg py-0"
                }`}
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        {/* Brand Section */}
                        <div className="flex items-center gap-4">
                            {/* Mobile Menu Button */}
                            <button
                                onClick={() => setIsOpen(true)}
                                className={`lg:hidden p-2 -ml-2 rounded-lg transition-colors ${
                                    isLandingPageTop ? "text-white hover:bg-white/10" : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                                }`}
                                aria-label="Open menu"
                            >
                                <Menu size={24} />
                            </button>

                            <Link to="/" className="flex items-center gap-3 group" data-tour="navbar-brand">
                                {/* Logo Image */}
                                <div className="relative w-10 h-10 rounded-xl overflow-hidden shadow-md group-hover:shadow-lg transition-shadow">
                                    <img
                                        src="/logo.png"
                                        alt="Annadata Saathi"
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <div className="flex flex-col">
                                    <span className={`text-lg font-black tracking-tight leading-none transition-colors duration-300 ${
                                        isLandingPageTop ? "text-white" : "text-slate-900 dark:text-white"
                                    }`}>
                                        ANNADATA<span className="text-organic-green font-extrabold">SAATHI</span>
                                    </span>
                                    <span className={`text-[9px] font-semibold uppercase tracking-widest transition-colors duration-300 ${
                                        isLandingPageTop ? "text-white/70" : "text-slate-500 dark:text-slate-400"
                                    }`}>
                                        Digital Agri Ecosystem
                                    </span>
                                </div>
                            </Link>
                        </div>

                        <div className="hidden lg:flex items-center space-x-1">
                            {MAIN_LINKS.map(link => (
                                <NavItem
                                    key={link.to}
                                    to={link.to}
                                    label={link.label}
                                    isActive={location.pathname === link.to}
                                    isLandingPageTop={isLandingPageTop}
                                />
                            ))}

                            {/* Services Dropdown */}
                            <div className="relative group" data-tour="navbar-services">
                                <button
                                    className={`flex items-center gap-1 px-4 py-2 text-sm font-medium rounded-md transition-all duration-300
                                    ${SERVICE_LINKS.some(l => location.pathname === l.to)
                                            ? "bg-organic-green dark:bg-organic-green text-white font-bold"
                                            : isLandingPageTop 
                                                ? "text-white hover:bg-white/10" 
                                                : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"}`}
                                >
                                    Services <ChevronDown size={14} className="group-hover:rotate-180 transition-transform" />
                                </button>

                                <div className="absolute top-full right-0 w-56 pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform translate-y-2 group-hover:translate-y-0">
                                    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-100 dark:border-slate-800 overflow-hidden flex flex-col p-1">
                                        {SERVICE_LINKS.map(link => (
                                            <Link
                                                key={link.to}
                                                to={link.to}
                                                className={`px-4 py-2.5 text-sm rounded-lg transition-colors flex items-center justify-between
                                                ${location.pathname === link.to
                                                        ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 font-bold"
                                                        : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"}`}
                                            >
                                                {link.label}
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Side Actions */}
                        <div className="flex items-center gap-2">
                            {/* Google Translate - Desktop Only */}
                            <div className="hidden md:block">
                                <GoogleTranslate isLandingPageTop={isLandingPageTop} />
                            </div>

                            {/* Theme Toggle */}
                            <button
                                onClick={toggleTheme}
                                className={`p-2 rounded-lg transition-colors ${
                                    isLandingPageTop ? "text-white hover:bg-white/10" : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                                }`}
                                aria-label="Toggle Theme"
                                data-tour="navbar-theme"
                            >
                                {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                            </button>

                            {/* Replay Tour Button */}
                            <button
                                onClick={() => resetTour()}
                                title="Replay Guided Tour"
                                className={`p-2 rounded-lg transition-colors ${
                                    isLandingPageTop ? "text-white/80 hover:text-white hover:bg-white/10" : "hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-slate-500 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400"
                                }`}
                                data-tour="replay-tour"
                            >
                                <HelpCircle size={20} />
                            </button>

                            {/* User Auth - Desktop */}
                            <div className="hidden md:flex items-center">
                                {user ? (
                                    <div className={`flex items-center gap-2 pl-2 border-l ml-2 transition-colors ${
                                        isLandingPageTop ? "border-white/20" : "border-slate-200 dark:border-slate-700"
                                    }`}>
                                        <Link
                                            to="/profile"
                                            title="My Profile"
                                            className={`p-2 rounded-lg transition-colors ${
                                                isLandingPageTop ? "bg-white/10 text-white hover:bg-white/20" : "bg-organic-green/10 text-organic-green hover:bg-organic-green/20"
                                            }`}
                                        >
                                            <User size={18} />
                                        </Link>
                                        <button
                                            onClick={handleLogout}
                                            title="Logout"
                                            className={`p-2 rounded-lg transition-colors ${
                                                isLandingPageTop ? "bg-red-500/20 text-red-200 hover:bg-red-500/30" : "bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/20"
                                            }`}
                                        >
                                            <LogOut size={18} />
                                        </button>
                                    </div>
                                ) : (
                                    <Link
                                        to="/auth"
                                        className={`ml-2 px-4 py-2 text-sm font-semibold rounded-lg shadow-sm transition-all flex items-center gap-2 ${
                                            isLandingPageTop 
                                                ? "bg-white text-organic-green hover:bg-white/90" 
                                                : "bg-organic-green hover:bg-organic-green-800 text-white"
                                        }`}
                                    >
                                        <LogIn size={16} />
                                        <span className="hidden lg:inline">{t('login')}</span>
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Mobile Drawer Overlay */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="mobile-drawer-overlay lg:hidden"
                        onClick={() => setIsOpen(false)}
                    />
                )}
            </AnimatePresence>

            {/* Mobile Drawer */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ x: '-100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '-100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="fixed top-0 left-0 h-full w-80 max-w-[85vw] bg-white dark:bg-slate-900 shadow-2xl z-[70] lg:hidden"
                    >
                        {/* Drawer Header */}
                        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
                            <Link to="/" className="flex items-center gap-3" onClick={() => setIsOpen(false)}>
                                <div className="w-10 h-10 rounded-xl overflow-hidden shadow-md">
                                    <img src="/logo.png" alt="Logo" className="w-full h-full object-cover" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-lg font-bold text-slate-900 dark:text-white">
                                        ANNADATA<span className="text-organic-green">SAATHI</span>
                                    </span>
                                </div>
                            </Link>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        {/* User Info (if logged in) */}
                        {user && (
                            <div className="p-4 bg-organic-green/5 dark:bg-organic-green/10 border-b border-slate-200 dark:border-slate-800">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-full bg-organic-green/20 flex items-center justify-center">
                                        <User size={24} className="text-organic-green" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-slate-900 dark:text-white">{user.full_name}</p>
                                        <p className="text-xs text-slate-500">ID: {user.id?.substring(0, 8)}...</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Navigation Links */}
                        <div className="flex-1 overflow-y-auto p-4">
                            <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-3 px-4">Navigation</p>
                            <div className="space-y-1">
                                <NavItem
                                    to="/"
                                    label="Home"
                                    icon={Home}
                                    isActive={location.pathname === '/'}
                                    onClick={() => setIsOpen(false)}
                                    isMobile={true}
                                />
                                {MAIN_LINKS.map((link, index) => {
                                    const icons = [LayoutDashboard, Sprout, FileText, MapPin];
                                    return (
                                        <NavItem
                                            key={link.to}
                                            to={link.to}
                                            label={link.label}
                                            icon={icons[index] || ChevronRight}
                                            isActive={location.pathname === link.to}
                                            onClick={() => setIsOpen(false)}
                                            isMobile={true}
                                        />
                                    );
                                })}
                            </div>
                        </div>

                        {/* Drawer Footer */}
                        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                            <div className="flex items-center justify-between mb-4">
                                <button
                                    onClick={toggleTheme}
                                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-sm font-medium text-slate-700 dark:text-slate-200"
                                >
                                    {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                                    {theme === 'dark' ? 'Light' : 'Dark'}
                                </button>
                                <div>
                                    <GoogleTranslate isLandingPageTop={false} />
                                </div>
                            </div>

                            {user ? (
                                <button
                                    onClick={handleLogout}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 font-semibold hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                                >
                                    <LogOut size={18} />
                                    Logout
                                </button>
                            ) : (
                                <Link
                                    to="/auth"
                                    onClick={() => setIsOpen(false)}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-organic-green text-white font-semibold hover:bg-organic-green-800 transition-colors"
                                >
                                    <LogIn size={18} />
                                    Login / Register
                                </Link>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default Navbar;
