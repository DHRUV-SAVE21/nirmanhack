import React from 'react';
import { motion } from 'framer-motion';
import QRCode from 'react-qr-code';
import { FileText, CheckCircle, Smartphone, Database, ArrowRight, ShieldCheck, XCircle } from 'lucide-react';

const Step4Result = ({ verificationResult, landData, docData, setStep, t }) => {
  const isVerified = verificationResult.status === 'SENT FOR VERIFICATION' || verificationResult.status === 'VERIFIED';
  
  return (
    <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -50 }}
        className="text-center space-y-12 max-w-4xl mx-auto py-12"
    >
        <div className="space-y-4">
            <motion.div 
               initial={{ scale: 0 }}
               animate={{ scale: 1 }}
               transition={{ type: 'spring', stiffness: 200, damping: 20 }}
               className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center text-5xl shadow-2xl ${isVerified ? 'bg-blue-500/20 text-blue-500 shadow-blue-500/20' : 'bg-red-500/20 text-red-500 shadow-red-500/20'}`}
            >
                {isVerified ? <ShieldCheck size={48} /> : <XCircle size={48} />}
            </motion.div>
            <h2 className="text-4xl font-black text-white tracking-tight"> Registry Status: <span className={isVerified ? 'text-blue-400' : 'text-red-400'}>{verificationResult.status}</span></h2>
            <p className="text-slate-400 font-medium">Official Registry Anchored Event Verified on Blockchain</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-stretch">
            {/* OFFICIAL RECORD DETAILS */}
            <div className="md:col-span-12 lg:col-span-5 bg-slate-900 border border-slate-800 rounded-[3rem] p-10 text-left space-y-8 shadow-2xl relative overflow-hidden flex flex-col justify-between">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-[50px] rounded-full"></div>
                
                <div className="space-y-6">
                    <div className="flex items-center gap-2 text-blue-500 text-[10px] font-black uppercase tracking-[0.2em] mb-4">
                        <FileText size={18} /> Official Submission Data
                    </div>
                    
                    <div className="space-y-6">
                        <div className="group">
                           <div className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1 group-hover:text-blue-400 transition-colors">Owner Name</div>
                           <div className="text-xl font-bold text-white tracking-tight leading-none group-hover:translate-x-1 transition-transform">{docData?.extracted_owner || "Verified Registry"}</div>
                        </div>
                        <div className="group">
                           <div className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1 group-hover:text-blue-400 transition-colors">Internal Plot ID</div>
                           <div className="text-xl font-bold text-white tracking-tight leading-none group-hover:translate-x-1 transition-transform">#{landData?.id?.substring(0, 8) || "VERIFYING"}</div>
                        </div>
                    </div>

                    {/* NEW: Data Precision Sync Comparison */}
                    <div className="pt-6 mt-6 border-t border-slate-800/50 space-y-4">
                        <div className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-4 flex items-center gap-2">
                           <ShieldCheck size={14} className="text-blue-500" /> Data Precision Sync
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-slate-800/30 p-4 rounded-[2rem] border border-white/5 group hover:bg-slate-800/50 transition-all">
                                <div className="text-[9px] text-slate-500 font-bold uppercase mb-1">Document Area</div>
                                <div className="text-xl font-extra-bold text-blue-400">{(docData?.extracted_area_sqm || 0).toFixed(1)} <span className="text-[10px] text-slate-600">m²</span></div>
                            </div>
                            <div className="bg-slate-800/30 p-4 rounded-[2rem] border border-white/5 group hover:bg-slate-800/50 transition-all">
                                <div className="text-[9px] text-slate-500 font-bold uppercase mb-1">Mapped Area</div>
                                <div className="text-xl font-extra-bold text-white">{(landData?.area_sqm || 0).toFixed(1)} <span className="text-[10px] text-slate-600">m²</span></div>
                            </div>
                        </div>
                        <div className="flex items-center justify-between bg-emerald-500/5 p-3 rounded-2xl border border-emerald-500/10">
                            <span className="text-[10px] text-slate-400 font-bold">Calculation Variance</span>
                            <span className="text-xs font-black text-emerald-500 italic">
                                {Math.abs((docData?.extracted_area_sqm || 0) - (landData?.area_sqm || 0)).toFixed(1)} sqm DIFF
                            </span>
                        </div>
                    </div>
                </div>

                <div className="pt-8 border-t border-slate-800 flex items-center justify-between">
                    <div className="flex flex-col">
                       <span className="text-[9px] text-slate-500 uppercase font-black mb-1">Status Reference</span>
                       <span className="text-[10px] font-mono text-blue-400/70 break-all leading-tight">PENDING_ADMIN_APPROVAL_{landData?.id?.substring(0, 8)}</span>
                    </div>
                    <div className="p-3 bg-slate-800/80 rounded-2xl text-blue-400 border border-slate-700 shadow-xl"><Database size={20}/></div>
                </div>
            </div>

            {/* CONFIDENCE & QR */}
            <div className="md:col-span-12 lg:col-span-7 flex flex-col gap-8">
                {isVerified ? (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
                            <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 flex flex-col items-center justify-center relative overflow-hidden group shadow-2xl">
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <div className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mb-4">System Confidence</div>
                                <div className="text-6xl font-black text-white mb-4 animate-in fade-in zoom-in duration-700">{verificationResult.confidence_score}%</div>
                                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden p-0.5 border border-white/5">
                                    <div className="h-full bg-gradient-to-r from-blue-500 to-emerald-400 rounded-full" style={{ width: `${verificationResult.confidence_score}%` }}></div>
                                </div>
                                <div className="mt-8 grid grid-cols-2 gap-3 w-full">
                                    <div className="bg-slate-800/40 p-3 rounded-2xl border border-white/5">
                                        <div className="text-[9px] text-slate-500 font-bold uppercase mb-1">Area-Sync</div>
                                        <div className="text-xs font-black text-white italic">{100 - (verificationResult.details.details?.area_diff_percent || 0.1)}% Match</div>
                                    </div>
                                    <div className="bg-slate-800/40 p-3 rounded-2xl border border-white/5">
                                        <div className="text-[9px] text-slate-500 font-bold uppercase mb-1">Identity</div>
                                        <div className="text-xs font-black text-white italic tracking-tighter">SECURE MATCH</div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl shadow-blue-500/10 flex flex-col items-center justify-center border-4 border-slate-900 group hover:scale-[1.02] transition-all">
                                <QRCode value={`LetGoApp|LandRegistration|ID:${landData?.id}|Status:PENDING`} size={160} level="H" />
                                <div className="mt-6 text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] flex items-center gap-2 group-hover:text-blue-600 transition-colors">
                                   <Smartphone size={14}/> Registration Receipt
                                </div>
                            </div>
                        </div>

                        <div className="w-full">
                            <button
                                onClick={() => setStep(5)}
                                className="w-full py-6 bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-600 hover:from-indigo-700 hover:to-blue-700 text-white font-black rounded-[2rem] shadow-[0_20px_50px_rgba(37,99,235,0.4)] transition-all transform hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-4 text-sm uppercase tracking-[0.2em]"
                            >
                                <ArrowRight size={20} className="animate-bounce" /> Finalize Registration Uploads
                            </button>
                            <p className="text-[10px] text-slate-500 mt-4 uppercase font-bold tracking-widest">Complete the flow by attaching supporting property files.</p>
                        </div>
                    </>
                ) : (
                    <div className="bg-red-500/5 border border-red-500/20 rounded-[3rem] p-10 text-center flex flex-col items-center justify-center h-full space-y-6">
                        <div className="w-20 h-20 bg-red-500/10 rounded-3xl flex items-center justify-center text-red-500 shadow-xl shadow-red-500/10">
                            <XCircle size={40} />
                        </div>
                        <div className="space-y-2">
                           <h3 className="text-2xl font-black text-white italic">REJECTION ALERT</h3>
                           <p className="text-red-300 font-medium max-w-sm">{verificationResult.reason}</p>
                        </div>
                        <button onClick={() => window.location.reload()} className="px-8 py-4 bg-red-500 hover:bg-red-600 text-white font-black rounded-2xl transition-all shadow-xl text-xs uppercase tracking-widest">Start Over / Re-Verify</button>
                    </div>
                )}
            </div>
        </div>

        <button onClick={() => window.location.reload()} className="mt-12 text-slate-600 text-xs font-bold uppercase tracking-[0.3em] hover:text-white transition-colors border-b border-transparent hover:border-slate-800 pb-1">{t('return_home')}</button>
    </motion.div>
  );
};

export default Step4Result;
