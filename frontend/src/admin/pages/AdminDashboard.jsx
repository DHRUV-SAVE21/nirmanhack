/**
 * AdminDashboard.jsx
 * -------------------
 * Unified Admin + Grampanchayat Portal for Annadata Saathi
 * Tabs: Overview | Grampanchayat Portal | Farmers | Soil Reports | Activity Log
 */

import React, { useState } from 'react';
import {
    BarChart2, Users, Leaf, FileText, Activity, ChevronRight,
    CheckCircle, Clock, XCircle, AlertTriangle, TrendingUp,
    MapPin, Phone, Star, Building2, Home, RefreshCw,
    Download, Search, Filter, Eye, ArrowUpRight, Landmark,
    Sprout, IndianRupee, Package, MessageSquare, Shield
} from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// ── Helpers ────────────────────────────────────────────────────
const fmtRs = (n) => `₹${new Intl.NumberFormat('en-IN', { notation: 'compact', maximumFractionDigits: 1 }).format(n)}`;

const STATUS_STYLES = {
    pending:      'bg-amber-100  text-amber-700  dark:bg-amber-900/30  dark:text-amber-400',
    under_review: 'bg-blue-100   text-blue-700   dark:bg-blue-900/30   dark:text-blue-400',
    approved:     'bg-green-100  text-green-700  dark:bg-green-900/30  dark:text-green-400',
    rejected:     'bg-red-100    text-red-700    dark:bg-red-900/30    dark:text-red-400',
    forwarded:    'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    active:       'bg-green-100  text-green-700  dark:bg-green-900/30  dark:text-green-400',
    completed:    'bg-slate-100  text-slate-500  dark:bg-slate-800     dark:text-slate-400',
    paused:       'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
};

const PRIORITY_STYLES = {
    urgent: 'bg-red-500    text-white',
    high:   'bg-orange-500 text-white',
    normal: 'bg-slate-200  text-slate-700 dark:bg-slate-700 dark:text-slate-300',
    low:    'bg-slate-100  text-slate-500',
};

const Badge = ({ label, style }) => (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold capitalize ${style}`}>{label}</span>
);

// ── Static mock data ─────────────
const MOCK_GPS = [
    { id: '1', gp_name: 'Dahanu Gram Panchayat',    district: 'Palghar',   taluka: 'Dahanu',      sarpanch_name: 'Leelabai Kokate', phone: '9881234504', is_active: true,  farmers: 142,  pending: 8 },
    { id: '2', gp_name: 'Vasai Virar Gram Panchayat',district: 'Palghar',  taluka: 'Vasai',       sarpanch_name: 'Kashinath Mhatre',phone: '9881234506', is_active: true,  farmers: 110,  pending: 5 },
    { id: '3', gp_name: 'Palghar Rural GP',         district: 'Palghar',   taluka: 'Palghar',     sarpanch_name: 'Suresh Patil',    phone: '9881234507', is_active: true,  farmers: 85,   pending: 3 },
    { id: '4', gp_name: 'Pingli Gram Panchayat',    district: 'Pune',      taluka: 'Purandar',    sarpanch_name: 'Ramesh Bhosale',  phone: '9881234501', is_active: true,  farmers: 82,   pending: 5 },
    { id: '5', gp_name: 'Vadgaon Gram Panchayat',   district: 'Nashik',    taluka: 'Niphad',      sarpanch_name: 'Sunitabai Patil', phone: '9881234502', is_active: true,  farmers: 105,  pending: 2 },
    { id: '6', gp_name: 'Wani Rural GP',            district: 'Yavatmal',  taluka: 'Wani',        sarpanch_name: 'Suresh Gaikwad',  phone: '9881234505', is_active: true,  farmers: 58,   pending: 4 },
];

const MOCK_SUBMISSIONS = [
    { id: 's100', gp_name: 'Dahanu GP',  farmer_name: 'Tukaram Bari',      village: 'Bordi',       mobile: '9765008001', land_size: '4.5 Ac', soil_type: 'Coastal Alluvial', crop_type: 'Chikoo, Coconut',   request_type: 'scheme_enrollment', scheme_name: 'Horticulture Subsidy',       priority: 'urgent', status: 'pending',      submitted_at: '2025-04-01', reviewer_note: null },
    { id: 's101', gp_name: 'Vasai GP',   farmer_name: 'Anandi Vartak',     village: 'Arnala',      mobile: '9765008002', land_size: '2.0 Ac', soil_type: 'Alluvial',         crop_type: 'Banana, Vegetables',request_type: 'subsidy',           scheme_name: 'Drip Irrigation',            priority: 'high',   status: 'under_review', submitted_at: '2025-03-29', reviewer_note: 'Awaiting Bank verification for KCC loan.' },
    { id: 's102', gp_name: 'Palghar GP', farmer_name: 'Navnath Save',      village: 'Kelve',       mobile: '9765008003', land_size: '5.2 Ac', soil_type: 'Sandy Loam',       crop_type: 'Paddy, Betelnut',   request_type: 'complaint',         scheme_name: null,                         priority: 'urgent', status: 'forwarded',    submitted_at: '2025-03-25', reviewer_note: 'Forwarded to MSEB. Electricity issue.' },
    { id: 's1', gp_name: 'Pingli GP',  farmer_name: 'Ramchandra Jagtap',  village: 'Pingli',       mobile: '9765001001', land_size: '3.5 Ac', soil_type: 'Black Cotton', crop_type: 'Soybean, Wheat',     request_type: 'scheme_enrollment', scheme_name: 'PM Kisan Samman Nidhi',      priority: 'high',   status: 'approved',     submitted_at: '2025-03-14', reviewer_note: 'Verified 7/12 extract. Approved.' },
    { id: 's2', gp_name: 'Pingli GP',  farmer_name: 'Sunita Bhagat',      village: 'Khed',         mobile: '9765001002', land_size: '1.8 Ac', soil_type: 'Alluvial',      crop_type: 'Onion, Sugarcane',   request_type: 'subsidy',           scheme_name: 'PMFBY Crop Insurance',       priority: 'urgent', status: 'under_review', submitted_at: '2025-03-27', reviewer_note: null },
    { id: 's6', gp_name: 'Vadgaon GP', farmer_name: 'Ashok Sonawane',      village: 'Vadgaon',      mobile: '9765002001', land_size: '4.5 Ac', soil_type: 'Alluvial',     crop_type: 'Grapes',             request_type: 'scheme_enrollment', scheme_name: 'e-NAM (Online Agri)',        priority: 'high',   status: 'approved',     submitted_at: '2025-03-12', reviewer_note: 'Registered on e-NAM. Trader ID: ENM-8821.' },
];

const MOCK_SCHEMES = [
    { name: 'Palghar Coastal Horticulture',   ministry: 'State Govt',               budget: 4500000,  used: 2800000,  beneficiaries: 142,  status: 'active' },
    { name: 'PM Kisan Samman Nidhi',          ministry: 'Ministry of Agriculture',  budget: 12000000, used: 9800000,  beneficiaries: 4882, status: 'active' },
    { name: 'PMFBY Crop Insurance',           ministry: 'Ministry of Finance',       budget: 2800000,  used: 1750000,  beneficiaries: 680,  status: 'active' },
    { name: 'Kisan Credit Card',              ministry: 'Ministry of Finance',       budget: 3200000,  used: 2100000,  beneficiaries: 740,  status: 'active' },
];

const MOCK_ACTIVITY = [
    { actor: 'Dahanu GP',    action: 'Filed',      target: 'Chikoo storm damage assessment request — Tukaram Bari',      time: '1 hr ago',   color: 'red' },
    { actor: 'Admin',        action: 'Approved',   target: 'Horticulture subsidy for 24 farmers in Vasai Virar',       time: '2 hrs ago',  color: 'green' },
    { actor: 'Palghar GP',   action: 'Forwarded',  target: 'Irrigation electricity complaint → MSEB Dahanu branch',     time: '4 hrs ago',  color: 'purple'},
    { actor: 'System',       action: 'Generated',  target: 'Soil PDF report — Anandi Vartak (Marathi)',                  time: '5 hrs ago',  color: 'blue'  },
    { actor: 'Admin',        action: 'Disbursed',  target: 'PM Kisan March installment ₹2000 × 274 farmers via DBT',     time: '1 day ago',  color: 'green' },
];

const MOCK_REPORT_LOGS = [
    { farmer: 'Tukaram Bari',      lang: 'Marathi', soil: 'Coastal Alluvial', farm: '4.5 Ac', date: 'Apr 01, 2025', gp: 'Dahanu GP' },
    { farmer: 'Anandi Vartak',     lang: 'Marathi', soil: 'Alluvial',         farm: '2.0 Ac', date: 'Mar 31, 2025', gp: 'Vasai GP' },
    { farmer: 'Navnath Save',      lang: 'English', soil: 'Sandy Loam',       farm: '5.2 Ac', date: 'Mar 30, 2025', gp: 'Palghar GP' },
    { farmer: 'Ramchandra Jagtap', lang: 'Marathi', soil: 'Black Cotton',     farm: '3.5 Ac', date: 'Mar 22, 2025', gp: 'Pingli GP' },
    { farmer: 'Ashok Sonawane',    lang: 'English', soil: 'Alluvial',         farm: '4.5 Ac', date: 'Mar 25, 2025', gp: 'Vadgaon GP' },
];

// ── Stat Card ─────────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, sub, color }) => (
    <div className={`relative overflow-hidden rounded-2xl p-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm transition group`}>
        <div className={`absolute top-0 right-0 w-24 h-24 ${color} opacity-10 rounded-full -mr-8 -mt-8 group-hover:scale-125 transition-transform duration-500`} />
        <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center mb-3`}>
            <Icon size={20} className="text-white" />
        </div>
        <div className="text-2xl font-bold text-slate-900 dark:text-white">{value}</div>
        <div className="text-sm font-semibold text-slate-600 dark:text-slate-300 mt-0.5">{label}</div>
        {sub && <div className="text-xs text-slate-400 mt-1">{sub}</div>}
    </div>
);

const BudgetBar = ({ used, total }) => {
    const pct = Math.min(100, Math.round((used / total) * 100));
    const color = pct >= 95 ? 'bg-red-500' : pct >= 75 ? 'bg-amber-500' : 'bg-emerald-500';
    return (
        <div>
            <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
                <span>{fmtRs(used)} used</span>
                <span>{pct}%</span>
            </div>
            <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
            </div>
            <div className="text-[10px] text-slate-400 mt-1">of {fmtRs(total)} allocated</div>
        </div>
    );
};

// ── Main Component ─────────────────────────────────────────────
const AdminDashboard = () => {
    const [activeTab, setActiveTab] = useState('overview');
    const [activeGP, setActiveGP]   = useState(null);
    const [searchQ,  setSearchQ]    = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    const tabs = [
        { id: 'overview',   label: 'Overview',          icon: BarChart2   },
        { id: 'gp',         label: 'Grampanchayat',     icon: Landmark    },
        { id: 'farmers',    label: 'Farmer Requests',   icon: Users       },
        { id: 'schemes',    label: 'Schemes',           icon: IndianRupee },
        { id: 'reports',    label: 'Soil Reports',      icon: Leaf        },
        { id: 'activity',   label: 'Activity Log',      icon: Activity    },
    ];

    const filteredSubs = MOCK_SUBMISSIONS.filter(s => {
        const q = searchQ.toLowerCase();
        const matchQ = !q || s.farmer_name.toLowerCase().includes(q) || s.village.toLowerCase().includes(q) || (s.scheme_name||'').toLowerCase().includes(q);
        const matchS = statusFilter === 'all' || s.status === statusFilter;
        const matchGP = !activeGP || s.gp_name.toLowerCase().includes(MOCK_GPS.find(g=>g.id===activeGP)?.gp_name.split(' ')[0]?.toLowerCase()||'');
        return matchQ && matchS && matchGP;
    });

    return (
        <div className="w-full h-full pb-10 fade-in-up">
            
            {/* ── Page Header ─────────────────────────────── */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pt-2">
                <div>
                    <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-1">
                        <Shield size={14} className="text-emerald-500" />
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">Palghar & Maharashtra Admin Module</span>
                    </div>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg text-sm font-semibold text-emerald-700 dark:text-emerald-400 shadow-sm">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Live System Active
                </div>
            </div>

            {/* ── Tab Navigation ──────────────────────────── */}
            <div className="flex gap-1.5 mb-8 overflow-x-auto pb-1 no-scrollbar border-b border-slate-200 dark:border-slate-800">
                {tabs.map(t => {
                    const Icon = t.icon;
                    return (
                        <button
                            key={t.id}
                            onClick={() => setActiveTab(t.id)}
                            className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold whitespace-nowrap transition-all border-b-2
                                ${activeTab === t.id
                                    ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700'
                                }`}
                        >
                            <Icon size={16} />
                            {t.label}
                        </button>
                    );
                })}
            </div>

            {/* ══════════════════════════════════════════════
                TAB: OVERVIEW
            ══════════════════════════════════════════════ */}
            {activeTab === 'overview' && (
                <div className="space-y-6">
                    {/* Stat Cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <StatCard icon={Users}        label="Platform Farmers"       value="14,284"   sub="+312 since last week (Palghar high)" color="bg-emerald-500" />
                        <StatCard icon={Landmark}     label="GP Portals"             value="42"       sub="8 in Palghar district"          color="bg-blue-500"   />
                        <StatCard icon={FileText}     label="Pending DB Approvals"   value="21"       sub="8 urgent claims"                color="bg-amber-500"  />
                        <StatCard icon={TrendingUp}   label="Disbursed Subsidy"      value="₹8.4 Cr"  sub="FY 2024-25 Total"               color="bg-indigo-500" />
                    </div>

                    {/* Summary Tables Row */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* GP Summary */}
                        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/20">
                                <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                    <Landmark size={16} className="text-emerald-500"/> Regional Grampanchayats
                                </div>
                                <button onClick={() => setActiveTab('gp')} className="text-xs text-emerald-600 font-bold flex items-center gap-1 hover:gap-2 transition-all">
                                    Manage All <ChevronRight size={13} />
                                </button>
                            </div>
                            <div className="divide-y divide-slate-50 dark:divide-slate-800">
                                {MOCK_GPS.slice(0, 4).map(gp => (
                                    <div key={gp.id} className="px-5 py-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-2 h-2 rounded-full ${gp.is_active ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                                            <div>
                                                <p className="text-sm font-semibold text-slate-800 dark:text-white">{gp.gp_name}</p>
                                                <p className="text-xs text-slate-400">{gp.district} • {gp.farmers} farmers connected</p>
                                            </div>
                                        </div>
                                        {gp.pending > 0 && (
                                            <span className="text-xs font-bold bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400 px-2 py-0.5 rounded-full">
                                                {gp.pending} flags
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Recent Activity (mini) */}
                        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/20">
                                <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                    <Activity size={16} className="text-blue-500"/> Priority Logs
                                </div>
                                <button onClick={() => setActiveTab('activity')} className="text-xs text-blue-600 font-bold flex items-center gap-1 hover:gap-2 transition-all">
                                    View Log <ChevronRight size={13} />
                                </button>
                            </div>
                            <div className="divide-y divide-slate-50 dark:divide-slate-800">
                                {MOCK_ACTIVITY.map((a, i) => (
                                    <div key={i} className="px-5 py-3 flex items-start gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                                        <div className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 bg-${a.color}-500`} />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs text-slate-700 dark:text-slate-300 leading-tight">
                                                <span className="font-bold">{a.actor}</span> • {a.action}
                                            </p>
                                            <p className="text-xs font-medium text-slate-800 dark:text-slate-200 mt-1 leading-snug">{a.target}</p>
                                        </div>
                                        <span className="text-[10px] text-slate-400 font-semibold">{a.time}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ══════════════════════════════════════════════
                TAB: GRAMPANCHAYAT PORTAL
            ══════════════════════════════════════════════ */}
            {activeTab === 'gp' && (
                <div className="space-y-6">
                    <div className="flex items-center justify-between mb-2">
                        <h2 className="text-lg font-bold">Registered Grampanchayats Network</h2>
                        <button className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-bold flex items-center gap-2">
                            <Building2 size={16} /> Add GP Node
                        </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {MOCK_GPS.map(gp => (
                            <div key={gp.id}
                                onClick={() => { setActiveGP(gp.id === activeGP ? null : gp.id); setActiveTab('farmers'); }}
                                className={`bg-white dark:bg-slate-900 rounded-2xl border transition-all shadow-sm p-5 cursor-pointer group hover:-translate-y-1
                                    ${gp.district === 'Palghar' ? 'border-blue-200 dark:border-blue-800 hover:shadow-blue-500/10' : 'border-slate-200 dark:border-slate-800 hover:shadow-emerald-500/10'}`}>
                                <div className="flex items-start justify-between mb-4">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${gp.is_active ? 'bg-slate-100 dark:bg-slate-800' : 'bg-slate-100 dark:bg-slate-800'}`}>
                                        <Home size={22} className={gp.district === 'Palghar' ? 'text-blue-500' : 'text-emerald-500'} />
                                    </div>
                                    <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                                        Active
                                    </span>
                                </div>

                                <h3 className="font-bold text-slate-900 dark:text-white text-lg leading-tight mb-1 group-hover:text-emerald-500 transition-colors">{gp.gp_name}</h3>
                                <p className="text-xs font-semibold text-slate-500 mb-4 bg-slate-100 dark:bg-slate-800 inline-block px-2 py-1 rounded">
                                    {gp.taluka} Taluka, {gp.district}
                                </p>

                                <div className="grid grid-cols-2 gap-3 mb-4">
                                    <div>
                                        <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-0.5">Sarpanch</p>
                                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">{gp.sarpanch_name}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-0.5">Farmers</p>
                                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                                            <Users size={12}/> {gp.farmers}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                                    {gp.pending > 0 ? (
                                        <div className="flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400">
                                            <AlertTriangle size={14} /> {gp.pending} actions required
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
                                            <CheckCircle size={14} /> All cleared
                                        </div>
                                    )}
                                    <span className="text-xs font-bold flex items-center gap-1 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-emerald-500">
                                        View Data <ChevronRight size={12} />
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ══════════════════════════════════════════════
                TAB: FARMER REQUESTS
            ══════════════════════════════════════════════ */}
            {activeTab === 'farmers' && (
                <div className="space-y-5">
                    {/* Filters */}
                    <div className="flex flex-col md:flex-row gap-3 md:items-center p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <div className="relative flex-1 min-w-[200px]">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                value={searchQ}
                                onChange={e => setSearchQ(e.target.value)}
                                placeholder="Search farmer, village, scheme..."
                                className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                            />
                        </div>
                        <div className="flex gap-3">
                            <select
                                value={statusFilter}
                                onChange={e => setStatusFilter(e.target.value)}
                                className="px-3 py-2 text-sm font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none"
                            >
                                <option value="all">All Status</option>
                                <option value="pending">Pending</option>
                                <option value="under_review">Under Review</option>
                                <option value="approved">Approved</option>
                            </select>
                            {activeGP && (
                                <button onClick={() => setActiveGP(null)} className="px-3 py-2 text-xs rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold hover:bg-emerald-100 transition whitespace-nowrap">
                                    Clear GP Filter ×
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Submissions Cards */}
                    <div className="grid gap-4">
                        {filteredSubs.map(s => (
                            <div key={s.id} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col md:flex-row">
                                <div className="p-5 flex-1">
                                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                                        <h3 className="font-bold text-lg text-slate-900 dark:text-white">{s.farmer_name}</h3>
                                        <Badge label={s.priority} style={PRIORITY_STYLES[s.priority]||''} />
                                        <Badge label={s.status.replace('_',' ')} style={STATUS_STYLES[s.status]||''} />
                                        <span className="text-[10px] font-bold text-slate-400 ml-auto bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">ID: {s.id}</span>
                                    </div>
                                    <div className="flex items-center gap-4 text-xs text-slate-500 mb-4 font-medium">
                                        <span className="flex items-center gap-1.5"><MapPin size={12}/> {s.village}</span>
                                        <span className="flex items-center gap-1.5"><Phone size={12}/> {s.mobile}</span>
                                        <span className="flex items-center gap-1.5"><Building2 size={12} className={s.gp_name.includes('Dahanu')||s.gp_name.includes('Vasai')?'text-blue-500':''}/> <span className={s.gp_name.includes('Dahanu')||s.gp_name.includes('Vasai')?'text-blue-600 dark:text-blue-400 font-bold':''}>{s.gp_name}</span></span>
                                        <span className="flex items-center gap-1.5"><Clock size={12}/> {s.submitted_at}</span>
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-2.5 border border-slate-100 dark:border-slate-700/50">
                                            <p className="text-[10px] uppercase font-bold text-slate-400">Farm Size</p>
                                            <p className="text-sm font-semibold">{s.land_size}</p>
                                        </div>
                                        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-2.5 border border-slate-100 dark:border-slate-700/50">
                                            <p className="text-[10px] uppercase font-bold text-slate-400">Soil Type</p>
                                            <p className="text-sm font-semibold">{s.soil_type}</p>
                                        </div>
                                        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-2.5 border border-slate-100 dark:border-slate-700/50">
                                            <p className="text-[10px] uppercase font-bold text-slate-400">Crop Focus</p>
                                            <p className="text-sm font-semibold truncate">{s.crop_type}</p>
                                        </div>
                                        <div className="bg-blue-50 dark:bg-blue-900/10 rounded-lg p-2.5 border border-blue-100 dark:border-blue-800/50">
                                            <p className="text-[10px] uppercase font-bold text-blue-500">{s.request_type.replace('_',' ')}</p>
                                            <p className="text-sm font-bold text-blue-700 dark:text-blue-300 truncate">{s.scheme_name || 'General Inquiry'}</p>
                                        </div>
                                    </div>

                                    {s.reviewer_note && (
                                        <div className="mt-4 p-3 rounded-lg bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-800/30">
                                            <p className="text-xs font-semibold text-green-700 dark:text-green-400 flex items-start gap-2">
                                                <CheckCircle size={14} className="mt-0.5 shrink-0"/> {s.reviewer_note}
                                            </p>
                                        </div>
                                    )}
                                </div>
                                
                                <div className="p-5 bg-slate-50 dark:bg-slate-800/30 border-t md:border-t-0 md:border-l border-slate-200 dark:border-slate-800 flex md:flex-col justify-center gap-2 md:w-48 shrink-0">
                                    {s.status === 'pending' || s.status === 'under_review' ? (
                                        <>
                                            <button className="flex-1 w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-sm">
                                                Approve Request
                                            </button>
                                            <button className="flex-1 w-full py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg text-xs font-bold transition">
                                                Request Info
                                            </button>
                                        </>
                                    ) : (
                                        <button className="w-full py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg text-xs font-bold transition">
                                            View Details
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}

                        {filteredSubs.length === 0 && (
                            <div className="text-center py-16 text-slate-500 bg-white dark:bg-slate-900 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                                <Search size={32} className="mx-auto mb-3 opacity-20" />
                                <p className="font-semibold">No requests match the current filters.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ══════════════════════════════════════════════
                TAB: SCHEMES
            ══════════════════════════════════════════════ */}
            {activeTab === 'schemes' && (
                <div className="grid lg:grid-cols-2 gap-4">
                    {MOCK_SCHEMES.map((s, i) => (
                        <div key={i} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-1">{s.name}</h3>
                                    <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">{s.ministry}</p>
                                </div>
                                <Badge label={s.status} style={STATUS_STYLES[s.status]||''} />
                            </div>
                            
                            <div className="mb-5 flex items-end gap-2">
                                <div className="text-3xl font-black text-slate-900 dark:text-white">{s.beneficiaries}</div>
                                <div className="text-sm text-slate-500 mb-1 font-medium">Farmers Enrolled</div>
                            </div>

                            <BudgetBar used={s.used} total={s.budget} />
                        </div>
                    ))}
                </div>
            )}

            {/* ══════════════════════════════════════════════
                TAB: SOIL REPORTS
            ══════════════════════════════════════════════ */}
            {activeTab === 'reports' && (
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                    <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30">
                        <div>
                            <h2 className="font-bold text-lg text-slate-900 dark:text-white">Soil Health Record Log</h2>
                            <p className="text-xs font-medium text-slate-500 mt-1">Immutable ledger of recently generated PDF reports</p>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700">
                                    <th className="px-6 py-4 text-left font-bold text-slate-600 dark:text-slate-400">FARMER</th>
                                    <th className="px-4 py-4 text-left font-bold text-slate-600 dark:text-slate-400">GRAMPANCHAYAT</th>
                                    <th className="px-4 py-4 text-left font-bold text-slate-600 dark:text-slate-400">SOIL PROFILE</th>
                                    <th className="px-4 py-4 text-center font-bold text-slate-600 dark:text-slate-400">EXPORT</th>
                                    <th className="px-4 py-4 text-center font-bold text-slate-600 dark:text-slate-400">DATE</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                                {MOCK_REPORT_LOGS.map((r, i) => (
                                    <tr key={i} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                                        <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">{r.farmer}</td>
                                        <td className="px-4 py-4 text-xs font-semibold text-slate-600 dark:text-slate-300">{r.gp}</td>
                                        <td className="px-4 py-4">
                                            <div className="flex flex-col gap-0.5">
                                                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">{r.soil}</span>
                                                <span className="text-[10px] text-slate-500">{r.farm}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            <span className="inline-block text-[10px] font-bold uppercase bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-1 rounded">
                                                {r.lang} PDF
                                            </span>
                                        </td>
                                        <td className="px-4 py-4 text-center text-xs font-medium text-slate-500">{r.date}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ══════════════════════════════════════════════
                TAB: ACTIVITY
            ══════════════════════════════════════════════ */}
            {activeTab === 'activity' && (
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden max-w-4xl mx-auto">
                    <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30">
                        <div>
                            <h2 className="font-bold text-lg text-slate-900 dark:text-white">Admin Audit Log</h2>
                        </div>
                    </div>
                    <div className="p-2">
                        {MOCK_ACTIVITY.map((a, i) => (
                            <div key={i} className="flex items-start gap-4 p-4 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/40 transition mx-2 my-1">
                                <div className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 bg-${a.color}-500 ring-4 ring-${a.color}-100 dark:ring-${a.color}-900/30`} />
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-sm font-bold text-slate-900 dark:text-white">{a.actor}</span>
                                        <span className={`text-[10px] uppercase font-bold text-${a.color}-600 dark:text-${a.color}-400 bg-${a.color}-50 dark:bg-${a.color}-500/10 px-2 py-0.5 rounded`}>
                                            {a.action}
                                        </span>
                                        <span className="text-xs text-slate-400 ml-auto">{a.time}</span>
                                    </div>
                                    <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">{a.target}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

        </div>
    );
};

export default AdminDashboard;
