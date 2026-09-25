import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ShieldCheck, Droplets, Leaf, Activity, Zap, CheckCircle2,
    AlertCircle, Calendar, MapPin, ArrowLeft, History, Cpu,
    FileCheck, QrCode, Share2, Download, Award, Globe,
    Printer, FileText, ExternalLink, Bug, TrendingUp
} from 'lucide-react';

const ProductTransparency = () => {
    const { batchId } = useParams();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showReport, setShowReport] = useState(false);
    const navigate = useNavigate();
    const reportRef = useRef();

    useEffect(() => {
        fetchDetails();
    }, [batchId]);

    const fetchDetails = async () => {
        setLoading(true);
        try {
            const apiBase = import.meta.env.VITE_API_BASE_URL || 'https://let-go-3-0.onrender.com';
            const res = await fetch(`${apiBase}/api/feature6/scan/${batchId}`);

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.detail || 'Batch not found in the global ledger');
            }

            const json = await res.json();
            setData(json);
            setError(null);
        } catch (e) {
            console.error("Fetch error:", e);
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };


    if (loading) return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
            <div className="flex flex-col items-center gap-6">
                <div className="w-16 h-16 border-4 border-emerald-500/10 border-t-emerald-500 rounded-full animate-spin shadow-[0_0_40px_rgba(16,185,129,0.2)]"></div>
                <p className="text-slate-500 font-black uppercase tracking-[0.4em] text-[10px] animate-pulse">Scanning Blockchain Node...</p>
            </div>
        </div>
    );

    if (error) return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-8 text-center">
            <div className="max-w-md space-y-6">
                <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center border border-red-500/20 mx-auto">
                    <AlertCircle className="text-red-500" size={48} />
                </div>
                <h1 className="text-4xl font-black uppercase text-slate-900 dark:text-white tracking-tighter">Chain Mismatch</h1>
                <p className="text-slate-500 font-medium text-lg leading-relaxed">{error}</p>
                <button
                    onClick={() => navigate('/inventory')}
                    className="bg-white dark:bg-slate-900 px-10 py-5 rounded-[2rem] border border-slate-800 font-black uppercase tracking-widest text-xs hover:bg-slate-800 transition-all text-slate-900 dark:text-white active:scale-95"
                >
                    Return to Ledger
                </button>
            </div>
        </div>
    );

    const { crop_info, trust_layer, blockchain_timeline } = data;

    // Generate Dynamic QR Code Data using ACTUAL Ledger Data
    // We sort chronologically (Oldest First) for "Proper Order" of lifecycle
    const sortedTimeline = [...blockchain_timeline].sort((a, b) => a.timestamp - b.timestamp);

    // Create a concise version to fit in QR limits
    const ledgerSummary = {
        "BATCH_ID": batchId,
        "CROP": crop_info.crop_name,
        "VARIETY": crop_info.variety,
        "ORIGIN": crop_info.location,
        "EVENTS_HISTORY": sortedTimeline.map(e => ({
            "TIME": new Date(e.timestamp * 1000).toLocaleString(),
            "EVENT": e.event,
            "DETAILS": e.data.metrics_before || e.data.metrics || e.data // Flatten slightly
        })),
        "HEAD_HASH": sortedTimeline[sortedTimeline.length - 1]?.hash || "GENESIS"
    };

    const dataUri = `data:text/plain;charset=utf-8,${encodeURIComponent(JSON.stringify(ledgerSummary, null, 4))}`;
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(dataUri)}&bgcolor=ffffff&color=000000&margin=0`;

    const formatDate = (dateStr) => {
        if (!dateStr) return 'N/A';
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white p-4 md:p-8 pt-12 print:bg-white print:text-black">
            <div className="max-w-7xl mx-auto">
                {/* Header Actions - Hidden on Print */}
                <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-8 mb-12 print:hidden">
                    <button onClick={() => navigate(-1)} className="w-[fit-content] flex items-center gap-3 text-slate-500 hover:text-emerald-400 p-4 bg-slate-900/40 rounded-2xl border border-slate-800/50 hover:border-emerald-500/20 transition-all group">
                        <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                        <span className="text-xs font-black uppercase tracking-widest">Exit Node</span>
                    </button>

                    <div className="flex gap-4">
                        <button
                            onClick={handlePrint}
                            className="flex items-center gap-3 px-6 py-4 bg-slate-900/60 rounded-2xl border border-slate-800 hover:border-emerald-500/30 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 hover:text-emerald-400 transition-all"
                        >
                            <Printer size={16} /> Print PDF Report
                        </button>
                        <button className="flex items-center gap-3 px-6 py-4 bg-emerald-600 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-950 hover:bg-emerald-500 transition-all shadow-xl active:scale-95">
                            <Share2 size={16} /> Share Ledger
                        </button>
                    </div>
                </div>

                {/* MAIN DASHBOARD */}
                <div className="print:hidden">
                    {/* Hero Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-16">
                        <div className="lg:col-span-4 group">
                            <div className="h-full bg-slate-900/20 rounded-[3.5rem] border border-slate-800/60 p-10 backdrop-blur-3xl relative overflow-hidden flex flex-col items-center justify-center text-center transition-all hover:border-emerald-500/40 hover:bg-slate-900/40">
                                <div className="absolute top-0 left-0 w-full h-[300px] bg-emerald-500/5 blur-[80px] rounded-full"></div>
                                <div className="relative mb-10">
                                    <div className="p-1 bg-white rounded-3xl shadow-2xl relative z-10 group-hover:scale-105 transition-transform duration-700">
                                        <img src={qrCodeUrl} className="w-48 h-48 md:w-56 md:h-56 block" alt="Verification QR" />
                                    </div>
                                    <div className="absolute -bottom-4 -right-4 w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-2xl border-4 border-slate-950">
                                        <QrCode size={24} className="text-slate-950" />
                                    </div>
                                </div>
                                <h2 className="text-2xl font-black uppercase tracking-tighter text-slate-900 dark:text-white mb-3">Origin Scanner</h2>
                                <p className="text-xs text-slate-500 font-bold max-w-[200px]">Scan to view raw immutable JSON ledger data.</p>
                            </div>
                        </div>

                        <div className="lg:col-span-8">
                            <div className="h-full bg-slate-900/40 rounded-[3.5rem] border border-slate-800/60 p-8 md:p-12 backdrop-blur-3xl relative overflow-hidden group">
                                <div className="absolute -top-32 -right-32 w-80 h-80 bg-emerald-500/[0.05] blur-[120px] rounded-full group-hover:bg-emerald-500/[0.1] transition-all duration-1000"></div>
                                <div className="flex flex-col md:flex-row gap-10 md:items-center relative z-10 h-full">
                                    <div className="w-full md:w-72 aspect-square bg-slate-50 dark:bg-slate-950 rounded-[2.5rem] overflow-hidden border border-slate-200 dark:border-white/5 p-2 shadow-2xl">
                                        <img src={crop_info.image_url || 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&q=80&w=800'} className="w-full h-full object-cover rounded-[2.2rem] transition-all hover:scale-110" alt="Crop" />
                                    </div>
                                    <div className="flex-1 space-y-6">
                                        <div className="flex items-center gap-3">
                                            <span className="text-emerald-500 font-black text-xs uppercase tracking-[0.4em]">{crop_info.variety}</span>
                                            <div className="h-4 w-[1px] bg-slate-800"></div>
                                            <span className="text-slate-500 font-mono text-[10px] tracking-widest">{crop_info.batch_id}</span>
                                        </div>
                                        <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter leading-none stroke-text">
                                            {crop_info.crop_name}
                                        </h1>
                                        <div className="grid grid-cols-2 gap-8 pt-8 border-t border-slate-800/50">
                                            <div>
                                                <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">Production Hub</p>
                                                <p className="text-lg font-bold text-slate-200">{crop_info.location || 'Maharashtra Node'}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">Harvest Ledger</p>
                                                <p className="text-lg font-bold text-slate-200">{formatDate(crop_info.harvest_date)}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Report Summary Hub */}
                    <div className="mb-20">
                        <div className="flex items-center justify-between mb-12">
                            <h2 className="text-3xl font-black uppercase tracking-widest text-slate-900 dark:text-white">Traceability <span className="text-emerald-500">Report</span></h2>
                            <button onClick={() => setShowReport(!showReport)} className="text-emerald-500 text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:underline">
                                {showReport ? 'Hide Detailed View' : 'Show Detailed Report'} <ExternalLink size={14} />
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                            <MetricCard
                                icon={<Droplets className="text-blue-400" />}
                                title="Irrigation"
                                status={trust_layer.summary.irrigation?.total_cycles > 0 ? "Verified" : "No Logs"}
                                details={`${trust_layer.summary.irrigation?.total_cycles || 0} Cycles Hashed`}
                                sub={`Last: ${trust_layer.summary.irrigation?.last_event || 'Never'}`}
                                description="Automated groundwater tracking logs."
                            />
                            <MetricCard
                                icon={<Leaf className="text-emerald-400" />}
                                title="Nutrition"
                                status={trust_layer.summary.fertilizer?.safety || "Verified"}
                                details={`${trust_layer.summary.fertilizer?.total_logs || 0} Inputs Logged`}
                                sub={trust_layer.summary.fertilizer?.types?.[0] || 'Bio-Organic'}
                                description="Fertilizer safety & residue check protocol."
                            />
                            <MetricCard
                                icon={<Bug className="text-red-400" />}
                                title="Plant Health"
                                status={trust_layer.summary.disease?.alerts > 0 ? "Warning" : "Optimal"}
                                details={trust_layer.summary.disease?.history || 'No Pathogens'}
                                sub={`Last Check: ${trust_layer.summary.disease?.last_check || 'Pre-Harvest'}`}
                                description="Dynamic disease & pest detection history."
                            />
                            <MetricCard
                                icon={<ShieldCheck className="text-emerald-500" />}
                                title="Trust Score"
                                status={`${trust_layer.integrity_score}%`}
                                details="AAA+ Category"
                                sub="Digital Provenance"
                                description="Overall integrity based on log consistency."
                            />
                        </div>
                    </div>

                    {/* Timeline Explorer */}
                    <TimelineSection timeline={blockchain_timeline} formatDate={formatDate} />
                </div>

                {/* PRINTABLE VERSION (visible only on print) */}
                <div className="hidden print:block font-serif p-4">
                    <div className="border-[6px] border-emerald-600 p-8">
                        <div className="flex justify-between items-start mb-8 border-b-2 border-slate-200 pb-6">
                            <div>
                                <h1 className="text-3xl font-black uppercase tracking-tighter text-slate-800 mb-1">Quality Assurance</h1>
                                <p className="text-sm font-bold text-slate-500 uppercase tracking-[0.2em]">Traceability Certificate</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[8px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest">Digital Passport ID</p>
                                <p className="text-lg font-mono font-black text-emerald-600">{batchId}</p>
                                <p className="text-[8px] font-bold text-slate-600 dark:text-slate-400 mt-2 uppercase tracking-widest">Verified On</p>
                                <p className="text-base font-black">{new Date().toLocaleDateString()}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-10 mb-8">
                            <div className="space-y-8">
                                <div>
                                    <h3 className="text-[8px] font-black text-emerald-600 uppercase tracking-[0.3em] mb-3">I. CROP SPECIFICATIONS</h3>
                                    <div className="space-y-2">
                                        <p className="text-3xl font-black uppercase tracking-tight">{crop_info.crop_name}</p>
                                        <p className="text-lg font-bold text-slate-500 italic">Variety: {crop_info.variety}</p>
                                        <p className="text-sm font-medium text-slate-600">Origin Node: {crop_info.location || 'India, Maharashtra'}</p>
                                    </div>
                                </div>
                                <div className="p-6 bg-slate-50 border border-slate-200 rounded-[1.5rem]">
                                    <h3 className="text-[8px] font-black text-emerald-600 uppercase tracking-[0.3em] mb-4">II. AUTHENTICITY SEAL</h3>
                                    <div className="flex items-center gap-6">
                                        <div className="border-2 border-slate-900 p-1 bg-white rounded-lg">
                                            <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(dataUri)}&bgcolor=ffffff&color=000000&margin=0`} className="w-24 h-24" />
                                        </div>
                                        <div>
                                            <p className="text-4xl font-black text-slate-800 mb-0.5">{trust_layer.integrity_score}%</p>
                                            <p className="text-[8px] font-black text-emerald-600 uppercase tracking-widest">Integrity Rank</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-8">
                                <h3 className="text-[8px] font-black text-emerald-600 uppercase tracking-[0.3em] mb-3">III. LIFECYCLE AUDIT</h3>
                                <div className="space-y-6">
                                    <AuditItem label="Irrigation Cycles" value={trust_layer.summary.irrigation?.total_cycles || '0'} />
                                    <AuditItem label="Safety Protocol" value={trust_layer.summary.fertilizer?.safety || 'Organic'} />
                                    <AuditItem label="Biological Health" value={trust_layer.summary.disease?.history || 'No Pathogens'} />
                                    <AuditItem label="Hashed Events" value={blockchain_timeline.length} />
                                </div>
                            </div>
                        </div>

                        <div className="border-t border-slate-200 pt-6 text-center">
                            <p className="text-[8px] font-mono text-slate-600 dark:text-slate-400 uppercase tracking-widest leading-relaxed max-w-[80%] mx-auto">
                                This document is a digital twin of the on-chain ledger.
                                Scan the QR code to verify the immutable cryptographic proof.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                @media print {
                    body { background: white !important; margin: 0 !important; padding: 0 !important; }
                    .print\\:hidden { display: none !important; }
                    .print\\:block { display: block !important; }
                    @page { margin: 0; }
                }
                .stroke-text {
                    -webkit-text-stroke: 1.5px rgba(16, 185, 129, 0.4);
                    color: rgba(255, 255, 255, 1);
                }
            `}} />
        </div>
    );
};

const AuditItem = ({ label, value }) => (
    <div className="flex justify-between border-b-2 border-slate-100 pb-2">
        <span className="text-lg font-bold text-slate-500">{label}</span>
        <span className="text-xl font-black">{value}</span>
    </div>
);

const MetricCard = ({ icon, title, status, details, sub, description }) => (
    <div className="bg-slate-900/40 rounded-[2.5rem] p-8 border border-slate-800/60 backdrop-blur-xl group hover:bg-slate-900/60 transition-all flex flex-col h-full border-b-[6px] border-b-emerald-500/20">
        <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl w-fit mb-8 border border-white/[0.03] group-hover:scale-110 transition-all duration-300 shadow-xl">{icon}</div>
        <h4 className="text-[10px] text-slate-500 font-black uppercase tracking-[0.4em] mb-3">{title}</h4>
        <div className="flex items-center gap-3 mb-4">
            <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_15px_#10b981]"></div>
            <p className="font-black text-slate-900 dark:text-white uppercase tracking-tighter text-2xl mb-1">{status}</p>
        </div>
        <p className="text-sm text-slate-200 font-bold mb-1">{details}</p>
        <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-6">{sub}</p>
        <div className="mt-auto pt-6 border-t border-slate-800/40">
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed italic opacity-80">{description}</p>
        </div>
    </div>
);

const TimelineSection = ({ timeline, formatDate }) => (
    <div className="bg-slate-900/30 rounded-[4rem] border border-slate-800/60 p-10 md:p-16 relative overflow-hidden">
        <div className="flex items-center gap-6 mb-16">
            <Cpu className="text-emerald-500" size={40} />
            <h2 className="text-4xl font-black uppercase tracking-tighter text-slate-900 dark:text-white">Full <span className="stroke-text">Chain</span> Ledger</h2>
        </div>
        <div className="space-y-6">
            {timeline.slice().reverse().map((event, idx) => (
                <TimelineEvent key={idx} event={event} formatDate={formatDate} />
            ))}
        </div>
    </div>
);

const TimelineEvent = ({ event, formatDate }) => {
    const timestamp = new Date(event.timestamp * 1000);

    return (
        <div className="bg-slate-950/60 rounded-[2.5rem] border border-slate-200 dark:border-white/5 p-8 flex flex-col lg:flex-row gap-10 hover:border-emerald-500/30 transition-all group">
            {/* Time Column */}
            <div className="lg:w-48 flex-shrink-0">
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-2 flex items-center gap-2">
                    <History size={12} /> Block Timestamp
                </p>
                <p className="text-xl font-mono font-black text-emerald-500">{timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                <p className="text-xs font-bold text-slate-500 mt-1">{formatDate(timestamp)}</p>
            </div>

            {/* Content Column */}
            <div className="flex-1">
                <div className="flex items-center gap-3 mb-6">
                    <span className={`px-4 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest
                        ${event.event === 'IRRIGATION' ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' :
                            event.event === 'SENSOR_READING' ? 'bg-purple-500/10 border-purple-500/30 text-purple-400' :
                                event.event === 'STATUS_CHANGE' ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' :
                                    event.event === 'PRICE_SNAPSHOT' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' :
                                        'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'}`}>
                        {event.event.replace('_', ' ')}
                    </span>
                    <div className="h-px flex-1 bg-slate-800/50"></div>
                </div>

                <div className="bg-black/20 p-6 rounded-3xl border border-slate-200 dark:border-white/5 group-hover:bg-black/40 transition-colors">
                    <EventContent type={event.event} data={event.data} />
                </div>
            </div>
        </div>
    );
};

const EventContent = ({ type, data }) => {
    if (type === 'IRRIGATION') {
        const metrics = data.metrics_before || data.metrics || {};
        return (
            <div>
                <div className="flex items-center gap-3 mb-4">
                    <Zap className="text-blue-400" size={20} />
                    <h4 className="text-lg font-bold text-slate-900 dark:text-white uppercase tracking-tight">Automated Irrigation Cycle</h4>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <MetricBox label="Status" value="Motor ON" color="blue" />
                    <MetricBox label="Source" value="IoT Pump" />
                    {metrics.soil_moisture && <MetricBox label="Moisture" value={`${metrics.soil_moisture}%`} />}
                    {metrics.temperature && <MetricBox label="Temp" value={`${metrics.temperature}°C`} />}
                </div>
            </div>
        );
    }

    if (type === 'SENSOR_READING') {
        const metrics = data.metrics || {};
        return (
            <div>
                <div className="flex items-center gap-3 mb-4">
                    <Activity className="text-purple-400" size={20} />
                    <h4 className="text-lg font-bold text-slate-900 dark:text-white uppercase tracking-tight">Field Sensor Telemetry</h4>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <MetricBox label="Device" value="Sentinel-X" color="purple" />
                    {metrics.soil_moisture && <MetricBox label="Moisture" value={`${metrics.soil_moisture}%`} />}
                    {metrics.soil_nitrogen && <MetricBox label="Nitrogen" value={`${metrics.soil_nitrogen} mg`} />}
                    {metrics.temperature && <MetricBox label="Temp" value={`${metrics.temperature}°C`} />}
                </div>
            </div>
        );
    }

    if (type === 'STATUS_CHANGE') {
        return (
            <div>
                <div className="flex items-center gap-3 mb-4">
                    <History className="text-amber-400" size={20} />
                    <h4 className="text-lg font-bold text-slate-900 dark:text-white uppercase tracking-tight">Lifecycle Transition</h4>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <MetricBox label="New Status" value={data.new_status || 'Updated'} color="amber" />
                    <MetricBox label="Authority" value="System Hash" />
                    <MetricBox label="Notes" value={data.notes || 'Status verified'} />
                </div>
            </div>
        );
    }

    if (type === 'PRICE_SNAPSHOT') {
        return (
            <div>
                <div className="flex items-center gap-3 mb-4">
                    <TrendingUp className="text-emerald-400" size={20} />
                    <h4 className="text-lg font-bold text-slate-900 dark:text-white uppercase tracking-tight">Market Price Commitment</h4>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <MetricBox label="Agreed Price" value={`₹${data.price}`} color="emerald" />
                    <MetricBox label="Source" value={data.market_source || 'Mandi'} />
                    <MetricBox label="Currency" value={data.currency || 'INR'} />
                </div>
            </div>
        );
    }

    if (type === 'SOWING') {
        return (
            <div>
                <div className="flex items-center gap-3 mb-4">
                    <Leaf className="text-emerald-400" size={20} />
                    <h4 className="text-lg font-bold text-slate-900 dark:text-white uppercase tracking-tight">Sowing & Genesis</h4>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <MetricBox label="Method" value={data.method} color="emerald" />
                    <MetricBox label="Seed Purity" value={data.seed_purity} />
                    <MetricBox label="Area" value={`${data.area_acres || data.area_cultivated || '-'} Acres`} />
                </div>
            </div>
        )
    }

    // Default Fallback
    return <pre className="text-xs font-mono text-slate-600 dark:text-slate-400 overflow-x-auto whitespace-pre-wrap">{JSON.stringify(data, null, 2)}</pre>;
};

const MetricBox = ({ label, value, color = 'slate' }) => {
    const colors = {
        blue: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
        purple: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
        amber: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
        emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
        slate: 'text-slate-300 bg-slate-800/50 border-slate-700/50'
    };

    return (
        <div className={`p-3 rounded-xl border ${colors[color] || colors.slate}`}>
            <p className="text-[9px] uppercase tracking-widest opacity-70 mb-1">{label}</p>
            <p className="font-bold text-sm truncate">{value}</p>
        </div>
    );
};

export default ProductTransparency;
