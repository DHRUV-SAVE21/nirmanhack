import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import AuroraBackground from '../components/ui/AuroraBackground';
import ModernNavbar from '../components/ui/ModernNavbar';
import GlassCard from '../components/ui/GlassCard';
import StatCard from '../components/ui/StatCard';
import {
  Droplets,
  Thermometer,
  Wind,
  Sun,
  CloudRain,
  Sprout,
  TrendingUp,
  AlertTriangle,
  Activity,
  MapPin,
  Calendar,
  Bell,
  Settings,
  ChevronRight,
  Leaf,
  BarChart3,
  Zap,
  Shield
} from 'lucide-react';

import EconomicImpact from '../components/Dashboard/EconomicImpact';

const ModernFarmerDashboard = () => {
  const { t } = useTranslation();
  const [user, setUser] = useState(null);
  const [sensorData, setSensorData] = useState(null);
  const [fireGasData, setFireGasData] = useState(null);
  const [fireGasError, setFireGasError] = useState(false);
  const [marketPrices, setMarketPrices] = useState([]);
  const [locationName, setLocationName] = useState("Detecting...");
  const [lastSync, setLastSync] = useState(new Date());

  const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        if (parsedUser.village) setLocationName(parsedUser.village);
      } catch (e) {
        console.error(e);
      }
    }

    // --- Precise Location Detection ---
    const detectLocation = async () => {
      // Tier 1: Saved Location in profile
      const userStr = localStorage.getItem('user');
      const userObj = userStr ? JSON.parse(userStr) : null;
      if (userObj?.village) {
        setLocationName(userObj.village);
        return;
      }

      // Tier 2: Last Known GPS
      const lastLoc = localStorage.getItem('last_known_location');
      if (lastLoc) {
        try {
          const { lat, lng } = JSON.parse(lastLoc);
          await reverseGeocode(lat, lng);
        } catch (e) { }
      }

      // Tier 3: Fresh GPS
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async (pos) => {
          const { latitude, longitude } = pos.coords;
          await reverseGeocode(latitude, longitude);
          localStorage.setItem('last_known_location', JSON.stringify({
            lat: latitude,
            lng: longitude,
            timestamp: Date.now(),
            status: 'gps'
          }));
        }, () => {
          // Tier 4: IP Fallback (already handled by locationName default if GPS fails)
          if (locationName === "Detecting...") setLocationName("Your Farm");
        });
      }
    };

    const reverseGeocode = async (lat, lng) => {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10`);
        const data = await res.json();
        if (data.address) {
          const city = data.address.village || data.address.town || data.address.city || data.address.suburb || "Your Farm";
          setLocationName(city);
        }
      } catch (e) {
        console.error("Geocode error", e);
      }
    };

    const fetchMarketTrends = async () => {
      try {
        const res = await fetch(`${apiBase}/api/feature6/marketplace`);
        const data = await res.json();
        setMarketPrices(Array.isArray(data) ? data.slice(0, 3) : []);
      } catch (e) {
        console.error(e);
      }
    };

    const fetchSensorData = async () => {
      try {
        const response = await fetch(`${apiBase}/api/hardware/latest?user_id=HARDWARE_DEFAULT`);
        const result = await response.json();
        if (result.status === 'success' && result.data) {
          setSensorData(result.data);
          setLastSync(new Date());
        }
      } catch (error) {
        console.error('Error fetching sensor data:', error);
      }
    };

    const fetchFireGasData = async () => {
      try {
        const response = await fetch(`${apiBase}/api/feature7/status`);
        const result = await response.json();
        if (result.status === 'success') {
          setFireGasData({
            mq2_value: result.gas.level,
            fire_status: result.fire.status,
            gas_status: result.gas.status
          });
          setFireGasError(false);
        } else {
          setFireGasError(true);
        }
      } catch (error) {
        setFireGasError(true);
      }
    };

    detectLocation();
    fetchMarketTrends();
    fetchSensorData();
    fetchFireGasData();

    const interval = setInterval(() => {
      fetchSensorData();
      fetchFireGasData();
    }, 10000);

    return () => clearInterval(interval);
  }, [apiBase]);

  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? 'Good Morning' : currentHour < 17 ? 'Good Afternoon' : 'Good Evening';

  const notifications = [
    {
      type: 'urgent',
      icon: AlertTriangle,
      title: 'Water Tank Low',
      message: 'Tank level at 15%. Schedule refill.',
      action: 'Call Tanker',
      color: 'red'
    },
    {
      type: 'warning',
      icon: Activity,
      title: 'Pest Alert - Zone B',
      message: 'Aphid activity detected.',
      action: 'View Details',
      color: 'amber'
    },
    {
      type: 'info',
      icon: TrendingUp,
      title: 'Wheat Prices Up',
      message: 'Local mandi prices +8%.',
      action: 'Check Market',
      color: 'green'
    }
  ];

  return (
    <AuroraBackground variant="green" className="min-h-screen">
      <ModernNavbar />
      <div className="min-h-screen pt-24 px-4 sm:px-6 lg:px-8 pb-12 max-w-7xl mx-auto">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8"
        >
          <div>
            <div className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300 mb-2">
              <span className="flex items-center gap-2">
                <Sun className="w-4 h-4 text-amber-400" />
                {greeting}
              </span>
              <span>•</span>
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                System Online • <span className="text-[10px] font-mono opacity-50">SYNCED: {lastSync.toLocaleTimeString()}</span>
              </span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 dark:text-white mb-1">
              Namaste, <span className="text-gradient-green">{user?.full_name?.split(' ')[0] || 'Farmer'}</span>
            </h1>
            <p className="text-slate-600 dark:text-slate-400 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              {locationName} • <Calendar className="w-4 h-4" /> {new Date().toLocaleDateString('en-IN', { weekday: 'long', month: 'short', day: 'numeric' })}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button className="relative p-3 bg-slate-100 dark:bg-white/10 shadow-sm dark:shadow-none backdrop-blur-md border border-white/20 rounded-xl hover:bg-white/20 transition-all">
              <Bell size={20} className="text-slate-900 dark:text-white" />
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">3</span>
            </button>
            <button className="p-3 bg-slate-100 dark:bg-white/10 shadow-sm dark:shadow-none backdrop-blur-md border border-white/20 rounded-xl hover:bg-white/20 transition-all">
              <Settings size={20} className="text-slate-900 dark:text-white" />
            </button>
          </div>
        </motion.div>

        {/* Critical Notifications */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Critical Alerts</h3>
            <button className="text-sm font-semibold text-green-400 hover:text-green-300 flex items-center gap-1">
              View All <ChevronRight size={14} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {notifications.map((n, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.1 }}
              >
                <GlassCard className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg bg-${n.color}-500/20 border border-${n.color}-500/30`}>
                      <n.icon className={`w-5 h-5 text-${n.color}-400`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900 dark:text-white text-sm mb-1">{n.title}</p>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">{n.message}</p>
                      <button className={`text-xs font-semibold px-3 py-1.5 rounded-lg bg-${n.color}-500/20 text-${n.color}-400 hover:bg-${n.color}-500/30 transition-colors`}>
                        {n.action}
                      </button>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={Droplets}
            label="Soil Moisture"
            value={sensorData?.soil_moisture || 65}
            unit="%"
            trend={{ value: 5, direction: 'up' }}
            color="blue"
            delay={0.3}
          />
          <StatCard
            icon={Thermometer}
            label="Soil Temp"
            value={sensorData?.soil_temperature || 28}
            unit="°C"
            trend={{ value: 2, direction: 'down' }}
            color="amber"
            delay={0.4}
          />
          <StatCard
            icon={Zap}
            label="Nitrogen (N)"
            value={sensorData?.nitrogen || 45}
            unit="mg/kg"
            trend={{ value: 3, direction: 'up' }}
            color="purple"
            delay={0.5}
          />
          <StatCard
            icon={Sprout}
            label="Potassium (K)"
            value={sensorData?.potassium || 12}
            unit="mg/kg"
            trend={{ value: 8, direction: 'up' }}
            color="green"
            delay={0.6}
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">

          {/* Today's Action */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="lg:col-span-2"
          >
            <GlassCard className="p-6 h-full">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Zap className="w-5 h-5 text-green-400" />
                  Today's Priority Action
                </h3>
                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-green-500/20 text-green-400 border border-green-500/30">
                  AI Recommended
                </span>
              </div>

              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-gradient-to-br from-green-500/10 to-blue-500/10 border border-green-500/20">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-lg bg-green-500/20">
                      <Droplets className="w-6 h-6 text-green-400" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-slate-900 dark:text-white mb-2">Irrigate Zone A & B</h4>
                      <p className="text-sm text-slate-700 dark:text-slate-300 mb-4">
                        Soil moisture below optimal levels. Weather forecast shows no rain for next 3 days.
                        Recommended irrigation: 2 hours per zone.
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <button className="px-4 py-2 rounded-lg bg-green-500 hover:bg-green-600 text-white font-semibold text-sm transition-colors">
                          Start Irrigation
                        </button>
                        <button className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-white/10 shadow-sm dark:shadow-none hover:bg-white/20 text-slate-900 dark:text-white font-semibold text-sm transition-colors">
                          Schedule Later
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-white dark:bg-white/5 shadow-sm dark:shadow-none border border-slate-200 dark:border-white/10">
                    <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Estimated Water</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">2,400 <span className="text-sm text-slate-600 dark:text-slate-400">L</span></p>
                  </div>
                  <div className="p-4 rounded-xl bg-white dark:bg-white/5 shadow-sm dark:shadow-none border border-slate-200 dark:border-white/10">
                    <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Duration</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">4 <span className="text-sm text-slate-600 dark:text-slate-400">hrs</span></p>
                  </div>
                </div>
              </div>
            </GlassCard>
          </motion.div>

          {/* Weather Widget */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <GlassCard className="p-6 h-full">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <Sun className="w-5 h-5 text-amber-400" />
                Weather Forecast
              </h3>

              <div className="space-y-4">
                <div className="text-center py-4">
                  <Sun className="w-16 h-16 text-amber-400 mx-auto mb-3" />
                  <p className="text-5xl font-bold text-slate-900 dark:text-white mb-2">28°C</p>
                  <p className="text-slate-700 dark:text-slate-300">Sunny & Clear</p>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {[
                    { day: 'Mon', icon: Sun, temp: '29°' },
                    { day: 'Tue', icon: CloudRain, temp: '26°' },
                    { day: 'Wed', icon: Sun, temp: '30°' }
                  ].map((day, i) => (
                    <div key={i} className="p-3 rounded-lg bg-white dark:bg-white/5 shadow-sm dark:shadow-none border border-slate-200 dark:border-white/10 text-center">
                      <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">{day.day}</p>
                      <day.icon className="w-6 h-6 text-amber-400 mx-auto mb-2" />
                      <p className="text-sm font-bold text-slate-900 dark:text-white">{day.temp}</p>
                    </div>
                  ))}
                </div>
              </div>
            </GlassCard>
          </motion.div>
        </div>

        {/* Economic Impact Dashboard */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.85 }}
          className="mb-12"
        >
          <EconomicImpact sensorData={sensorData} />
        </motion.div>

        {/* Bottom Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

          {/* Fire Detection */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
          >
            <GlassCard className="p-6">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-red-400" />
                Fire Detection
              </h3>
              {fireGasError ? (
                <div className="aspect-square rounded-lg bg-slate-800/50 border border-slate-700 flex flex-col items-center justify-center mb-4">
                  <p className="text-slate-500 text-sm text-center">Sensor Offline</p>
                </div>
              ) : (
                <div className={`aspect-square rounded-lg ${fireGasData?.fire_status?.toLowerCase().includes('fire') && !fireGasData?.fire_status?.toLowerCase().includes('no') ? 'bg-gradient-to-br from-red-500/20 to-orange-500/20 border border-red-500/30' : 'bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30'} flex flex-col items-center justify-center mb-4`}>
                  <div className={`text-6xl mb-3 ${fireGasData?.fire_status?.toLowerCase().includes('fire') && !fireGasData?.fire_status?.toLowerCase().includes('no') ? 'animate-bounce' : ''}`}>
                    {fireGasData?.fire_status?.toLowerCase().includes('fire') && !fireGasData?.fire_status?.toLowerCase().includes('no') ? '🔥' : '✅'}
                  </div>
                  <p className={`text-2xl font-bold ${fireGasData?.fire_status?.toLowerCase().includes('fire') && !fireGasData?.fire_status?.toLowerCase().includes('no') ? 'text-red-400' : 'text-green-400'}`}>
                    {fireGasData?.fire_status || 'Loading...'}
                  </p>
                </div>
              )}
              <p className="text-xs text-slate-600 dark:text-slate-400 text-center">Real-time fire monitoring</p>
            </GlassCard>
          </motion.div>

          {/* Gas Monitoring */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0 }}
          >
            <GlassCard className="p-6">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <Wind className="w-5 h-5 text-blue-400" />
                Gas Monitor
              </h3>
              {fireGasError ? (
                <div className="aspect-square rounded-lg bg-slate-800/50 border border-slate-700 flex flex-col items-center justify-center mb-4">
                  <p className="text-slate-500 text-sm text-center">Sensor Offline</p>
                </div>
              ) : (
                <div className={`aspect-square rounded-lg ${fireGasData?.mq2_value > 2000 ? 'bg-gradient-to-br from-red-500/20 to-orange-500/20 border border-red-500/30' : fireGasData?.mq2_value > 600 ? 'bg-gradient-to-br from-amber-500/20 to-yellow-500/20 border border-amber-500/30' : 'bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30'} flex flex-col items-center justify-center mb-4`}>
                  <p className="text-5xl font-black text-slate-900 dark:text-white mb-2">{fireGasData?.mq2_value || 0}</p>
                  <p className="text-sm text-slate-700 dark:text-slate-300 mb-3">PPM</p>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${fireGasData?.mq2_value > 2000 ? 'bg-red-500/20 text-red-400 animate-pulse' : fireGasData?.mq2_value > 600 ? 'bg-amber-500/20 text-amber-400' : 'bg-green-500/20 text-green-400'}`}>
                    {fireGasData?.mq2_value > 2000 ? 'DANGEROUS' : fireGasData?.mq2_value > 600 ? 'MODERATE' : 'SAFE'}
                  </span>
                </div>
              )}
              <p className="text-xs text-slate-600 dark:text-slate-400 text-center">
                {fireGasError ? 'Check hardware connection' : `Threshold: ${fireGasData?.mq2_value > 2000 ? '> 2000' : fireGasData?.mq2_value > 600 ? '600-2000' : '< 600'} ppm`}
              </p>
            </GlassCard>
          </motion.div>

          {/* Crop Health */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1 }}
          >
            <GlassCard className="p-6">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <Leaf className="w-5 h-5 text-green-400" />
                Crop Health
              </h3>
              <div className="aspect-video rounded-lg bg-gradient-to-br from-green-500/20 to-blue-500/20 border border-green-500/30 flex items-center justify-center mb-4">
                <p className="text-slate-600 dark:text-slate-400">Upload crop image</p>
              </div>
              <button className="w-full px-4 py-2 rounded-lg bg-green-500/20 hover:bg-green-500/30 text-green-400 font-semibold text-sm transition-colors">
                Analyze Crop Health
              </button>
            </GlassCard>
          </motion.div>

          {/* Market Prices */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2 }}
          >
            <GlassCard className="p-6">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-400" />
                Market Prices
              </h3>
              <div className="space-y-3">
                {(marketPrices.length > 0 ? marketPrices : [
                  { crop_name: 'Wheat', price_per_quintal: '2150', variety: 'Bansi' },
                  { crop_name: 'Rice', price_per_quintal: '3200', variety: 'Basmati' },
                  { crop_name: 'Cotton', price_per_quintal: '6800', variety: 'Organic' }
                ]).map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-white dark:bg-white/5 shadow-sm dark:shadow-none border border-slate-200 dark:border-white/10">
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">{item.crop_name}</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">₹{item.price_per_quintal}/qtl</p>
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">
                      {item.variety}
                    </span>
                  </div>
                ))}
              </div>
            </GlassCard>
          </motion.div>
        </div>

        {/* AI Insights - Moved Below */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.3 }}
          className="mt-6"
        >
          <GlassCard className="p-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-purple-400" />
              AI Insights
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                <p className="text-sm text-slate-700 dark:text-slate-300">
                  Your wheat crop is 12% ahead of regional average growth rate.
                </p>
              </div>
              <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <p className="text-sm text-slate-700 dark:text-slate-300">
                  Optimal harvest window: Feb 15-20 based on weather patterns.
                </p>
              </div>
              <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                <p className="text-sm text-slate-700 dark:text-slate-300">
                  Soil nutrients optimal. No fertilizer needed for 2 weeks.
                </p>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* AI Learning Progress */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
          className="mt-8"
        >
          <GlassCard className="p-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
                  <Activity size={18} className="text-green-400" />
                  AI Learning Progress
                </h4>
                <p className="text-sm text-slate-600 dark:text-slate-400">Your personalized model is improving daily</p>
              </div>

              <div className="flex-1 w-full md:max-w-md">
                <div className="flex justify-between text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">
                  <span>Day 1</span>
                  <span className="text-green-400 font-bold">Day 19 (65%)</span>
                  <span>Day 30</span>
                </div>
                <div className="h-2 bg-slate-100 dark:bg-white/10 shadow-sm dark:shadow-none rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: '65%' }}
                    transition={{ delay: 1.3, duration: 1 }}
                    className="h-full bg-gradient-to-r from-green-600 to-green-400 rounded-full"
                  />
                </div>
              </div>

              <button className="px-6 py-2 rounded-lg bg-slate-100 dark:bg-white/10 shadow-sm dark:shadow-none hover:bg-white/20 text-slate-900 dark:text-white font-semibold text-sm transition-colors border border-white/20">
                View Analysis
              </button>
            </div>
          </GlassCard>
        </motion.div>

      </div>
    </AuroraBackground>
  );
};

export default ModernFarmerDashboard;
