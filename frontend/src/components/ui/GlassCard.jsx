import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';

const GlassCard = ({ 
  children, 
  className = "",
  hover = true,
  gradient = false,
  blur = "md",
  ...props 
}) => {
  const blurClasses = {
    sm: 'backdrop-blur-sm',
    md: 'backdrop-blur-md',
    lg: 'backdrop-blur-lg',
    xl: 'backdrop-blur-xl'
  };

  return (
    <motion.div
      whileHover={hover ? { scale: 1.02, y: -4 } : {}}
      transition={{ duration: 0.2 }}
      className={cn(
        "relative rounded-2xl border border-white/10",
        "bg-white/5 dark:bg-white/5",
        blurClasses[blur],
        "shadow-xl shadow-black/5",
        gradient && "bg-gradient-to-br from-white/10 to-white/5",
        hover && "hover:border-white/20 hover:shadow-2xl hover:shadow-black/10",
        "transition-all duration-300",
        className
      )}
      {...props}
    >
      {/* Inner glow effect */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </motion.div>
  );
};

export default GlassCard;
