import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Droplets, 
  Sprout, 
  CloudRain, 
  ShoppingCart,
  TrendingUp,
  Leaf,
  ArrowRight
} from 'lucide-react';

const ServicesSection = () => {
  const [activeService, setActiveService] = useState(0);

  const services = [
    {
      id: 0,
      icon: Droplets,
      title: 'Smart Irrigation',
      description: 'Real-time water management at your fingertips.',
      color: 'cyan',
      image: '/assets/landing.jpg',
      features: ['Automated scheduling', 'Water usage analytics', 'Soil moisture tracking']
    },
    {
      id: 1,
      icon: Sprout,
      title: 'Fertilizer AI',
      description: 'Intelligent nutrient recommendations for optimal growth.',
      color: 'amber',
      image: '/assets/leaf-image.webp',
      features: ['Soil analysis', 'Custom recommendations', 'Cost optimization']
    },
    {
      id: 2,
      icon: CloudRain,
      title: 'Weather Intel',
      description: 'Hyperlocal forecasts and climate insights.',
      color: 'blue',
      image: '/assets/field-crop.jpg',
      features: ['7-day forecasts', 'Disaster alerts', 'Seasonal planning']
    },
    {
      id: 3,
      icon: ShoppingCart,
      title: 'Mandi Prices',
      description: 'Real-time market rates at your fingertips.',
      color: 'green',
      image: '/assets/leaf-image.webp',
      features: ['Live pricing', 'Price trends', 'Best selling time']
    }
  ];

  const activeServiceData = services[activeService];

  return (
    <div className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      <div className="max-w-7xl mx-auto">
        
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-5xl sm:text-6xl font-bold mb-4">
            <span className="text-slate-900 dark:text-white">One Platform. </span>
            <span className="bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
              Endless Possibilities.
            </span>
          </h2>
          <p className="text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto">
            Explore modules designed to transform every acre of your farm.
          </p>
        </motion.div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          
          {/* Left Side - Service List */}
          <div className="space-y-4">
            {services.map((service, index) => (
              <motion.button
                key={service.id}
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                onClick={() => setActiveService(index)}
                className={`w-full text-left p-6 rounded-2xl transition-all duration-300 ${
                  activeService === index
                    ? 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-2 border-green-500/50 shadow-lg shadow-green-500/20'
                    : 'bg-white/5 border-2 border-white/10 hover:border-white/20 hover:bg-white/10'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`p-4 rounded-xl ${
                    activeService === index
                      ? `bg-${service.color}-500/20 border border-${service.color}-500/30`
                      : 'bg-white/10 border border-white/20'
                  }`}>
                    <service.icon className={`w-8 h-8 ${
                      activeService === index
                        ? `text-${service.color}-400`
                        : 'text-white'
                    }`} />
                  </div>
                  
                  <div className="flex-1">
                    <h3 className={`text-2xl font-bold mb-1 ${
                      activeService === index ? 'text-white' : 'text-slate-300'
                    }`}>
                      {service.title}
                    </h3>
                    <p className={`text-sm ${
                      activeService === index ? 'text-slate-300' : 'text-slate-500'
                    }`}>
                      {service.description}
                    </p>
                  </div>

                  {activeService === index && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="text-green-400"
                    >
                      <ArrowRight className="w-6 h-6" />
                    </motion.div>
                  )}
                </div>
              </motion.button>
            ))}
          </div>

          {/* Right Side - Active Service Display */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeService}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.3 }}
              className="relative"
            >
              <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-white/10 to-white/5 border border-white/20 p-8 backdrop-blur-md">
                
                {/* Image Container */}
                <div className="relative aspect-video rounded-2xl overflow-hidden mb-6 bg-gradient-to-br from-green-500/20 to-blue-500/20">
                  {/* Background Image */}
                  <img 
                    src={activeServiceData.image}
                    alt={activeServiceData.title}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent" />
                  
                  {/* Icon Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <activeServiceData.icon className="w-24 h-24 text-white/20" />
                  </div>
                  
                  {/* Badge */}
                  <div className="absolute top-4 right-4 px-4 py-2 rounded-full bg-green-500/90 backdrop-blur-sm">
                    <span className="text-slate-900 dark:text-white font-bold text-sm">Launch Module →</span>
                  </div>
                </div>

                {/* Content */}
                <div>
                  <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-3">
                    {activeServiceData.title}
                  </h3>
                  <p className="text-slate-700 dark:text-slate-300 mb-6">
                    {activeServiceData.description}
                  </p>

                  {/* Features List */}
                  <div className="space-y-3 mb-6">
                    {activeServiceData.features.map((feature, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="flex items-center gap-3"
                      >
                        <div className="w-2 h-2 rounded-full bg-green-400" />
                        <span className="text-slate-700 dark:text-slate-300">{feature}</span>
                      </motion.div>
                    ))}
                  </div>

                  {/* CTA Button */}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-full px-6 py-4 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold text-lg shadow-xl shadow-green-500/30 flex items-center justify-center gap-2"
                  >
                    Launch Module <ArrowRight className="w-5 h-5" />
                  </motion.button>
                </div>
              </div>

              {/* Decorative Elements */}
              <div className="absolute -top-4 -right-4 w-32 h-32 bg-green-500/20 rounded-full blur-3xl" />
              <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl" />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Bottom Stats */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16"
        >
          {[
            { icon: Leaf, value: '50K+', label: 'Active Users' },
            { icon: TrendingUp, value: '35%', label: 'Yield Increase' },
            { icon: Droplets, value: '40%', label: 'Water Saved' },
            { icon: ShoppingCart, value: '₹2.4L', label: 'Avg Revenue' }
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="p-6 rounded-2xl bg-white dark:bg-white/5 shadow-sm dark:shadow-none border border-slate-200 dark:border-white/10 backdrop-blur-sm text-center"
            >
              <stat.icon className="w-8 h-8 text-green-400 mx-auto mb-3" />
              <p className="text-3xl font-bold text-slate-900 dark:text-white mb-1">{stat.value}</p>
              <p className="text-sm text-slate-600 dark:text-slate-400">{stat.label}</p>
            </motion.div>
          ))}
        </motion.div>

      </div>
    </div>
  );
};

export default ServicesSection;
