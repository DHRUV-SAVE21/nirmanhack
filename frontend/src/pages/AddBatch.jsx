import React, { useState, useEffect } from 'react';
import {
    Plus, ArrowLeft, Package, Tag, Scale, MapPin,
    Calendar, CheckCircle2, Loader2, AlertCircle,
    BadgeCheck, ShieldCheck, Cpu, Globe
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AddBatch = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);
    const [formData, setFormData] = useState({
        farmer_id: '70adcaac-b6c7-4b08-bf0a-4012c0cf3191', // Demo fallback UUID
        crop_name: '',
        variety: '',
        quantity: '',
        price_per_quintal: '',
        location: '',
        district: '',
        area_cultivated: '',
        soil_nitrogen: '45.0',
        soil_phosphorus: '18.0',
        soil_potassium: '12.0',
        soil_moisture: '24.5',
        status: 'planted',
        days_to_harvest: '120'
    });

    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (userData) {
            try {
                const parsed = JSON.parse(userData);
                const id = parsed.id || parsed.user_id;
                if (id) {
                    setFormData(prev => ({ ...prev, farmer_id: id }));
                }
            } catch (e) { console.error("User parsing error:", e); }
        }

        const fetchLatestSensorData = async () => {
            try {
                const apiBase = import.meta.env.VITE_API_BASE_URL || 'https://let-go-3-0.onrender.com';
                const response = await fetch(`${apiBase}/api/hardware/latest?user_id=HARDWARE_DEFAULT`);
                const result = await response.json();

                if (result.status === 'success' && result.data) {
                    const sensor = result.data;
                    setFormData(prev => ({
                        ...prev,
                        soil_nitrogen: sensor.nitrogen?.toString() || prev.soil_nitrogen,
                        soil_phosphorus: sensor.phosphorus?.toString() || prev.soil_phosphorus,
                        soil_potassium: sensor.potassium?.toString() || prev.soil_potassium,
                        soil_moisture: sensor.soil_moisture?.toString() || prev.soil_moisture
                    }));
                }
            } catch (error) {
                console.error("Failed to fetch sensor data for batch:", error);
            }
        };

        fetchLatestSensorData();
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        try {
            const apiBase = import.meta.env.VITE_API_BASE_URL || 'https://let-go-3-0.onrender.com';
            const res = await fetch(`${apiBase}/api/feature6/batch/create`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await res.json();
            if (data.success) {
                setMessage({ type: 'success', text: `Batch ${data.batch_id} successfully registered on the blockchain ledger.` });
                setTimeout(() => navigate('/inventory'), 2500);
            } else {
                setMessage({ type: 'error', text: data.error || 'Failed to initialize blockchain batch.' });
            }
        } catch (err) {
            setMessage({ type: 'error', text: 'Network connection failed' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white p-4 md:p-8 pt-24">
            <div className="max-w-4xl mx-auto">
                {/* Back Link */}
                <button onClick={() => navigate('/inventory')} className="flex items-center gap-3 text-slate-500 hover:text-emerald-400 mb-8 transition-all group">
                    <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                    <span className="text-xs font-black uppercase tracking-[0.3em]">Return to Vault</span>
                </button>

                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-[2px] bg-emerald-500"></div>
                            <span className="text-emerald-500 font-black uppercase tracking-[0.4em] text-[10px]">Asset Ingestion</span>
                        </div>
                        <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter leading-none stroke-text">
                            New <span className="text-emerald-500">Harvest</span>
                        </h1>
                        <p className="text-slate-500 font-medium text-lg leading-relaxed">
                            Initialize an immutable tracking record for your crop production.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    {/* Main Form */}
                    <div className="lg:col-span-2">
                        <form onSubmit={handleSubmit} className="space-y-10 group/form">
                            {message && (
                                <div className={`p-6 rounded-[2rem] flex items-center gap-4 border animate-in fade-in slide-in-from-top-4 duration-500 ${message.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-500'}`}>
                                    {message.type === 'success' ? <CheckCircle2 className="flex-shrink-0" /> : <AlertCircle className="flex-shrink-0" />}
                                    <span className="font-black uppercase tracking-widest text-[10px] leading-relaxed">{message.text}</span>
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <InputField
                                    label="Crop Name"
                                    name="crop_name"
                                    value={formData.crop_name}
                                    onChange={handleChange}
                                    placeholder="e.g. Premium Wheat"
                                    icon={<Package size={18} />}
                                    required
                                />
                                <InputField
                                    label="Variety"
                                    name="variety"
                                    value={formData.variety}
                                    onChange={handleChange}
                                    placeholder="e.g. Lokwan Gold"
                                    icon={<Tag size={18} />}
                                />
                                <InputField
                                    label="Quantity (Qtl)"
                                    name="quantity"
                                    type="number"
                                    value={formData.quantity}
                                    onChange={handleChange}
                                    placeholder="0.00"
                                    icon={<Scale size={18} />}
                                    required
                                />
                                <InputField
                                    label="Price (₹/Qtl)"
                                    name="price_per_quintal"
                                    type="number"
                                    value={formData.price_per_quintal}
                                    onChange={handleChange}
                                    placeholder="0.00"
                                    icon={<Globe size={18} />}
                                />
                                <InputField
                                    label="Cultivation Area (Acres)"
                                    name="area_cultivated"
                                    type="number"
                                    value={formData.area_cultivated}
                                    onChange={handleChange}
                                    placeholder="0.0"
                                    icon={<MapPin size={18} />}
                                />
                                <InputField
                                    label="Farm Location"
                                    name="location"
                                    value={formData.location}
                                    onChange={handleChange}
                                    placeholder="e.g. Shirdi Farm A"
                                    icon={<MapPin size={18} />}
                                />
                                <InputField
                                    label="Days to Harvest"
                                    name="days_to_harvest"
                                    type="number"
                                    value={formData.days_to_harvest}
                                    onChange={handleChange}
                                    placeholder="120"
                                    icon={<Calendar size={18} />}
                                />

                                <div className="md:col-span-2">
                                    <label className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] ml-4 block mb-3">Asset Phase</label>
                                    <div className="flex flex-col md:flex-row gap-4">
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, status: 'planted' })}
                                            className={`flex-1 py-6 rounded-[2rem] border font-bold text-sm uppercase tracking-widest flex items-center justify-center gap-3 transition-all ${formData.status === 'planted' ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.2)]' : 'bg-slate-900/50 border-slate-800 text-slate-500 hover:border-slate-700'}`}
                                        >
                                            <div className={`w-3 h-3 rounded-full ${formData.status === 'planted' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-700'}`}></div>
                                            Live Crop (Planted)
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, status: 'harvested' })}
                                            className={`flex-1 py-6 rounded-[2rem] border font-bold text-sm uppercase tracking-widest flex items-center justify-center gap-3 transition-all ${formData.status === 'harvested' ? 'bg-amber-500/10 border-amber-500 text-amber-400 shadow-[0_0_30px_rgba(245,158,11,0.2)]' : 'bg-slate-900/50 border-slate-800 text-slate-500 hover:border-slate-700'}`}
                                        >
                                            <Package size={16} />
                                            Harvested Stock
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-8 border-t border-slate-800/50">
                                <h3 className="text-xs font-black uppercase tracking-[0.4em] text-emerald-500 mb-8 flex items-center gap-3">
                                    <ShieldCheck size={16} /> Soil & Environment Metrics
                                </h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                    <InputField
                                        label="Nitrogen (N)"
                                        name="soil_nitrogen"
                                        value={formData.soil_nitrogen}
                                        onChange={handleChange}
                                        type="number"
                                    />
                                    <InputField
                                        label="Phosphorus (P)"
                                        name="soil_phosphorus"
                                        value={formData.soil_phosphorus}
                                        onChange={handleChange}
                                        type="number"
                                    />
                                    <InputField
                                        label="Potassium (K)"
                                        name="soil_potassium"
                                        value={formData.soil_potassium}
                                        onChange={handleChange}
                                        type="number"
                                    />
                                    <InputField
                                        label="Moisture (%)"
                                        name="soil_moisture"
                                        value={formData.soil_moisture}
                                        onChange={handleChange}
                                        type="number"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 text-slate-900 dark:text-white py-8 rounded-[2.5rem] font-black uppercase tracking-[0.3em] text-sm flex items-center justify-center gap-6 transition-all shadow-[0_30px_60px_-15px_rgba(16,185,129,0.3)] active:scale-[0.98] group/submit"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="animate-spin text-slate-900 dark:text-white" />
                                        Generating Crypto-Hash...
                                    </>
                                ) : (
                                    <>
                                        Authorize Genesis Block
                                        <Plus className="group-hover:rotate-90 transition-transform" />
                                    </>
                                )}
                            </button>
                        </form>
                    </div>

                    {/* Side Info */}
                    <div className="space-y-8">
                        <div className="bg-slate-900/30 rounded-[3rem] border border-slate-800 p-8 md:p-10 backdrop-blur-2xl transition-all hover:bg-slate-900/50">
                            <h3 className="text-xl font-black uppercase tracking-tight mb-8 flex items-center gap-3">
                                <Cpu className="text-emerald-500" />
                                Proof System
                            </h3>
                            <ul className="space-y-8">
                                <InfoItem
                                    icon={<BadgeCheck className="text-emerald-500" />}
                                    title="Genesis ID"
                                    text="A unique SHA-256 identifier will be issued for this batch."
                                />
                                <InfoItem
                                    icon={<ShieldCheck className="text-blue-500" />}
                                    title="Transparency"
                                    text="Logs will be visible to buyers via QR signature."
                                />
                                <InfoItem
                                    icon={<TrendingUp className="text-purple-500" />}
                                    title="Trust Score"
                                    text="Initial integrity is set to 100% and evolves with data."
                                />
                            </ul>
                        </div>

                        <div className="p-8 bg-emerald-500 rounded-[3rem] text-slate-950 shadow-2xl relative overflow-hidden group">
                            <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-slate-100 dark:bg-white/10 shadow-sm dark:shadow-none rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
                            <h4 className="text-xl font-black uppercase tracking-tight mb-2 relative z-10">Data Integrity</h4>
                            <p className="text-slate-950 font-medium text-xs leading-relaxed relative z-10">
                                Ensuring accurate data entry here maintains your high cultivator reputation rating.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const InputField = ({ label, icon, ...props }) => (
    <div className="space-y-3 group/input">
        <label className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] ml-4 transition-colors group-focus-within/input:text-emerald-500">{label}</label>
        <div className="relative">
            {icon && (
                <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600 transition-colors group-focus-within/input:text-emerald-500">
                    {icon}
                </div>
            )}
            <input
                {...props}
                className={`w-full bg-slate-950/80 border border-slate-800/80 rounded-[2rem] py-6 ${icon ? 'pl-14' : 'pl-8'} pr-8 focus:outline-none focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/5 transition-all font-bold text-white placeholder:text-slate-800`}
            />
        </div>
    </div>
);

const InfoItem = ({ icon, title, text }) => (
    <div className="flex gap-5 group">
        <div className="flex-shrink-0 w-12 h-12 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-white/5 flex items-center justify-center group-hover:scale-110 transition-transform">{icon}</div>
        <div className="space-y-1">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-200">{title}</h4>
            <p className="text-[10px] font-medium text-slate-500 leading-relaxed uppercase tracking-widest leading-4">{text}</p>
        </div>
    </div>
);

const TrendingUp = ({ size, className }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
        <polyline points="17 6 23 6 23 12"></polyline>
    </svg>
);

export default AddBatch;
