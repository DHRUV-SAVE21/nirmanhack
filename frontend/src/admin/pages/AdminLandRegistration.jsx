import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
    CheckCircle, 
    XCircle, 
    MapPin, 
    User, 
    FileText, 
    ShieldCheck, 
    Calendar,
    Loader2,
    Search,
    AlertCircle,
    Eye
} from 'lucide-react';
import { useThemeStore } from '../../store/themeStore';
import SpotlightCard from '../components/SpotlightCard';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const AdminLandRegistration = () => {
    const { theme } = useThemeStore();
    const isDark = theme === 'dark';
    
    const [lands, setLands] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [viewDoc, setViewDoc] = useState(null);
    const [statusFilter, setStatusFilter] = useState("PENDING");

    const fetchLands = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${API_BASE}/api/feature1/admin/lands?status=${statusFilter}`);
            setLands(res.data);
            console.log(`[ADMIN] Fetched ${statusFilter} lands:`, res.data);
        } catch (error) {
            console.error("Failed to fetch lands", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLands();
    }, [statusFilter]);

    const handleAction = async (landId, action) => {
        try {
            setActionLoading(landId);
            await axios.post(`${API_BASE}/api/feature1/admin/approve`, {
                land_id: landId,
                action: action
            });
            fetchLands(); 
            setViewDoc(null);
        } catch (error) {
            console.error("Action failed", error);
            alert("Action failed: " + (error.response?.data?.detail || error.message));
        } finally {
            setActionLoading(null);
        }
    };

    const filteredLands = lands.filter(land => 
        land.users?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        land.id?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className={`min-h-screen ${isDark ? 'bg-slate-950 text-slate-200' : 'bg-slate-50 text-slate-900'} font-['Outfit']`}>
            {/* Header */}
            <header className={`sticky top-0 z-40 backdrop-blur-md border-b ${isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-white/80 border-slate-200'} px-8 py-6`}>
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <ShieldCheck className="text-emerald-500 w-6 h-6" />
                            <h1 className="text-3xl font-black tracking-tighter uppercase italic">Registry Command Center</h1>
                        </div>
                        <p className={`text-xs font-bold uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Official Administrative Verification Interface</p>
                    </div>
                    
                    <div className="relative group">
                        <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${isDark ? 'text-slate-600 group-focus-within:text-emerald-500' : 'text-slate-400 group-focus-within:text-emerald-600'}`} />
                        <input 
                            type="text" 
                            placeholder="SEARCH BY OWNER OR ID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className={`pl-12 pr-6 py-3 rounded-full text-xs font-bold uppercase tracking-widest outline-none border-2 transition-all w-full md:w-80 ${
                                isDark ? 'bg-slate-900 border-slate-800 focus:border-emerald-500 focus:bg-slate-800' : 'bg-white border-slate-100 border-slate-200 focus:border-emerald-600 focus:bg-white'
                            }`}
                        />
                    </div>
                </div>
            </header>

            <div className={`border-b ${isDark ? 'bg-slate-900/40 border-slate-800' : 'bg-slate-100 border-slate-200'}`}>
                <div className="max-w-7xl mx-auto px-8 flex gap-8">
                    {['PENDING', 'VERIFIED', 'REJECTED', 'ALL'].map((status) => (
                        <button
                            key={status}
                            onClick={() => setStatusFilter(status)}
                            className={`py-4 text-[10px] font-black uppercase tracking-widest transition-all border-b-2 ${
                                statusFilter === status 
                                ? 'border-emerald-500 text-emerald-500' 
                                : 'border-transparent text-slate-500 hover:text-slate-300'
                            }`}
                        >
                            {status === 'VERIFIED' ? 'APPROVED' : status}
                            <span className="ml-2 px-1.5 py-0.5 rounded-md bg-slate-800 text-[8px]">
                                {lands.filter(l => status === 'ALL' || l.status === status).length || 0}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-8 py-12">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-32 space-y-6">
                        <Loader2 className="w-12 h-12 text-emerald-500 animate-spin" />
                        <p className="text-sm font-black uppercase tracking-[0.3em] text-slate-500 animate-pulse">Syncing with Registry Node...</p>
                    </div>
                ) : filteredLands.length === 0 ? (
                    <div className={`rounded-3xl border-2 border-dashed flex flex-col items-center justify-center py-32 ${isDark ? 'bg-slate-900/40 border-slate-800' : 'bg-slate-100 border-slate-200'}`}>
                        <div className="p-6 rounded-full bg-slate-800/10 mb-6">
                            <AlertCircle className="w-12 h-12 text-slate-500" />
                        </div>
                        <h3 className="text-xl font-black italic mb-2">Queue Cleared</h3>
                        <p className="text-sm text-slate-500 font-bold uppercase tracking-widest">No pending registrations found in this sector</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-10">
                        {filteredLands.map((land) => (
                            <SpotlightCard key={land.id}>
                                <div className="p-8 flex flex-col lg:flex-row gap-10">
                                    {/* Left Content */}
                                    <div className="flex-1 space-y-8">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <div className="flex items-center gap-3 mb-2">
                                                    <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                                                        land.status === 'VERIFIED' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                                                        land.status === 'REJECTED' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' :
                                                        'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                                                    }`}>
                                                        {land.status === 'VERIFIED' ? 'APPROVED' : land.status === 'REJECTED' ? 'REJECTED' : 'PENDING REVIEW'}
                                                    </div>
                                                    <span className="text-[10px] font-bold text-slate-500 tracking-tighter select-all">UUID: {land.id}</span>
                                                </div>
                                                <h2 className="text-4xl font-black tracking-tighter italic uppercase">{land.users?.full_name || 'Anonymous User'}</h2>
                                            </div>
                                            <div className="p-4 rounded-2xl bg-slate-500/5 border border-slate-500/10">
                                                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 text-right">Mapped Area</div>
                                                <div className="text-2xl font-black tracking-tighter text-emerald-500">{land.area_sqm?.toFixed(2)} SQM</div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                            <div className={`p-5 rounded-2xl border ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200'}`}>
                                                <div className="flex items-center gap-3 mb-3 text-emerald-500">
                                                    <MapPin className="w-4 h-4" />
                                                    <span className="text-[10px] font-black uppercase tracking-widest">GPS Boundaries</span>
                                                </div>
                                                <p className="text-xs font-bold text-slate-500 leading-relaxed">{land.polygon_coordinates?.length} data points anchored in spatial sequence.</p>
                                            </div>

                                            <div className={`p-5 rounded-2xl border ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200'}`}>
                                                <div className="flex items-center gap-3 mb-3 text-emerald-500">
                                                    <Calendar className="w-4 h-4" />
                                                    <span className="text-[10px] font-black uppercase tracking-widest">Recorded Date</span>
                                                </div>
                                                <p className="text-xs font-bold text-slate-500 leading-relaxed">{new Date(land.created_at).toLocaleDateString()} at {new Date(land.created_at).toLocaleTimeString()}</p>
                                            </div>

                                            <div className={`p-5 rounded-2xl border ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200'}`}>
                                                <div className="flex items-center gap-3 mb-3 text-emerald-500">
                                                    <User className="w-4 h-4" />
                                                    <span className="text-[10px] font-black uppercase tracking-widest">Contact Identity</span>
                                                </div>
                                                <p className="text-xs font-bold text-slate-500 leading-relaxed">{land.users?.email || 'N/A'}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right Section: Document Controls */}
                                    <div className="w-full lg:w-80 flex flex-col justify-between p-6 rounded-3xl bg-slate-500/5 border border-slate-500/10">
                                        <div>
                                            <div className="flex items-center gap-3 mb-4">
                                                <FileText className="text-emerald-500 w-5 h-5" />
                                                <h3 className="text-xs font-black uppercase tracking-widest">Attached Assets</h3>
                                            </div>
                                            
                                            <div className="flex flex-col gap-3">
                                                {land.land_documents && land.land_documents.length > 0 ? (
                                                    land.land_documents.map((doc, dIdx) => (
                                                        <button 
                                                            key={doc.id}
                                                            onClick={() => setViewDoc({ url: doc.document_url, info: doc })}
                                                            className={`group w-full p-4 rounded-xl border transition-all flex items-center justify-between ${
                                                                isDark ? 'bg-slate-900 border-slate-800 hover:border-emerald-500/50' : 'bg-white border-slate-100 border-slate-200 hover:border-emerald-500/50'
                                                            }`}
                                                        >
                                                            <div className="flex flex-col items-start overflow-hidden text-left">
                                                                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500 truncate w-full">
                                                                    {doc.document_type || `Registry Doc #${dIdx + 1}`}
                                                                </span>
                                                                <span className="text-[9px] font-bold text-slate-500 uppercase mt-1">
                                                                    ID: {doc.id.slice(0, 8)}...
                                                                </span>
                                                            </div>
                                                            <Eye size={16} className="text-slate-600 group-hover:text-emerald-500 transition-colors shrink-0 ml-4" />
                                                        </button>
                                                    ))
                                                ) : (
                                                    <div className="py-8 flex flex-col items-center justify-center border-2 border-dashed border-slate-800 rounded-2xl opacity-50">
                                                        <FileText size={24} className="text-slate-700 mb-2" />
                                                        <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">No media attached</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3 mt-8">
                                            <button 
                                                onClick={() => handleAction(land.id, 'REJECT')}
                                                disabled={actionLoading === land.id}
                                                className={`py-3 rounded-xl border font-black text-[10px] uppercase tracking-widest transition-all ${
                                                    isDark ? 'bg-slate-950 border-rose-500/30 text-rose-500 hover:bg-rose-500/10' : 'bg-white border-rose-100 border-rose-200 text-rose-600 hover:bg-rose-50'
                                                } disabled:opacity-50`}
                                            >
                                                {actionLoading === land.id ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Reject Entry'}
                                            </button>
                                            <button 
                                                onClick={() => handleAction(land.id, 'APPROVE')}
                                                disabled={actionLoading === land.id}
                                                className="py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-emerald-600/20 disabled:opacity-50"
                                            >
                                                {actionLoading === land.id ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Anchor & Approve'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </SpotlightCard>
                        ))}
                    </div>
                )}
            </main>

            {/* Document Review Modal */}
            {viewDoc && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/95 backdrop-blur-xl p-6 md:p-12 overflow-hidden animate-in fade-in zoom-in duration-300">
                    <button 
                        onClick={() => setViewDoc(null)}
                        className="absolute top-8 right-8 p-3 rounded-full bg-slate-800 text-white hover:bg-slate-700 transition-colors transition-transform active:scale-95 group"
                    >
                        <XCircle size={28} className="group-hover:rotate-90 transition-transform duration-500" />
                    </button>
                    
                    <div className="w-full h-full max-w-7xl flex flex-col md:flex-row gap-8">
                        <div className="flex-1 bg-slate-900 rounded-[2rem] border border-slate-800 overflow-hidden relative shadow-2xl flex flex-col group">
                            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
                                        <FileText size={16} />
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Registry Asset View</span>
                                </div>
                                <a 
                                    href={viewDoc.url} 
                                    download="land_document" 
                                    className="text-[10px] font-black uppercase text-emerald-500 hover:text-emerald-400 underline tracking-widest"
                                >
                                    Download Original
                                </a>
                            </div>
                            
                            <div className="flex-1 relative bg-black/40 overflow-auto flex items-center justify-center p-4">
                                {viewDoc.url.startsWith('data:application/pdf') || viewDoc.url.endsWith('.pdf') ? (
                                    <embed src={viewDoc.url} className="w-full h-full rounded-xl" type="application/pdf" />
                                ) : (
                                    <img src={viewDoc.url} alt="Registry Document" className="max-w-full max-h-full object-contain shadow-2xl rounded-sm" />
                                )}
                            </div>
                        </div>

                        <div className="w-full md:w-96 space-y-6 flex flex-col">
                            <div className="p-8 rounded-[2rem] bg-slate-900 border border-slate-800 space-y-6">
                                <h4 className="text-xl font-black italic tracking-tight text-white uppercase italic">AI Intelligence Report</h4>
                                
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between py-2 border-b border-slate-800/50">
                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Document Type</span>
                                        <span className="text-[10px] font-black text-emerald-500">{viewDoc.info?.document_type || 'N/A'}</span>
                                    </div>
                                    <div className="flex items-center justify-between py-2 border-b border-slate-800/50">
                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Owner Name</span>
                                        <span className="text-[10px] font-black text-white">{viewDoc.info?.owner_name || 'PENDING DETECTION'}</span>
                                    </div>
                                    <div className="flex items-center justify-between py-2 border-b border-slate-800/50">
                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Survey Number</span>
                                        <span className="text-[10px] font-black text-white">{viewDoc.info?.survey_number || 'PENDING DETECTION'}</span>
                                    </div>
                                    <div className="flex items-center justify-between py-2 border-b border-slate-800/50">
                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Data Confidence</span>
                                        <span className="text-[10px] font-black text-blue-500">{((viewDoc.info?.confidence_score || 0) * 100).toFixed(1)}%</span>
                                    </div>
                                </div>

                                <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800 text-[9px] font-bold text-slate-400 italic leading-relaxed uppercase tracking-widest">
                                    Note: Documents are natively decrypted and rendered directly from the Registry Database node.
                                </div>
                            </div>
                            
                            <div className="flex-1 p-8 rounded-[2rem] bg-emerald-600/5 border border-emerald-500/10 flex flex-col justify-center">
                                <div className="text-emerald-500 mb-2 font-black italic uppercase italic tracking-tighter text-3xl leading-none">Status: Ready</div>
                                <p className="text-xs font-bold text-slate-500 leading-relaxed mb-6">This document fulfills the sector requirements for verification. You may now anchor this claim to the blockchain permanently.</p>
                                <button 
                                    onClick={() => setViewDoc(null)}
                                    className="w-full py-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-black text-xs uppercase tracking-[0.2em] transition-all active:scale-95"
                                >
                                    Close Identity Viewer
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminLandRegistration;
