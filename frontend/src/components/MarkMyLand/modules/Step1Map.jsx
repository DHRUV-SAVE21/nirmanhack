import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, MousePointer2, Trash2 } from 'lucide-react';
import LandMap from '../LandMap';

const Step1Map = ({ onPolygonChange, existingLands, handleClearMap, submitLand, polygon, loading, t }) => {
  return (
    <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.3 }}
        className="space-y-6"
    >
        <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400"><MapPin size={24} /></div>
            <div>
                <h2 className="text-2xl font-bold text-white">Select Your Land</h2>
                <p className="text-sm text-slate-400">Use the interactive map or tracking mode to define your plot boundaries.</p>
            </div>
        </div>

        <div className="bg-slate-900/80 p-2 rounded-[2rem] border border-slate-800 shadow-2xl backdrop-blur-xl overflow-hidden min-h-[450px]">
            <LandMap onPolygonChange={onPolygonChange} otherLands={existingLands} onClear={handleClearMap} />
        </div>

        <div className="flex items-center justify-between mt-8 p-6 bg-blue-500/10 rounded-2xl border border-blue-500/20">
            <div className="flex items-center gap-4 text-sm text-blue-400 font-medium">
                <MousePointer2 size={18} className="animate-bounce" />
                <span>Mark at least 3 points to define your land area precisely.</span>
            </div>
            <button
                onClick={submitLand}
                disabled={loading || polygon.length < 3}
                className={`flex items-center gap-3 px-10 py-5 rounded-3xl font-black shadow-2xl transition-all transform hover:-translate-y-1 active:scale-95 ${
                    loading || polygon.length < 3 
                        ? 'bg-slate-800 text-slate-500 cursor-not-allowed grayscale' 
                        : 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600 shadow-emerald-500/40'
                }`}
            >
                {loading ? (
                    <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Recording Plot...
                    </>
                ) : (
                    <>Save & Continue</>
                )}
            </button>
        </div>
    </motion.div>
  );
};

export default Step1Map;
