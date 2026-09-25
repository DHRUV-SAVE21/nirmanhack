import React from 'react';
import { motion } from 'framer-motion';
import GlassCard from './GlassCard';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const StatCard = ({ 
  icon: Icon, 
  label, 
  value, 
  unit = "",
  trend = null, // { value: 12, direction: 'up' | 'down' | 'neutral' }
  color = "green",
  delay = 0
}) => {
  const colorClasses = {
    green: {
      icon: 'text-green-400',
      bg: 'bg-green-500/10',
      border: 'border-green-500/20',
      text: 'text-green-400'
    },
    blue: {
      icon: 'text-blue-400',
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/20',
      text: 'text-blue-400'
    },
    amber: {
      icon: 'text-amber-400',
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/20',
      text: 'text-amber-400'
    },
    red: {
      icon: 'text-red-400',
      bg: 'bg-red-500/10',
      border: 'border-red-500/20',
      text: 'text-red-400'
    },
    purple: {
      icon: 'text-purple-400',
      bg: 'bg-purple-500/10',
      border: 'border-purple-500/20',
      text: 'text-purple-400'
    }
  };

  const trendIcons = {
    up: TrendingUp,
    down: TrendingDown,
    neutral: Minus
  };

  const trendColors = {
    up: 'text-green-400',
    down: 'text-red-400',
    neutral: 'text-slate-400'
  };

  const colors = colorClasses[color] || colorClasses.green;
  const TrendIcon = trend ? trendIcons[trend.direction] : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
    >
      <GlassCard className="p-6 h-full">
        <div className="flex items-start justify-between mb-4">
          <div className={`p-3 rounded-xl ${colors.bg} border ${colors.border}`}>
            <Icon className={`w-6 h-6 ${colors.icon}`} />
          </div>
          
          {trend && (
            <div className={`flex items-center gap-1 text-sm font-semibold ${trendColors[trend.direction]}`}>
              <TrendIcon className="w-4 h-4" />
              <span>{trend.value}%</span>
            </div>
          )}
        </div>

        <div>
          <p className="text-sm text-slate-600 dark:text-slate-400 dark:text-slate-500 mb-1 font-medium">
            {label}
          </p>
          <div className="flex items-baseline gap-2">
            <h3 className={`text-3xl font-bold ${colors.text}`}>
              {value}
            </h3>
            {unit && (
              <span className="text-lg text-slate-600 dark:text-slate-400 dark:text-slate-500 font-medium">
                {unit}
              </span>
            )}
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
};

export default StatCard;
