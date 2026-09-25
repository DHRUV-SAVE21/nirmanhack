import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import ServicesSection from '../components/features/ServicesSection';
import { 
  ArrowRight,
  CheckCircle,
  Leaf,
  Smartphone,
  Sprout,
  TrendingUp,
  Shield,
  Users
} from 'lucide-react';

const EnhancedLandingPage = () => {
  const navigate = useNavigate();

  const stats = [
    { value: '50K+', label: 'Active Farmers' },
    { value: '2M+', label: 'Acres Managed' },
    { value: '35%', label: 'Yield Increase' },
    { value: '24/7', label: 'AI Support' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-4 sm:px-6 lg:px-8 py-4">
        <div className="max-w-7xl mx-auto">
          <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-2xl px-6 py-4 shadow-2xl">
            <div className="flex items-center justify-between">
              
              {/* Logo */}
              <button 
                onClick={() => navigate('/')}
                className="flex items-center gap-3 text-slate-900 dark:text-white font-bold text-xl"
              >
                <div className="p-2 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500">
                  <Leaf className="w-6 h-6 text-slate-900 dark:text-white" />
                </div>
                <span className="hidden sm:block">Agrodelo SAATHI</span>
              </button>

              {/* Desktop Navigation */}
              <div className="hidden md:flex items-center gap-6">
                <button onClick={() => navigate('/')} className="text-slate-700 dark:text-slate-300 hover:text-white transition-colors font-medium">
                  Dashboard
                </button>
                <button onClick={() => navigate('/marketplace-modern')} className="text-slate-700 dark:text-slate-300 hover:text-white transition-colors font-medium">
                  Land Map
                </button>
                <button onClick={() => navigate('/features-modern')} className="text-slate-700 dark:text-slate-300 hover:text-white transition-colors font-medium">
                  Crop AI
                </button>
                <button onClick={() => navigate('/features-modern')} className="text-slate-700 dark:text-slate-300 hover:text-white transition-colors font-medium">
                  Equipment
                </button>
                <button onClick={() => navigate('/features-modern')} className="text-slate-700 dark:text-slate-300 hover:text-white transition-colors font-medium">
                  schemes
                </button>
                <button onClick={() => navigate('/marketplace-modern')} className="text-slate-700 dark:text-slate-300 hover:text-white transition-colors font-medium">
                  Inventory
                </button>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3">
                <button className="p-2 rounded-lg bg-slate-100 dark:bg-white/10 shadow-sm dark:shadow-none hover:bg-white/20 transition-colors">
                  <span className="text-slate-900 dark:text-white text-sm">🌐 EN</span>
                </button>
                
                <button
                  onClick={() => navigate('/auth')}
                  className="px-6 py-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold transition-all shadow-lg shadow-green-500/30"
                >
                  Login
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 pt-32">
        
        {/* Hero Background Image */}
        <div className="absolute inset-0 overflow-hidden">
          <img 
            src="/assets/field-crop.jpg"
            alt="Farm field"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/90 via-slate-950/80 to-slate-950" />
        </div>

        {/* Animated Accents */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-green-500/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>

        <div className="relative max-w-7xl mx-auto text-center">
          
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/20 border border-green-500/30 text-green-400 text-sm font-semibold mb-8">
              <Leaf className="w-4 h-4" />
              Empowering Indian Agriculture
            </div>
            
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
              <span className="text-slate-900 dark:text-white">One Platform. </span>
              <span className="bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                Endless Possibilities.
              </span>
            </h1>
            
            <p className="text-xl text-slate-600 dark:text-slate-400 mb-12 max-w-3xl mx-auto">
              Explore modules designed to transform every acre of your farm.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/auth')}
                className="px-8 py-4 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold text-lg shadow-xl shadow-green-500/30 flex items-center gap-2"
              >
                Get Started <ArrowRight className="w-5 h-5" />
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/dashboard-modern')}
                className="px-8 py-4 rounded-xl bg-slate-100 dark:bg-white/10 shadow-sm dark:shadow-none backdrop-blur-md border border-white/20 hover:bg-white/20 text-slate-900 dark:text-white font-bold text-lg"
              >
                View Demo
              </motion.button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {stats.map((stat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + i * 0.1 }}
                  className="p-6 rounded-2xl bg-white dark:bg-white/5 shadow-sm dark:shadow-none border border-slate-200 dark:border-white/10 backdrop-blur-sm"
                >
                  <p className="text-3xl font-bold text-slate-900 dark:text-white mb-1">{stat.value}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Services Section */}
      <ServicesSection />

      {/* How It Works */}
      <div className="relative py-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
        
        {/* Background Image */}
        <div className="absolute inset-0">
          <img 
            src="/assets/leaf-image.webp"
            alt="Crop technology"
            className="w-full h-full object-cover opacity-10"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900/95 to-slate-950" />
        </div>

        <div className="relative max-w-7xl mx-auto">
          
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl sm:text-5xl font-bold text-slate-900 dark:text-white mb-4">
              Simple. Smart. Effective.
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Get started in minutes, not hours
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Sign Up',
                description: 'Create your account with Aadhaar or mobile number',
                icon: Smartphone
              },
              {
                step: '02',
                title: 'Connect Your Farm',
                description: 'Add your land details and connect IoT sensors',
                icon: Sprout
              },
              {
                step: '03',
                title: 'Start Growing',
                description: 'Get AI recommendations and watch your yield increase',
                icon: TrendingUp
              }
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2 }}
                className="relative p-8 rounded-2xl bg-white dark:bg-white/5 shadow-sm dark:shadow-none border border-slate-200 dark:border-white/10 backdrop-blur-sm text-center"
              >
                <div className="text-6xl font-bold text-green-500/20 mb-4">{item.step}</div>
                <item.icon className="w-12 h-12 text-green-400 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">{item.title}</h3>
                <p className="text-slate-600 dark:text-slate-400">{item.description}</p>
                
                {i < 2 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                    <ArrowRight className="w-8 h-8 text-green-400/50" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="p-12 rounded-3xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30 backdrop-blur-sm text-center"
          >
            <h2 className="text-4xl sm:text-5xl font-bold text-slate-900 dark:text-white mb-4">
              Ready to Transform Your Farm?
            </h2>
            <p className="text-xl text-slate-700 dark:text-slate-300 mb-8">
              Join thousands of farmers already using our platform
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/auth')}
                className="px-8 py-4 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold text-lg shadow-xl shadow-green-500/30 flex items-center gap-2"
              >
                Start Free Trial <ArrowRight className="w-5 h-5" />
              </motion.button>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-slate-600 dark:text-slate-400">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                No credit card required
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                Free for first 30 days
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                Cancel anytime
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-slate-200 dark:border-white/10">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-slate-600 dark:text-slate-400">
            © 2024 Agrodelo SAATHI. Empowering farmers with technology.
          </p>
        </div>
      </footer>

    </div>
  );
};

export default EnhancedLandingPage;
