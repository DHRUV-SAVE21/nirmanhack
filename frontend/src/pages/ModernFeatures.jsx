import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import AuroraBackground from '../components/ui/AuroraBackground';
import ModernNavbar from '../components/ui/ModernNavbar';
import GlassCard from '../components/ui/GlassCard';
import { 
  Sprout, 
  Shield, 
  TrendingUp, 
  Zap, 
  CloudRain,
  BarChart3,
  MapPin,
  Smartphone,
  Users,
  Award,
  Bell,
  Lock,
  ArrowRight,
  CheckCircle
} from 'lucide-react';

const ModernFeatures = () => {
  const navigate = useNavigate();

  const features = [
    {
      category: 'Smart Farming',
      icon: Sprout,
      color: 'green',
      items: [
        {
          title: 'AI Crop Recommendations',
          description: 'Get personalized crop suggestions based on soil, weather, and market data',
          icon: Sprout
        },
        {
          title: 'Smart Irrigation',
          description: 'Automated watering based on real-time soil moisture and weather forecasts',
          icon: Zap
        },
        {
          title: 'Crop Health Monitoring',
          description: 'AI-powered disease detection and treatment recommendations',
          icon: Award
        }
      ]
    },
    {
      category: 'Market Intelligence',
      icon: TrendingUp,
      color: 'blue',
      items: [
        {
          title: 'Real-time Prices',
          description: 'Live mandi prices and market trends for better selling decisions',
          icon: BarChart3
        },
        {
          title: 'Demand Forecasting',
          description: 'Predict market demand to plan your crops strategically',
          icon: TrendingUp
        },
        {
          title: 'Direct Marketplace',
          description: 'Sell directly to buyers without middlemen',
          icon: Users
        }
      ]
    },
    {
      category: 'Blockchain & Security',
      icon: Shield,
      color: 'purple',
      items: [
        {
          title: 'Land Registry',
          description: 'Secure, tamper-proof land ownership records on blockchain',
          icon: Lock
        },
        {
          title: 'Supply Chain Tracking',
          description: 'Complete transparency from farm to consumer',
          icon: MapPin
        },
        {
          title: 'Quality Certification',
          description: 'Blockchain-verified organic and quality certifications',
          icon: Award
        }
      ]
    },
    {
      category: 'Weather & Alerts',
      icon: CloudRain,
      color: 'amber',
      items: [
        {
          title: 'Hyperlocal Weather',
          description: 'Accurate weather forecasts specific to your farm location',
          icon: CloudRain
        },
        {
          title: 'Disaster Alerts',
          description: 'Early warnings for floods, droughts, and extreme weather',
          icon: Bell
        },
        {
          title: 'Seasonal Planning',
          description: 'Long-term weather patterns for better crop planning',
          icon: BarChart3
        }
      ]
    }
  ];

  const benefits = [
    { icon: TrendingUp, title: '35% Yield Increase', description: 'Average improvement with AI recommendations' },
    { icon: Zap, title: '40% Water Savings', description: 'Through smart irrigation systems' },
    { icon: Shield, title: '100% Transparency', description: 'Blockchain-verified supply chain' },
    { icon: Users, title: '50K+ Farmers', description: 'Growing community of users' }
  ];

  return (
    <AuroraBackground variant="multi" className="min-h-screen">
      <ModernNavbar />
      
      <div className="min-h-screen pt-32 px-4 sm:px-6 lg:px-8 pb-12 max-w-7xl mx-auto">
        
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/20 border border-green-500/30 text-green-400 text-sm font-semibold mb-6">
            <Smartphone className="w-4 h-4" />
            Complete Farming Solution
          </div>
          
          <h1 className="text-5xl sm:text-6xl font-bold text-slate-900 dark:text-white mb-6">
            Everything You Need
            <br />
            <span className="bg-gradient-to-r from-green-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
              In One Platform
            </span>
          </h1>
          
          <p className="text-xl text-slate-700 dark:text-slate-300 max-w-3xl mx-auto">
            From planting to selling, we've got you covered with cutting-edge technology
          </p>
        </motion.div>

        {/* Features Grid */}
        {features.map((category, catIndex) => (
          <motion.div
            key={catIndex}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: catIndex * 0.1 }}
            className="mb-16"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className={`p-3 rounded-xl bg-${category.color}-500/20 border border-${category.color}-500/30`}>
                <category.icon className={`w-6 h-6 text-${category.color}-400`} />
              </div>
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white">{category.category}</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {category.items.map((item, itemIndex) => (
                <motion.div
                  key={itemIndex}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: itemIndex * 0.1 }}
                >
                  <GlassCard className="p-6 h-full">
                    <div className={`p-3 rounded-xl bg-${category.color}-500/20 border border-${category.color}-500/30 inline-block mb-4`}>
                      <item.icon className={`w-6 h-6 text-${category.color}-400`} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{item.title}</h3>
                    <p className="text-slate-600 dark:text-slate-400">{item.description}</p>
                  </GlassCard>
                </motion.div>
              ))}
            </div>
          </motion.div>
        ))}

        {/* Benefits Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white text-center mb-12">
            Proven Results
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((benefit, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <GlassCard className="p-6 text-center">
                  <div className="p-4 rounded-xl bg-green-500/20 border border-green-500/30 inline-block mb-4">
                    <benefit.icon className="w-8 h-8 text-green-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{benefit.title}</h3>
                  <p className="text-slate-600 dark:text-slate-400">{benefit.description}</p>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <GlassCard className="p-12 text-center">
            <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-xl text-slate-700 dark:text-slate-300 mb-8 max-w-2xl mx-auto">
              Join thousands of farmers already benefiting from our platform
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
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/dashboard-modern')}
                className="px-8 py-4 rounded-xl bg-slate-100 dark:bg-white/10 shadow-sm dark:shadow-none backdrop-blur-md border border-white/20 hover:bg-white/20 text-slate-900 dark:text-white font-bold text-lg"
              >
                View Demo
              </motion.button>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-slate-600 dark:text-slate-400">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                No credit card required
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                Free for 30 days
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                Cancel anytime
              </div>
            </div>
          </GlassCard>
        </motion.div>

      </div>
    </AuroraBackground>
  );
};

export default ModernFeatures;
