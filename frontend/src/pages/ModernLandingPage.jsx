import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import AuroraBackground from '../components/ui/AuroraBackground';
import ModernNavbar from '../components/ui/ModernNavbar';
import GlassCard from '../components/ui/GlassCard';
import ServicesSection from '../components/features/ServicesSection';
import { 
  Sprout, 
  Shield, 
  TrendingUp, 
  Zap, 
  Users, 
  BarChart3,
  ArrowRight,
  CheckCircle,
  Leaf,
  CloudRain,
  Smartphone
} from 'lucide-react';

const ModernLandingPage = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Sprout,
      title: 'Smart Crop Management',
      description: 'AI-powered recommendations for optimal crop health and yield',
      color: 'green'
    },
    {
      icon: Shield,
      title: 'Blockchain Security',
      description: 'Secure land records and transparent supply chain tracking',
      color: 'blue'
    },
    {
      icon: TrendingUp,
      title: 'Market Intelligence',
      description: 'Real-time market prices and demand forecasting',
      color: 'purple'
    },
    {
      icon: Zap,
      title: 'Autonomous Farming',
      description: 'IoT-enabled smart irrigation and automated farm operations',
      color: 'amber'
    },
    {
      icon: CloudRain,
      title: 'Weather Insights',
      description: 'Hyperlocal weather forecasts and disaster alerts',
      color: 'blue'
    },
    {
      icon: BarChart3,
      title: 'Analytics Dashboard',
      description: 'Comprehensive insights into your farm performance',
      color: 'green'
    }
  ];

  const stats = [
    { value: '50K+', label: 'Active Farmers' },
    { value: '2M+', label: 'Acres Managed' },
    { value: '35%', label: 'Yield Increase' },
    { value: '24/7', label: 'AI Support' }
  ];

  return (
    <AuroraBackground variant="multi" className="min-h-screen">
      
      {/* Hero Section */}
      <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
      <ModernNavbar />
          
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-8"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/20 border border-green-500/30 text-green-400 text-sm font-semibold mb-6">
              <Leaf className="w-4 h-4" />
              Empowering Indian Agriculture
            </div>
            
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-slate-900 dark:text-white mb-6 leading-tight">
              Farm Smarter with
              <br />
              <span className="bg-gradient-to-r from-green-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                AI-Powered Insights
              </span>
            </h1>
            
            <p className="text-xl text-slate-700 dark:text-slate-300 mb-8 max-w-3xl mx-auto">
              Transform your farming with cutting-edge technology. Get real-time insights, 
              automated operations, and market intelligence—all in one platform.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/auth')}
                className="px-8 py-4 rounded-xl bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold text-lg shadow-xl shadow-green-500/30 flex items-center gap-2"
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
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16"
          >
            {stats.map((stat, i) => (
              <GlassCard key={i} className="p-6">
                <p className="text-3xl font-bold text-slate-900 dark:text-white mb-1">{stat.value}</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">{stat.label}</p>
              </GlassCard>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Services Section - New Interactive Design */}
      <ServicesSection />

      {/* How It Works */}
      <div className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl sm:text-5xl font-bold text-slate-900 dark:text-white mb-4">
              Simple. Smart. Effective.
            </h2>
            <p className="text-xl text-slate-700 dark:text-slate-300 max-w-2xl mx-auto">
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
                transition={{ duration: 0.5, delay: i * 0.2 }}
                className="relative"
              >
                <GlassCard className="p-8 text-center">
                  <div className="text-6xl font-bold text-green-500/20 mb-4">{item.step}</div>
                  <item.icon className="w-12 h-12 text-green-400 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">{item.title}</h3>
                  <p className="text-slate-600 dark:text-slate-400">{item.description}</p>
                </GlassCard>
                
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
            transition={{ duration: 0.8 }}
          >
            <GlassCard className="p-12 text-center">
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
                  className="px-8 py-4 rounded-xl bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold text-lg shadow-xl shadow-green-500/30 flex items-center gap-2"
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
            </GlassCard>
          </motion.div>
        </div>
      </div>

    </AuroraBackground>
  );
};

export default ModernLandingPage;
