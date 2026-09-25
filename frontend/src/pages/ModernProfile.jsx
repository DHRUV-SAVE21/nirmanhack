import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import AuroraBackground from '../components/ui/AuroraBackground';
import ModernNavbar from '../components/ui/ModernNavbar';
import GlassCard from '../components/ui/GlassCard';
import { 
  User, 
  MapPin, 
  Phone, 
  Mail, 
  Calendar,
  Edit,
  Camera,
  Award,
  TrendingUp,
  Leaf,
  BarChart3
} from 'lucide-react';

const ModernProfile = () => {
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (e) { console.error(e); }
    }
  }, []);

  const stats = [
    { icon: Leaf, label: 'Total Crops', value: '12', color: 'green' },
    { icon: TrendingUp, label: 'Avg Yield', value: '+35%', color: 'blue' },
    { icon: Award, label: 'Quality Score', value: '92/100', color: 'amber' },
    { icon: BarChart3, label: 'Revenue', value: '₹2.4L', color: 'purple' }
  ];

  return (
    <AuroraBackground variant="default" className="min-h-screen">
      <ModernNavbar />
      
      <div className="min-h-screen pt-32 px-4 sm:px-6 lg:px-8 pb-12 max-w-7xl mx-auto">
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Profile Card */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-1"
          >
            <GlassCard className="p-6">
              {/* Profile Picture */}
              <div className="relative w-32 h-32 mx-auto mb-4">
                <div className="w-full h-full rounded-full bg-gradient-to-br from-green-400 to-blue-400 flex items-center justify-center">
                  <User className="w-16 h-16 text-slate-900 dark:text-white" />
                </div>
                <button className="absolute bottom-0 right-0 p-2 rounded-full bg-green-500 hover:bg-green-600 text-white transition-colors">
                  <Camera className="w-4 h-4" />
                </button>
              </div>

              {/* User Info */}
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
                  {user?.full_name || 'Farmer Name'}
                </h2>
                <p className="text-slate-600 dark:text-slate-400 flex items-center justify-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {user?.village || 'Village'}, {user?.district || 'District'}
                </p>
              </div>

              {/* Contact Info */}
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-white dark:bg-white/5 shadow-sm dark:shadow-none">
                  <Phone className="w-5 h-5 text-green-400" />
                  <span className="text-slate-900 dark:text-white">{user?.phone || '+91 XXXXX XXXXX'}</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-white dark:bg-white/5 shadow-sm dark:shadow-none">
                  <Mail className="w-5 h-5 text-blue-400" />
                  <span className="text-slate-900 dark:text-white text-sm">{user?.email || 'email@example.com'}</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-white dark:bg-white/5 shadow-sm dark:shadow-none">
                  <Calendar className="w-5 h-5 text-purple-400" />
                  <span className="text-slate-900 dark:text-white">Member since 2024</span>
                </div>
              </div>

              {/* Edit Button */}
              <button 
                onClick={() => setIsEditing(!isEditing)}
                className="w-full px-4 py-3 rounded-lg bg-green-500 hover:bg-green-600 text-white font-semibold transition-colors flex items-center justify-center gap-2"
              >
                <Edit className="w-5 h-5" />
                Edit Profile
              </button>
            </GlassCard>
          </motion.div>

          {/* Stats and Details */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-2 space-y-6"
          >
            
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {stats.map((stat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.1 }}
                >
                  <GlassCard className="p-4 text-center">
                    <div className={`p-3 rounded-lg bg-${stat.color}-500/20 border border-${stat.color}-500/30 inline-block mb-3`}>
                      <stat.icon className={`w-6 h-6 text-${stat.color}-400`} />
                    </div>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white mb-1">{stat.value}</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">{stat.label}</p>
                  </GlassCard>
                </motion.div>
              ))}
            </div>

            {/* Farm Details */}
            <GlassCard className="p-6">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Farm Details</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-white dark:bg-white/5 shadow-sm dark:shadow-none">
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Total Land</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">5.2 <span className="text-sm text-slate-600 dark:text-slate-400">acres</span></p>
                </div>
                <div className="p-4 rounded-lg bg-white dark:bg-white/5 shadow-sm dark:shadow-none">
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Cultivated Area</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">4.8 <span className="text-sm text-slate-600 dark:text-slate-400">acres</span></p>
                </div>
                <div className="p-4 rounded-lg bg-white dark:bg-white/5 shadow-sm dark:shadow-none">
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Primary Crop</p>
                  <p className="text-lg font-bold text-slate-900 dark:text-white">Wheat</p>
                </div>
                <div className="p-4 rounded-lg bg-white dark:bg-white/5 shadow-sm dark:shadow-none">
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Farming Type</p>
                  <p className="text-lg font-bold text-slate-900 dark:text-white">Organic</p>
                </div>
              </div>
            </GlassCard>

            {/* Recent Activity */}
            <GlassCard className="p-6">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Recent Activity</h3>
              
              <div className="space-y-3">
                {[
                  { action: 'Irrigation completed', time: '2 hours ago', color: 'blue' },
                  { action: 'Crop health analyzed', time: '5 hours ago', color: 'green' },
                  { action: 'Market price checked', time: '1 day ago', color: 'purple' }
                ].map((activity, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-white dark:bg-white/5 shadow-sm dark:shadow-none">
                    <div className={`w-2 h-2 rounded-full bg-${activity.color}-400`} />
                    <div className="flex-1">
                      <p className="text-slate-900 dark:text-white font-medium">{activity.action}</p>
                      <p className="text-xs text-slate-600 dark:text-slate-400">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>

          </motion.div>
        </div>

      </div>
    </AuroraBackground>
  );
};

export default ModernProfile;
