import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

const ProgressIndicator = ({ currentStep, steps }) => {
  return (
    <div className="flex items-center justify-between w-full max-w-4xl mx-auto mb-12 px-4">
      {steps.map((step, idx) => {
        const isCompleted = currentStep > step.id;
        const isActive = currentStep === step.id;
        
        return (
          <React.Fragment key={step.id}>
            {/* Step Circle */}
            <div className="relative flex flex-col items-center">
              <motion.div
                initial={false}
                animate={{
                  backgroundColor: isCompleted ? '#22c55e' : isActive ? '#3b82f6' : '#1e293b',
                  scale: isActive ? 1.2 : 1,
                }}
                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors duration-300 ${isCompleted ? 'border-green-500' : isActive ? 'border-blue-500' : 'border-slate-700'}`}
              >
                {isCompleted ? (
                   <Check className="text-white w-6 h-6" />
                ) : (
                  <span className={`text-sm font-bold ${isActive ? 'text-white' : 'text-slate-400'}`}>{step.id}</span>
                )}
              </motion.div>
              <div className="absolute -bottom-6 w-max text-[10px] font-bold uppercase tracking-widest text-slate-500">
                {step.label}
              </div>
            </div>

            {/* Connector Line */}
            {idx < steps.length - 1 && (
              <div className="flex-1 h-[2px] mx-2 bg-slate-800 relative overflow-hidden">
                <motion.div
                  initial={{ width: '0%' }}
                  animate={{ width: isCompleted ? '100%' : '0%' }}
                  transition={{ duration: 0.5 }}
                  className="absolute top-0 left-0 h-full bg-green-500"
                />
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default ProgressIndicator;
