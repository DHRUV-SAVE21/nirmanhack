import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Menu, X, Sun, Moon, Leaf } from 'lucide-react';
import { useThemeStore } from '../../store/themeStore';

const ModernNavbar = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const { theme, toggleTheme } = useThemeStore();

  const navItems = [
    { label: 'Home', path: '/modern' },
    { label: 'Dashboard', path: '/dashboard-modern' },
    { label: 'Features', path: '/features' },
    { label: 'Market', path: '/marketplace' }
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 px-4 sm:px-6 lg:px-8 py-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-slate-100 dark:bg-white/10 shadow-sm dark:shadow-none backdrop-blur-md border border-white/20 rounded-2xl px-6 py-4 shadow-xl">
          <div className="flex items-center justify-between">
            
            {/* Logo */}
            <button 
              onClick={() => navigate('/modern')}
              className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-xl"
            >
              <div className="p-2 rounded-lg bg-green-500/20 border border-green-500/30">
                <Leaf className="w-5 h-5 text-green-400" />
              </div>
              <span>FarmAI</span>
            </button>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-6">
              {navItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className="text-slate-700 dark:text-white/80 hover:text-white transition-colors font-medium"
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg bg-slate-100 dark:bg-white/10 shadow-sm dark:shadow-none hover:bg-white/20 transition-colors"
              >
                {theme === 'dark' ? (
                  <Sun className="w-5 h-5 text-slate-900 dark:text-white" />
                ) : (
                  <Moon className="w-5 h-5 text-slate-900 dark:text-white" />
                )}
              </button>

              <button
                onClick={() => navigate('/auth')}
                className="hidden md:block px-6 py-2 rounded-lg bg-green-500 hover:bg-green-600 text-white font-semibold transition-colors"
              >
                Sign In
              </button>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="md:hidden p-2 rounded-lg bg-slate-100 dark:bg-white/10 shadow-sm dark:shadow-none hover:bg-white/20 transition-colors"
              >
                {isOpen ? <X className="w-5 h-5 text-slate-900 dark:text-white" /> : <Menu className="w-5 h-5 text-slate-900 dark:text-white" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="md:hidden mt-2 bg-slate-100 dark:bg-white/10 shadow-sm dark:shadow-none backdrop-blur-md border border-white/20 rounded-2xl p-4 shadow-xl"
            >
              <div className="flex flex-col gap-2">
                {navItems.map((item) => (
                  <button
                    key={item.path}
                    onClick={() => {
                      navigate(item.path);
                      setIsOpen(false);
                    }}
                    className="text-left px-4 py-3 rounded-lg text-slate-900 dark:text-white hover:bg-white/10 transition-colors font-medium"
                  >
                    {item.label}
                  </button>
                ))}
                <button
                  onClick={() => {
                    navigate('/auth');
                    setIsOpen(false);
                  }}
                  className="px-4 py-3 rounded-lg bg-green-500 hover:bg-green-600 text-white font-semibold transition-colors"
                >
                  Sign In
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
};

export default ModernNavbar;
