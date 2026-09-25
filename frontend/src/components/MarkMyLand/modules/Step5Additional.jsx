import React from 'react';
import { motion } from 'framer-motion';
import { FileText, CheckCircle, ShieldCheck, UploadCloud, ArrowRight } from 'lucide-react';

const Step5Additional = ({ landData, additionalDocs, setAdditionalDocs, t }) => {
    const [isFinalizing, setIsFinalizing] = React.useState(false);
    const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

    const handleFinalize = async () => {
        if (!additionalDocs.sevenTwelve || !additionalDocs.khataUtara) {
            alert("Please upload both 7/12 Extract and Khata Utara to finalize.");
            return;
        }

        setIsFinalizing(true);
        try {
            // Upload 7/12
            const formData712 = new FormData();
            formData712.append('file', additionalDocs.sevenTwelve);
            await fetch(`${apiBase}/api/feature1/document/upload?land_id=${landData.id}&document_type=7/12 Extract`, {
                method: 'POST',
                body: formData712,
            });

            // Upload Khata Utara
            const formDataKhata = new FormData();
            formDataKhata.append('file', additionalDocs.khataUtara);
            await fetch(`${apiBase}/api/feature1/document/upload?land_id=${landData.id}&document_type=Khata Utara`, {
                method: 'POST',
                body: formDataKhata,
            });

            alert("Final Documents Uploaded & Registration Finalized Successfully!");
            window.location.reload(); // Refresh to show updated status
        } catch (error) {
            console.error("Finalization failed:", error);
            alert("Finalization failed: " + error.message);
        } finally {
            setIsFinalizing(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.5, type: 'spring' }}
            className="space-y-10 max-w-4xl mx-auto py-12"
        >
            <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-4">
                <div className="flex items-center gap-5">
                    <div className="w-16 h-16 bg-blue-500/10 rounded-3xl flex items-center justify-center text-blue-500 shadow-xl shadow-blue-500/10 border border-blue-500/10">
                        <FileText size={28} />
                    </div>
                    <div>
                       <h2 className="text-3xl font-black text-white tracking-tight leading-none mb-2">Final Documents</h2>
                       <p className="text-sm text-slate-400 font-medium">Please provide the final legal documents to complete your registry record.</p>
                    </div>
                </div>
                <div className="px-6 py-3 bg-slate-900 border border-slate-800 rounded-full flex items-center gap-3">
                   <ShieldCheck className="text-blue-500 w-5 h-5" />
                   <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest leading-none">KYC COMPLIANT SECURED</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {[ 
                    { id: '712', name: '7/12 Extract', desc: 'Ownership and plot history', ref: 'sevenTwelve' },
                    { id: 'khata', name: 'Khata Utara', desc: 'Holdings and tax history', ref: 'khataUtara' }
                ].map((doc, idx) => (
                    <div key={doc.id} className="group relative bg-slate-900 border border-slate-800 rounded-[3rem] p-10 shadow-2xl hover:border-blue-500/40 transition-all flex flex-col items-center text-center space-y-6">
                        {/* Animated Gradient Border */}
                        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-blue-500 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        
                        <div className="w-20 h-20 rounded-3xl bg-slate-800/80 flex items-center justify-center text-blue-400 font-black text-2xl border border-white/5 shadow-xl group-hover:scale-105 transition-transform group-hover:bg-slate-800">
                           {idx + 1}
                        </div>
                        
                        <div>
                            <div className="text-2xl font-black text-white italic tracking-tight mb-1">{doc.name}</div>
                            <div className="text-xs text-slate-500 font-medium">{doc.desc}</div>
                        </div>

                        <div className="w-full">
                            <input type="file" id={`${doc.id}-upload`} className="hidden" onChange={(e) => setAdditionalDocs(prev => ({ ...prev, [doc.ref]: e.target.files[0] }))} />
                            <button 
                                onClick={() => document.getElementById(`${doc.id}-upload`).click()} 
                                className={`w-full py-5 font-black rounded-3xl shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3 text-xs uppercase tracking-widest ${
                                    additionalDocs[doc.ref] 
                                        ? 'bg-emerald-600 text-white shadow-emerald-500/20' 
                                        : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/20'
                                }`}
                            >
                                {additionalDocs[doc.ref] ? (
                                    <>
                                        <CheckCircle size={18} />
                                        <span>File Attached ✓</span>
                                    </>
                                ) : (
                                    <>
                                        <UploadCloud size={18} className="animate-bounce" />
                                        <span>Upload Document</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <div className="pt-8 flex flex-col items-center">
                <button 
                    onClick={handleFinalize} 
                    disabled={isFinalizing}
                    className="w-full max-w-xl py-6 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black rounded-[2.5rem] shadow-[0_25px_60px_rgba(16,185,129,0.3)] transition-all transform hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-4 text-sm uppercase tracking-[0.2em] disabled:opacity-50"
                >
                    {isFinalizing ? (
                        "Processing Final Registry..."
                    ) : (
                        <>
                            <ArrowRight size={20} className="animate-pulse" /> Finalize Land Registry Entry
                        </>
                    )}
                </button>
                <p className="text-[10px] text-slate-500 mt-6 font-black uppercase tracking-[0.3em] flex items-center gap-2">
                    <ShieldCheck size={14} className="text-emerald-500" /> Authorized Registry Submission Flow
                </p>
            </div>
        </motion.div>
  );
};

export default Step5Additional;
