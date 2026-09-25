import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, TrendingUp, Truck, ShieldCheck, QrCode, Plus, X, Sprout, Activity, Clock } from 'lucide-react';
import axios from 'axios';

// API Base URL from environment
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://let-go-3-0.onrender.com';
const API_BASE_URL = `${API_BASE}/api/feature6`;
const STATUS_BASE_URL = `${API_BASE}/api/feature3`;

const InventoryManager = () => {
    const { t } = useTranslation();
    const [crops, setCrops] = useState([]);
    const [irrigationLogs, setIrrigationLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    // Add New Crop State
    const [newCrop, setNewCrop] = useState({ name: '', variety: '', quantity: '', price: '' });

    // QR Modal State
    const [qrData, setQrData] = useState(null);

    // RBAC: Get current logged in user
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    const farmerId = user?.name || user?.id || 'knn-user';

    // Fetch Inventory and Logs
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Fetch Crops
                const cropsRes = await axios.get(`${API_BASE_URL}/list/${farmerId}`);
                if (cropsRes.data && cropsRes.data.length > 0) {
                    setCrops(cropsRes.data);
                }

                // Fetch Irrigation Logs (from Feature 3 Status/History)
                const logsRes = await axios.get(`${STATUS_BASE_URL}/history`, {
                    headers: { 'x-farmer-id': farmerId }
                });

                if (logsRes.data) {
                    setIrrigationLogs(logsRes.data.filter(l => l.data.event_type === "Irrigation Triggered" || l.data.event_type === "Automation Cycle Ran").slice(0, 5));
                }
            } catch (error) {
                console.error("Error fetching inventory data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
        // Set up a polling interval for "Real-time" feel
        const interval = setInterval(fetchData, 10000);
        return () => clearInterval(interval);
    }, [farmerId]);

    const handleAddCrop = async () => {
        if (!newCrop.name || !newCrop.quantity) return;

        try {
            const res = await axios.post(`${API_BASE_URL}/batch/create`, {
                farmer_id: farmerId,
                crop_name: newCrop.name || 'Unknown Crop',
                variety: newCrop.variety || 'Standard',
                quantity: Number(newCrop.quantity) || 1,
                price_per_quintal: Number(newCrop.price) || 2000
            });

            if (res.data.success) {
                // Re-fetch to get accurate batch id and data
                const cropsRes = await axios.get(`${API_BASE_URL}/list/${farmerId}`);
                setCrops(cropsRes.data);
                setNewCrop({ name: '', variety: '', quantity: '', price: '' });
                alert("Batch secured on Blockchain!");
            }
        } catch (error) {
            console.error("Failed to sync with blockchain", error);
            alert("Error creating batch. Check backend connection.");
        }
    };

    const openQr = (item) => {
        // Create a public verification link (or local for demo)
        const verificationLink = `https://localhost:5173/trust-report/${item.batch_id}`;
        setQrData({
            link: verificationLink,
            item: item
        });
    };

    return (
        <div className="pt-28 pb-12 w-full max-w-7xl mx-auto px-4 relative min-h-screen">

            {/* Header */}
            <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-bold font-display text-dark-navy dark:text-white mb-2">Inventory Ledger</h1>
                    <p className="text-slate-500 dark:text-gray-500">Traceable farm produce managed via Immutable Blockchain.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="px-4 py-2 bg-organic-green/10 rounded-full border border-organic-green/20 flex items-center gap-2">
                        <ShieldCheck className="text-organic-green w-4 h-4" />
                        <span className="text-xs font-bold text-organic-green">BLOCKCHAIN ACTIVE</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Columns: Main Inventory */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Quick Add Section (Todo Style) */}
                    <div className="glass-panel p-6 border border-organic-green/30 shadow-xl shadow-organic-green/5">
                        <h3 className="text-lg font-bold text-organic-green mb-4 flex items-center gap-2">
                            <Plus className="w-5 h-5" /> Enroll New Crop Batch
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                            <div className="md:col-span-1">
                                <label className="text-[10px] uppercase font-black text-slate-500 dark:text-gray-500 ml-1 tracking-widest">Crop Name</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Wheat"
                                    className="w-full p-3 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 focus:border-organic-green outline-none transition-all text-sm"
                                    value={newCrop.name}
                                    onChange={e => setNewCrop({ ...newCrop, name: e.target.value })}
                                />
                            </div>
                            <div className="md:col-span-1">
                                <label className="text-[10px] uppercase font-black text-slate-500 dark:text-gray-500 ml-1 tracking-widest">Variety</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Lokwan"
                                    className="w-full p-3 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 focus:border-organic-green outline-none transition-all text-sm"
                                    value={newCrop.variety}
                                    onChange={e => setNewCrop({ ...newCrop, variety: e.target.value })}
                                />
                            </div>
                            <div className="md:col-span-1">
                                <label className="text-[10px] uppercase font-black text-slate-500 dark:text-gray-500 ml-1 tracking-widest">Quantity (Qtl)</label>
                                <input
                                    type="number"
                                    placeholder="0"
                                    className="w-full p-3 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 focus:border-organic-green outline-none transition-all text-sm"
                                    value={newCrop.quantity}
                                    onChange={e => setNewCrop({ ...newCrop, quantity: e.target.value })}
                                />
                            </div>
                            <button
                                onClick={handleAddCrop}
                                disabled={!newCrop.name || !newCrop.quantity}
                                className="md:col-span-1 p-3 rounded-xl bg-organic-green text-white font-bold hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-organic-green/20 flex items-center justify-center gap-2"
                            >
                                <Plus size={20} /> List Crop
                            </button>
                        </div>
                    </div>

                    {/* Inventory List */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xl font-bold text-dark-navy dark:text-white flex items-center gap-2">
                                <Package className="text-slate-600 dark:text-gray-400" size={20} /> Current Stock
                            </h3>
                            <span className="text-xs text-slate-600 dark:text-gray-400 font-mono">{crops.length} Batches Tracked</span>
                        </div>

                        {loading ? (
                            <div className="text-center py-12 animate-pulse text-slate-600 dark:text-gray-400">Updating Ledger...</div>
                        ) : crops.length === 0 ? (
                            <div className="text-center py-12 text-slate-600 dark:text-gray-400 italic">No crops found on chain.</div>
                        ) : (
                            <div className="grid grid-cols-1 gap-4">
                                {crops.map((item) => (
                                    <motion.div
                                        key={item.batch_id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="glass-panel p-4 flex flex-col md:flex-row items-center justify-between gap-4 group hover:border-organic-green/50 transition-colors bg-white/50 dark:bg-white/5"
                                    >
                                        <div className="flex items-center gap-4 flex-1">
                                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-organic-green to-green-600 flex items-center justify-center text-white shadow-lg overflow-hidden">
                                                <Sprout size={24} />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-lg text-dark-navy dark:text-white leading-tight">{item.crop_name}</h4>
                                                <div className="flex items-center gap-2 text-[10px] text-slate-500 dark:text-gray-500 font-mono uppercase tracking-widest mt-1">
                                                    <span className="text-organic-green font-bold bg-organic-green/10 px-1.5 rounded">{item.batch_id}</span>
                                                    <span>•</span>
                                                    <span>{item.variety}</span>
                                                    <span>•</span>
                                                    <span className="text-slate-600 dark:text-gray-400 font-sans normal-case">{item.quantity} Quintal</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-6 w-full md:w-auto">
                                            <div className="text-right hidden sm:block">
                                                <div className="text-[10px] text-slate-500 dark:text-gray-500 uppercase tracking-wider font-bold">Est. Value</div>
                                                <div className="font-bold text-dark-navy dark:text-white">₹ {(parseFloat(item.quantity) * parseFloat(item.price_per_quintal || 2000)).toLocaleString()}</div>
                                            </div>

                                            <button
                                                onClick={() => openQr(item)}
                                                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-white dark:bg-white/5 text-gray-700 dark:text-gray-200 hover:bg-organic-green hover:text-white transition-all border border-gray-200 dark:border-white/10 shadow-sm"
                                            >
                                                <QrCode size={18} />
                                                <span className="font-bold text-sm">Trace Crop</span>
                                            </button>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column: Real-time logs */}
                <div className="lg:col-span-1">
                    <div className="glass-panel p-6 border border-blue-500/20 sticky top-32">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-bold text-lg flex items-center gap-2 text-blue-500">
                                <Activity size={20} className="animate-pulse" /> Live Farm Logs
                            </h3>
                        </div>

                        <div className="space-y-4">
                            {irrigationLogs.length === 0 ? (
                                <p className="text-sm text-slate-600 dark:text-gray-400 italic">Listening for farm events...</p>
                            ) : irrigationLogs.map((log, idx) => (
                                <motion.div
                                    key={log.hash}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                    className="p-3 rounded-xl bg-blue-500/5 border-l-4 border-blue-500 flex flex-col gap-1"
                                >
                                    <div className="flex justify-between items-start">
                                        <span className="text-[10px] font-black uppercase text-blue-400 tracking-tighter">
                                            {log.data.event_type}
                                        </span>
                                        <span className="text-[10px] text-slate-500 dark:text-gray-500 font-mono flex items-center gap-1">
                                            <Clock size={10} /> {new Date(log.data.timestamp).toLocaleTimeString()}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-600 dark:text-gray-300">
                                        {log.data.details?.source || 'Automated System'} activated Irrigation.
                                    </p>
                                    <div className="text-[8px] text-slate-500 dark:text-gray-500 font-mono mt-1 opacity-50 break-all">
                                        HASH: {log.hash.substring(0, 16)}...
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        <div className="mt-8 pt-6 border-t border-slate-200 dark:border-white/10">
                            <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-gray-500">
                                <div className="flex-1">
                                    <div className="font-bold text-gray-700 dark:text-gray-300">Sync Status</div>
                                    <div>Cloud DB & Ledger</div>
                                </div>
                                <div className="w-2 h-2 rounded-full bg-green-500 animate-ping"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* QR Modal */}
            <AnimatePresence>
                {qrData && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
                        onClick={() => setQrData(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white dark:bg-gray-900 rounded-[32px] p-10 max-w-sm w-full shadow-2xl relative border border-slate-200 dark:border-white/10 overflow-hidden"
                            onClick={e => e.stopPropagation()}
                        >
                            {/* Decorative Blobs */}
                            <div className="absolute -top-24 -right-24 w-48 h-48 bg-organic-green/20 rounded-full blur-3xl"></div>

                            <button
                                onClick={() => setQrData(null)}
                                className="absolute top-6 right-6 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/5 text-slate-600 dark:text-gray-400 transition-colors"
                            >
                                <X size={20} />
                            </button>

                            <div className="text-center relative z-10">
                                <div className="inline-block px-3 py-1 rounded-full bg-blue-500/10 text-blue-500 text-[10px] font-black tracking-widest uppercase mb-4">Blockchain QR</div>
                                <h3 className="text-3xl font-black text-dark-navy dark:text-white mb-1 leading-tight">{qrData.item.crop_name}</h3>
                                <p className="text-slate-500 dark:text-gray-500 text-xs font-mono mb-8 opacity-70">S.ID: {qrData.item.batch_id}</p>

                                <div className="bg-white p-6 rounded-3xl shadow-2xl inline-block mb-8 border-4 border-organic-green/10">
                                    <img
                                        src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrData.link)}&color=064e3b&bgcolor=ffffff&margin=10`}
                                        alt="Trust Report QR"
                                        className="w-48 h-48 object-contain"
                                    />
                                </div>

                                <p className="text-sm text-slate-500 dark:text-gray-500 dark:text-gray-400 mb-6 px-4">
                                    Scan this code to see the <span className="text-organic-green font-bold">Immutable Growth Timeline</span> and verify the purity of this produce.
                                </p>

                                <a
                                    href={qrData.link}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center justify-center gap-2 w-full py-4 bg-dark-navy dark:bg-white text-slate-900 dark:text-white dark:text-dark-navy font-black rounded-2xl hover:scale-[1.02] active:scale-95 transition-all text-sm uppercase tracking-widest shadow-xl"
                                >
                                    Open Trust Report <ArrowRight size={16} />
                                </a>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const ArrowRight = ({ size, className }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <path d="M5 12h14m-7-7 7 7-7 7" />
    </svg>
);

export default InventoryManager;
