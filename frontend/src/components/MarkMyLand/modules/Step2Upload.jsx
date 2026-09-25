import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, CloudUpload, CheckCircle, AlertCircle } from 'lucide-react';
import DocumentUpload from '../DocumentUpload';

const Step2Upload = ({ landData, handleUploadComplete, loading, t }) => {
  return (
    <motion.div
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -50 }}
        transition={{ duration: 0.4, type: 'spring' }}
        className="space-y-8 max-w-2xl mx-auto py-12"
    >
        <div className="flex flex-col items-center text-center gap-4 mb-4">
            <div className="w-20 h-20 bg-blue-500/10 rounded-3xl flex items-center justify-center text-blue-500 shadow-xl shadow-blue-500/10">
                <FileText size={40} />
            </div>
            <div>
                <h2 className="text-3xl font-black text-white tracking-tight">Upload Registered Deed</h2>
                <p className="text-slate-400 mt-2">Provide the official document for this plot (PDF or JPEG) to start AI verification.</p>
            </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-[3rem] p-10 shadow-2xl relative overflow-hidden group">
            {/* Animated Glow Effect */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-teal-400 to-blue-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-700 origin-left" />

            <div className="space-y-6">
                <DocumentUpload landId={landData?.id} onUploadComplete={handleUploadComplete} />
            </div>
            
            <div className="mt-8 grid grid-cols-2 gap-4">
                <div className="bg-slate-800/40 p-4 rounded-2xl flex items-center gap-3 border border-slate-700/50">
                    <CheckCircle className="text-green-500 w-5 h-5 flex-shrink-0" />
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">PDF, JPG, PNG Supported</span>
                </div>
                <div className="bg-slate-800/40 p-4 rounded-2xl flex items-center gap-3 border border-slate-700/50">
                    <CheckCircle className="text-green-500 w-5 h-5 flex-shrink-0" />
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Max Size: 10MB</span>
                </div>
            </div>
        </div>

        <div className="flex items-center gap-2 text-amber-400 text-xs justify-center bg-amber-400/5 py-3 rounded-full border border-amber-400/10">
            <AlertCircle size={14} />
            <span>Ensure the text is clearly visible for the AI agent to extract accurate data.</span>
        </div>
    </motion.div>
  );
};

export default Step2Upload;
