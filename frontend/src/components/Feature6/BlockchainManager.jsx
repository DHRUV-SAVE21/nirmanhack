import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus, Droplets, Sprout, Bug, QrCode, ArrowRight, ShieldCheck,
    Leaf, Loader2, ThermometerSun, Calendar, Activity, Database, CheckCircle2
} from 'lucide-react';
import QRCode from 'react-qr-code';
import { getApiUrl, getFrontendUrl } from '../../config/api';

const BlockchainManager = () => {
    const { t } = useTranslation();
    const [batches, setBatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedBatch, setSelectedBatch] = useState(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEventModal, setShowEventModal] = useState(false);
    const [showQRModal, setShowQRModal] = useState(false);

    // Auth context - get from face login or fallback
    const [farmerId, setFarmerId] = useState(() => {
        const saved = localStorage.getItem('user');
        if (saved) {
            try { return JSON.parse(saved).id || "user-123-demo"; } catch (e) { return "user-123-demo"; }
        }
        return "user-123-demo";
    });

    const [eventNote, setEventNote] = useState("");

    // Fetch Batches
    const fetchBatches = async () => {
        try {
            const response = await fetch(getApiUrl(`api/feature6/list/${farmerId}`));
            const data = await response.json();
            setBatches(Array.isArray(data) ? data : []);
        } catch (e) {
            console.error("Error fetching batches:", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBatches();
    }, []);

    // Create Batch
    const handleCreateBatch = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const payload = {
            farmer_id: farmerId,
            crop_name: formData.get('crop_name'),
            variety: formData.get('variety'),
            quantity: parseFloat(formData.get('quantity')),
            price_per_quintal: parseFloat(formData.get('price'))
        };

        await fetch(getApiUrl('api/feature6/batch/create'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        setShowCreateModal(false);
        fetchBatches();
    };

    // Add Event
    const handleAddEvent = async (type, details) => {
        if (!selectedBatch) return;

        await fetch(getApiUrl('api/feature6/event/add'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                batch_id: selectedBatch.batch_id,
                event_type: type,
                details: details
            })
        });

        alert(`✅ ${type} ${t('recorded_successfully')}`);
        setEventNote("");
        setShowEventModal(false);
        // NEW: Automatically show the QR Passport after activity is logged
        setShowQRModal(true);
    };

    return (
        <div className="min-h-screen w-full bg-[#050b14] relative overflow-hidden font-sans text-slate-200 pb-20">

            {/* Background Ambience */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[100px] pointer-events-none"></div>

            <div className="relative z-10 max-w-7xl mx-auto px-6 pt-24">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20 text-emerald-400">
                                <Database size={24} />
                            </div>
                            <span className="text-emerald-500 font-mono tracking-widest text-xs uppercase font-bold">{t('immutable_ledger_active')}</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white tracking-tight">
                            Farm <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">Inventory</span>
                        </h1>
                        <p className="text-slate-600 dark:text-slate-400 mt-2 max-w-xl text-lg">
                            {t('log_produce_securely')}
                        </p>
                    </div>

                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="group relative px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-2xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] flex items-center gap-3 overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                        <Plus size={24} />
                        <span className="relative z-10">{t('add_new_crop_batch')}</span>
                    </button>
                </div>

                {/* Content Grid */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-32 space-y-4">
                        <Loader2 className="animate-spin text-emerald-500" size={48} />
                        <p className="text-emerald-500/50 font-mono text-sm animate-pulse">{t('syncing_blockchain')}</p>
                    </div>
                ) : batches.length === 0 ? (
                    <div className="bg-white dark:bg-white/5 shadow-sm dark:shadow-none border border-dashed border-slate-200 dark:border-white/10 rounded-3xl p-16 text-center max-w-2xl mx-auto">
                        <Sprout size={64} className="mx-auto text-slate-600 mb-6" />
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{t('no_active_batches')}</h3>
                        <p className="text-slate-600 dark:text-slate-400 mb-8">{t('start_adding_batch')}</p>
                        <button onClick={() => setShowCreateModal(true)} className="text-emerald-400 hover:text-emerald-300 font-bold underline underline-offset-4">{t('create_batch_now')}</button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {batches.map((batch, idx) => (
                            <motion.div
                                key={batch.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                className="group relative bg-[#0f1522] border border-slate-200 dark:border-white/10 hover:border-emerald-500/50 rounded-3xl p-6 transition-all duration-300 hover:shadow-2xl hover:shadow-emerald-900/20 overflow-hidden"
                            >
                                {/* Glow Effect */}
                                <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-[60px] group-hover:bg-emerald-500/20 transition-all"></div>

                                {/* Status Tag */}
                                <div className="flex justify-between items-start mb-6 relative z-10">
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${batch.status === 'growing' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                        'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                        }`}>
                                        ● {batch.status}
                                    </span>
                                    <div className="text-right">
                                        <div className="text-[10px] text-slate-500 uppercase font-bold text-right mb-1">Batch ID</div>
                                        <div className="font-mono text-xs text-slate-700 dark:text-slate-300 bg-white dark:bg-white/5 shadow-sm dark:shadow-none px-2 py-1 rounded border border-slate-200 dark:border-white/5 truncate max-w-[120px]">
                                            {batch.batch_id}
                                        </div>
                                    </div>
                                </div>

                                {/* Main Info */}
                                <div className="mb-8 relative z-10">
                                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-1 group-hover:text-emerald-400 transition-colors">{batch.crop_name}</h3>
                                    <p className="text-slate-600 dark:text-slate-400 text-sm">{batch.variety} Variety</p>
                                </div>

                                {/* Metrics */}
                                <div className="grid grid-cols-2 gap-4 mb-8 relative z-10">
                                    <div className="bg-white dark:bg-white/5 shadow-sm dark:shadow-none rounded-xl p-3 border border-slate-200 dark:border-white/5">
                                        <div className="text-xs text-slate-500 mb-1">Quantity</div>
                                        <div className="text-lg font-bold text-slate-900 dark:text-white">{batch.quantity} <span className="text-sm text-slate-600 dark:text-slate-400 font-normal">Q</span></div>
                                    </div>
                                    <div className="bg-white dark:bg-white/5 shadow-sm dark:shadow-none rounded-xl p-3 border border-slate-200 dark:border-white/5">
                                        <div className="text-xs text-slate-500 mb-1">Harvest Est.</div>
                                        <div className="text-lg font-bold text-slate-900 dark:text-white">-</div>
                                    </div>
                                </div>

                                {/* Action Bar */}
                                <div className="flex items-center gap-3 relative z-10">
                                    <button
                                        onClick={() => { setSelectedBatch(batch); setShowEventModal(true); }}
                                        className="flex-1 py-3 bg-white dark:bg-white/5 shadow-sm dark:shadow-none hover:bg-emerald-500/20 border border-slate-200 dark:border-white/10 hover:border-emerald-500/50 rounded-xl font-bold text-sm text-slate-700 dark:text-slate-300 hover:text-emerald-400 transition-all flex items-center justify-center gap-2"
                                    >
                                        <Activity size={16} /> Log Activity
                                    </button>
                                    <button
                                        onClick={() => { setSelectedBatch(batch); setShowQRModal(true); }}
                                        className="w-12 h-12 flex items-center justify-center bg-blue-600/20 border border-blue-500/30 rounded-xl text-blue-400 hover:bg-blue-600 hover:text-white transition-all shadow-lg hover:shadow-blue-500/30"
                                        title="Generate Trust Passport"
                                    >
                                        <QrCode size={20} />
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            {/* --- MODALS --- */}

            {/* CREATE BATCH MODAL */}
            <AnimatePresence>
                {showCreateModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-[#151b2b] border border-slate-200 dark:border-white/10 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl relative"
                        >
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-cyan-500"></div>
                            <div className="p-8">
                                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Initialize New Batch</h2>
                                <p className="text-slate-600 dark:text-slate-400 text-sm mb-8">This will generate a Genesis Block on the blockchain.</p>

                                <form onSubmit={handleCreateBatch} className="space-y-6">
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-xs font-bold text-slate-500 uppercase ml-1">Crop Name</label>
                                            <input name="crop_name" placeholder="e.g. Wheat" className="w-full bg-black/30 border border-slate-200 dark:border-white/10 rounded-xl p-4 text-slate-900 dark:text-white focus:border-emerald-500/50 outline-none focus:ring-1 focus:ring-emerald-500/50 transition-all" required />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-slate-500 uppercase ml-1">Variety Name</label>
                                            <input name="variety" placeholder="e.g. Lokwan" className="w-full bg-black/30 border border-slate-200 dark:border-white/10 rounded-xl p-4 text-slate-900 dark:text-white focus:border-emerald-500/50 outline-none focus:ring-1 focus:ring-emerald-500/50 transition-all" required />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-xs font-bold text-slate-500 uppercase ml-1">Quantity (Quintal)</label>
                                                <input name="quantity" type="number" placeholder="0.0" className="w-full bg-black/30 border border-slate-200 dark:border-white/10 rounded-xl p-4 text-slate-900 dark:text-white focus:border-emerald-500/50 outline-none focus:ring-1 focus:ring-emerald-500/50 transition-all" required />
                                            </div>
                                            <div>
                                                <label className="text-xs font-bold text-slate-500 uppercase ml-1">Price / Quintal</label>
                                                <input name="price" type="number" placeholder="₹" className="w-full bg-black/30 border border-slate-200 dark:border-white/10 rounded-xl p-4 text-slate-900 dark:text-white focus:border-emerald-500/50 outline-none focus:ring-1 focus:ring-emerald-500/50 transition-all" required />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-4 pt-4">
                                        <button type="button" onClick={() => setShowCreateModal(false)} className="px-6 py-4 rounded-xl font-bold text-slate-600 dark:text-slate-400 hover:text-white hover:bg-white/5 transition-all">Cancel</button>
                                        <button type="submit" className="flex-1 py-4 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 rounded-xl font-bold text-white shadow-lg shadow-emerald-900/40 transition-all">
                                            Secure & Create Batch
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* LOG ACTIVITY MODAL */}
            <AnimatePresence>
                {showEventModal && selectedBatch && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                        <motion.div
                            initial={{ y: 50, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 50, opacity: 0 }}
                            className="bg-[#151b2b] border border-slate-200 dark:border-white/10 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl"
                        >
                            <div className="p-8">
                                <div className="flex justify-between items-start mb-8">
                                    <div>
                                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-1"><span className="text-emerald-500">Log Activity</span> to Ledger</h2>
                                        <p className="text-slate-600 dark:text-slate-400 text-sm">Target Batch: <span className="font-mono text-slate-900 dark:text-white">{selectedBatch.crop_name} ({selectedBatch.batch_id})</span></p>
                                    </div>
                                    <div className="p-3 bg-white dark:bg-white/5 shadow-sm dark:shadow-none rounded-full border border-slate-200 dark:border-white/10">
                                        <Database size={24} className="text-emerald-500 animate-pulse" />
                                    </div>
                                </div>

                                <div className="mb-6">
                                    <label className="text-xs font-bold text-slate-500 uppercase ml-1 mb-2 block">Note / Details</label>
                                    <input
                                        type="text"
                                        value={eventNote}
                                        onChange={(e) => setEventNote(e.target.value)}
                                        placeholder="Enter details (e.g. 500L, NPK 19-19-19, etc.)"
                                        className="w-full bg-black/30 border border-slate-200 dark:border-white/10 rounded-xl p-4 text-slate-900 dark:text-white focus:border-emerald-500/50 outline-none"
                                    />
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
                                    <button onClick={() => handleAddEvent('IRRIGATION', { note: eventNote || 'Routine Irrigation' })} className="aspect-square bg-blue-500/10 hover:bg-blue-500 border border-blue-500/20 hover:border-blue-500 rounded-2xl flex flex-col items-center justify-center gap-3 group transition-all">
                                        <Droplets size={28} className="text-blue-400 group-hover:text-white" />
                                        <span className="text-[10px] font-bold text-blue-300 group-hover:text-white uppercase tracking-wider">Irrigation</span>
                                    </button>
                                    <button onClick={() => handleAddEvent('FERTILIZER', { note: eventNote || 'Routine Fertilization' })} className="aspect-square bg-yellow-500/10 hover:bg-yellow-500 border border-yellow-500/20 hover:border-yellow-500 rounded-2xl flex flex-col items-center justify-center gap-3 group transition-all">
                                        <Sprout size={28} className="text-yellow-400 group-hover:text-white" />
                                        <span className="text-[10px] font-bold text-yellow-300 group-hover:text-white uppercase tracking-wider">Fertilizer</span>
                                    </button>
                                    <button onClick={() => handleAddEvent('DISEASE_CHECK', { note: eventNote || 'Routine Check' })} className="aspect-square bg-emerald-500/10 hover:bg-emerald-500 border border-emerald-500/20 hover:border-emerald-500 rounded-2xl flex flex-col items-center justify-center gap-3 group transition-all">
                                        <ShieldCheck size={28} className="text-emerald-400 group-hover:text-white" />
                                        <span className="text-[10px] font-bold text-emerald-300 group-hover:text-white uppercase tracking-wider">Health</span>
                                    </button>
                                    <button onClick={() => handleAddEvent('PEST_LOG', { note: eventNote || 'Pest Activity' })} className="aspect-square bg-red-500/10 hover:bg-red-500 border border-red-500/20 hover:border-red-500 rounded-2xl flex flex-col items-center justify-center gap-3 group transition-all">
                                        <Bug size={28} className="text-red-400 group-hover:text-white" />
                                        <span className="text-[10px] font-bold text-red-300 group-hover:text-white uppercase tracking-wider">Pest</span>
                                    </button>
                                    <button onClick={() => handleAddEvent('CUSTOM_LOG', { note: eventNote || 'Manual Entry' })} className="aspect-square bg-purple-500/10 hover:bg-purple-500 border border-purple-500/20 hover:border-purple-500 rounded-2xl flex flex-col items-center justify-center gap-3 group transition-all">
                                        <Activity size={28} className="text-purple-400 group-hover:text-white" />
                                        <span className="text-[10px] font-bold text-purple-300 group-hover:text-white uppercase tracking-wider">Custom</span>
                                    </button>
                                </div>

                                <button onClick={() => setShowEventModal(false)} className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl transition-all">Cancel</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* QR PASSPORT MODAL */}
            <AnimatePresence>
                {showQRModal && selectedBatch && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-lg">
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            className="bg-white rounded-[32px] w-full max-w-sm p-8 text-center relative overflow-hidden"
                        >
                            {/* Decorative Checkbg */}
                            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-500 via-blue-500 to-emerald-500"></div>

                            <button onClick={() => setShowQRModal(false)} className="absolute top-4 right-4 w-8 h-8 bg-slate-100 rounded-full text-slate-600 dark:text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-colors flex items-center justify-center">✕</button>

                            <div className="mb-6 mt-2">
                                <h2 className="text-2xl font-black text-slate-800 tracking-tight">Trust Passport</h2>
                                <p className="text-slate-600 dark:text-slate-400 text-sm font-medium">Blockchain Verification Token</p>
                            </div>

                            <div className="bg-white p-4 rounded-2xl border-2 border-dashed border-emerald-500/30 inline-block mb-6 shadow-xl shadow-emerald-500/10">
                                <QRCode
                                    value={getFrontendUrl(`/trust-report/${selectedBatch.batch_id}`)}
                                    size={180}
                                    fgColor="#059669"
                                />
                            </div>

                            <div className="space-y-3">
                                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed px-4">
                                    Product: <span className="font-bold text-slate-700">{selectedBatch.crop_name}</span><br />
                                    Batch: <span className="font-mono">{selectedBatch.batch_id.substring(0, 12)}...</span>
                                </p>

                                <a
                                    href={`/trust-report/${selectedBatch.batch_id}`}
                                    target="_blank"
                                    className="flex items-center justify-center gap-2 w-full py-4 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold rounded-xl hover:bg-black transition-all shadow-lg"
                                >
                                    Open Trust Report <ArrowRight size={16} />
                                </a>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

        </div>
    );
};

export default BlockchainManager;
