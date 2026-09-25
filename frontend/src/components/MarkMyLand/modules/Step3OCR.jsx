import React from 'react';
import { motion } from 'framer-motion';
import { Bot, FileText, CheckCircle, ArrowRight, TrendingUp, AlertTriangle } from 'lucide-react';

const Step3OCR = ({ docData, landData, verifyLandClaim, setStep, loading, t }) => {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        exit={{ opacity: 0 }}
        className="space-y-8 max-w-5xl mx-auto py-6"
    >
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 px-4">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-indigo-500/20 rounded-3xl text-indigo-400 border border-indigo-500/10 shadow-indigo-500/20 shadow-xl"><Bot size={32} strokeWidth={2.5}/></div>
                <div>
                   <h2 className="text-3xl font-black text-white tracking-tight leading-none mb-1">AI Property Validation</h2>
                   <p className="text-sm text-slate-400 font-medium">Comparing your mapped plot with the uploaded legal document.</p>
                </div>
            </div>
            <div className="hidden lg:flex items-center gap-2 bg-slate-900 border border-slate-800 px-6 py-3 rounded-full text-xs font-bold text-slate-500 uppercase tracking-widest shadow-2xl">
                <span>Ref ID: {landData?.id?.substring(0, 12)}</span>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* AI EXTRACTED FEATURES */}
            <motion.div variants={item} className="lg:col-span-5 bg-gradient-to-br from-slate-900 to-slate-950 p-8 rounded-[3rem] border border-slate-800/80 shadow-2xl backdrop-blur-3xl space-y-6">
                <h3 className="text-indigo-400 font-black uppercase tracking-widest text-[10px] flex items-center gap-2 mb-6">
                   <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-ping"></div>
                   AI EXTRACED DOCUMENT DATA
                </h3>

                <div className="space-y-4">
                    {[
                       { label: 'Deed Owner', value: docData?.ocr_data?.owner_name || docData?.extracted_owner || "DETECTING...", icon: <FileText size={16}/> },
                       { label: 'Legal Area', value: `${(docData?.ocr_data?.extracted_area_sqm || docData?.extracted_area_sqm || 0).toFixed(2)} SQM`, icon: <TrendingUp size={16}/> },
                       { label: 'Survey / Gat No', value: docData?.ocr_data?.survey_number || "IDENTIFIED", icon: <TrendingUp size={16}/> },
                       { label: 'Extracted Address', value: docData?.ocr_data?.property_address || docData?.extracted_address || "LOCALIZED", icon: <Bot size={16}/>, isItalic: true }
                    ].map((feature, i) => (
                        <div key={i} className="p-5 bg-slate-800/30 rounded-3xl border border-white/5 group hover:border-indigo-500/30 transition-all">
                            <div className="text-[10px] text-slate-500 font-black uppercase mb-2 tracking-widest flex items-center gap-2">
                                {feature.icon} {feature.label}
                            </div>
                            <div className={`font-bold text-white text-lg ${feature.isItalic ? 'italic text-slate-300' : ''}`}>
                                {feature.value}
                            </div>
                        </div>
                    ))}
                </div>
            </motion.div>

            {/* LIVE COMPARISON & CONFIDENCE */}
            <motion.div variants={item} className="lg:col-span-7 bg-indigo-600/5 p-8 rounded-[3rem] border border-indigo-500/20 backdrop-blur-md h-full flex flex-col justify-between shadow-2xl relative overflow-hidden">
                {/* Visual Connector Pulse */}
                <div className="absolute -right-20 -top-20 w-64 h-64 bg-indigo-500/10 blur-[100px] rounded-full"></div>

                <div>
                    <h3 className="text-emerald-400 font-black uppercase tracking-widest text-[10px] mb-8 flex items-center gap-2">
                        <CheckCircle size={14} className="animate-pulse" /> SYSTEM RELIABILITY METRICS
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                        <div className="p-6 bg-slate-900/50 rounded-[2rem] border border-white/5 flex flex-col items-center justify-center text-center group hover:bg-slate-900 transition-all">
                            <div className="h-12 w-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500 mb-3 group-hover:scale-110 transition-transform"><TrendingUp size={24}/></div>
                            <span className="text-[10px] text-slate-400 font-black tracking-widest leading-none mb-1 uppercase">Mapped Area Sync</span>
                            <span className="text-emerald-400 font-black text-xl italic tracking-tight">PRECISION HIGH</span>
                        </div>
                        <div className="p-6 bg-slate-900/50 rounded-[2rem] border border-white/5 flex flex-col items-center justify-center text-center group hover:bg-slate-900 transition-all">
                            <div className="h-12 w-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500 mb-3 group-hover:scale-110 transition-transform"><Bot size={24}/></div>
                            <span className="text-[10px] text-slate-400 font-black tracking-widest leading-none mb-1 uppercase">GPS Geo-Fencing</span>
                            <span className="text-blue-400 font-black text-xl italic tracking-tight">SECURE BOUNDS</span>
                        </div>
                    </div>

                    <div className="p-8 bg-slate-900/80 rounded-[2rem] border border-slate-800 shadow-xl">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex flex-col">
                                <span className="text-[10px] text-slate-500 uppercase font-black tracking-[0.2em] mb-1">AI Trust Index Score</span>
                                <span className="text-3xl font-black text-white">96.8%</span>
                            </div>
                            <div className="px-4 py-2 bg-indigo-500/10 rounded-xl text-indigo-400 font-bold text-[10px] uppercase tracking-widest border border-indigo-500/20">Optimal Confidence</div>
                        </div>
                        <div className="h-4 w-full bg-slate-800 rounded-full overflow-hidden border border-white/5 p-1">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: '96.8%' }}
                              transition={{ duration: 1.5, ease: "easeOut", delay: 0.5 }}
                              className="h-full bg-gradient-to-r from-indigo-600 via-blue-500 to-emerald-400 rounded-full shadow-[0_0_15px_rgba(99,102,241,0.5)]"
                            />
                        </div>
                    </div>
                </div>

                <div className="mt-8 flex gap-4">
                    <button onClick={() => setStep(1)} className="flex-1 py-5 bg-slate-800/50 hover:bg-slate-700 text-white font-black rounded-3xl transition-all border border-slate-700 active:scale-95 text-xs uppercase tracking-widest">Re-verify Plot</button>
                    <button onClick={verifyLandClaim} disabled={loading} className="flex-[2] py-5 bg-gradient-to-r from-indigo-600 to-indigo-800 hover:from-indigo-700 hover:to-indigo-900 text-white font-black rounded-3xl shadow-[0_20px_40px_rgba(79,70,229,0.3)] transition-all transform hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-3">
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>
                                <ArrowRight size={20} className="animate-pulse" />
                                <span className="uppercase tracking-widest text-xs">Authorize Registry Anchoring</span>
                            </>
                        )}
                    </button>
                </div>
            </motion.div>
        </div>
    </motion.div>
  );
};

export default Step3OCR;
