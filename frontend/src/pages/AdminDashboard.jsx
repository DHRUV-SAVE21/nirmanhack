/**
 * AdminDashboard.jsx
 * -------------------
 * Unified Admin + Grampanchayat Portal
 * Tabs: Overview | Grampanchayat Portal | Farmers | Soil Reports | Activity Log
 */

import React, { useState, useEffect } from 'react';
import {
    BarChart2, Users, Leaf, FileText, Activity, ChevronRight,
    CheckCircle, Clock, XCircle, AlertTriangle, TrendingUp,
    MapPin, Phone, Star, Building2, Home, RefreshCw,
    Download, Search, Filter, Eye, ArrowUpRight, Landmark,
    Sprout, IndianRupee, Package, MessageSquare, Shield
} from 'lucide-react';
import { API_BASE_URL } from '../config/api';
import GooeyNavbar from '../components/layout/GooeyNavbar';

// ── Helpers ────────────────────────────────────────────────────
const fmt = (n) => new Intl.NumberFormat('en-IN').format(n);
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

// ── Static mock data (mirrors what's in Supabase) ─────────────
const MOCK_GPS = [
    { id: '1', gp_name: 'Pingli Gram Panchayat',   district: 'Pune',      taluka: 'Purandar',    sarpanch_name: 'Ramesh Bhosale',  phone: '9881234501', is_active: true,  farmers: 82,  pending: 5 },
    { id: '2', gp_name: 'Vadgaon Gram Panchayat',  district: 'Nashik',    taluka: 'Niphad',      sarpanch_name: 'Sunitabai Patil', phone: '9881234502', is_active: true,  farmers: 105, pending: 2 },
    { id: '3', gp_name: 'Kasbe Sukene GP',          district: 'Kolhapur',  taluka: 'Hatkanangle', sarpanch_name: 'Arun Deshmukh',   phone: '9881234503', is_active: true,  farmers: 44,  pending: 1 },
    { id: '4', gp_name: 'Dahanu Gram Panchayat',    district: 'Palghar',   taluka: 'Dahanu',      sarpanch_name: 'Leelabai Kokate', phone: '9881234504', is_active: false, farmers: 37,  pending: 0 },
    { id: '5', gp_name: 'Wani Rural GP',            district: 'Yavatmal',  taluka: 'Wani',        sarpanch_name: 'Suresh Gaikwad',  phone: '9881234505', is_active: true,  farmers: 58,  pending: 4 },
];

const MOCK_SUBMISSIONS = [
    { id: 's1', gp_name: 'Pingli GP',  farmer_name: 'Ramchandra Jagtap',  village: 'Pingli',       mobile: '9765001001', land_size: '3.5 Ac', soil_type: 'Black Cotton', crop_type: 'Soybean, Wheat',     request_type: 'scheme_enrollment', scheme_name: 'PM Kisan Samman Nidhi',      priority: 'high',   status: 'approved',     submitted_at: '2025-03-14', reviewer_note: 'Verified 7/12 extract. Approved for ₹2000.' },
    { id: 's2', gp_name: 'Pingli GP',  farmer_name: 'Sunita Bhagat',      village: 'Khed Shivapur',mobile: '9765001002', land_size: '1.8 Ac', soil_type: 'Alluvial',      crop_type: 'Onion, Sugarcane',   request_type: 'subsidy',           scheme_name: 'Drip Irrigation Subsidy',   priority: 'urgent', status: 'under_review', submitted_at: '2025-03-27', reviewer_note: null },
    { id: 's3', gp_name: 'Pingli GP',  farmer_name: 'Vitthal Kale',        village: 'Morgaon',      mobile: '9765001003', land_size: '5.0 Ac', soil_type: 'Black Cotton', crop_type: 'Cotton, Chickpea',   request_type: 'scheme_enrollment', scheme_name: 'PMFBY Crop Insurance',       priority: 'urgent', status: 'forwarded',    submitted_at: '2025-03-29', reviewer_note: 'Forwarded to district insurance office.' },
    { id: 's4', gp_name: 'Pingli GP',  farmer_name: 'Meera Deshpande',     village: 'Saswad',       mobile: '9765001004', land_size: '2.2 Ac', soil_type: 'Loamy',        crop_type: 'Vegetables, Mango',  request_type: 'certificate',       scheme_name: 'Land Record Certificate',    priority: 'normal', status: 'approved',     submitted_at: '2025-03-22', reviewer_note: 'Certificate issued. 7/12 verified.' },
    { id: 's5', gp_name: 'Pingli GP',  farmer_name: 'Ganesh Pawar',        village: 'Pingli',       mobile: '9765001005', land_size: '0.9 Ac', soil_type: 'Sandy',        crop_type: 'Groundnut',          request_type: 'complaint',         scheme_name: null,                         priority: 'urgent', status: 'pending',      submitted_at: '2025-04-01', reviewer_note: null },
    { id: 's6', gp_name: 'Vadgaon GP', farmer_name: 'Ashok Sonawane',      village: 'Vadgaon',      mobile: '9765002001', land_size: '4.5 Ac', soil_type: 'Alluvial',     crop_type: 'Grapes, Pomegranate',request_type: 'scheme_enrollment', scheme_name: 'e-NAM (Online Agri Market)',  priority: 'high',   status: 'approved',     submitted_at: '2025-03-12', reviewer_note: 'Registered on e-NAM. Trader ID: ENM-8821.' },
    { id: 's7', gp_name: 'Vadgaon GP', farmer_name: 'Priya Nikam',         village: 'Niphad',       mobile: '9765002002', land_size: '2.0 Ac', soil_type: 'Red',          crop_type: 'Onion, Garlic',      request_type: 'subsidy',           scheme_name: 'Kisan Credit Card',          priority: 'normal', status: 'under_review', submitted_at: '2025-03-24', reviewer_note: null },
    { id: 's8', gp_name: 'Vadgaon GP', farmer_name: 'Suraybai Mhaske',     village: 'Nashik Rural', mobile: '9765002004', land_size: '1.5 Ac', soil_type: 'Loamy',        crop_type: 'Wheat, Maize',       request_type: 'complaint',         scheme_name: null,                         priority: 'high',   status: 'forwarded',    submitted_at: '2025-03-28', reviewer_note: 'Forwarded to Agriculture Officer, Niphad.' },
    { id: 's9', gp_name: 'Kasbe GP',   farmer_name: 'Kiran Chougule',      village: 'Kasbe Sukene', mobile: '9765003001', land_size: '3.0 Ac', soil_type: 'Laterite',     crop_type: 'Paddy, Turmeric',    request_type: 'scheme_enrollment', scheme_name: 'Paramparagat Krishi Vikas',   priority: 'normal', status: 'approved',     submitted_at: '2025-03-07', reviewer_note: 'PKVY cluster enrolled. Organic cert started.' },
    { id: 's10',gp_name: 'Wani GP',    farmer_name: 'Manoj Wankhede',      village: 'Wani',         mobile: '9765005001', land_size: '8.0 Ac', soil_type: 'Black Cotton', crop_type: 'Cotton, Soybean',    request_type: 'scheme_enrollment', scheme_name: 'SMAM (Farm Mechanization)',   priority: 'high',   status: 'under_review', submitted_at: '2025-03-26', reviewer_note: null },
    { id: 's11',gp_name: 'Wani GP',    farmer_name: 'Rekha Ingole',        village: 'Bolegaon',     mobile: '9765005002', land_size: '2.5 Ac', soil_type: 'Black Cotton', crop_type: 'Soybean, Tur',       request_type: 'scheme_enrollment', scheme_name: 'PM Kisan Samman Nidhi',      priority: 'urgent', status: 'approved',     submitted_at: '2025-03-17', reviewer_note: 'DBT issue resolved. ₹2000 released 28 Mar.' },
    { id: 's12',gp_name: 'Wani GP',    farmer_name: 'Savitri Borate',      village: 'Kalamb',       mobile: '9765005004', land_size: '1.2 Ac', soil_type: 'Sandy',        crop_type: 'Groundnut, Millet',  request_type: 'complaint',         scheme_name: null,                         priority: 'urgent', status: 'pending',      submitted_at: '2025-04-01', reviewer_note: null },
];

const MOCK_SCHEMES = [
    { name: 'PM Kisan Samman Nidhi',          ministry: 'Ministry of Agriculture',  budget: 1200000,  used: 980000,  beneficiaries: 82,  status: 'active' },
    { name: 'PMFBY Crop Insurance',           ministry: 'Ministry of Finance',       budget: 2800000,  used: 1750000, beneficiaries: 67,  status: 'active' },
    { name: 'Kisan Credit Card',              ministry: 'Ministry of Finance',       budget: 3200000,  used: 2100000, beneficiaries: 74,  status: 'active' },
    { name: 'Drip Irrigation (PMKSY)',        ministry: 'Jal Shakti Ministry',       budget: 880000,   used: 880000,  beneficiaries: 41,  status: 'completed' },
    { name: 'Soil Health Card Scheme',        ministry: 'Ministry of Agriculture',   budget: 450000,   used: 310000,  beneficiaries: 53,  status: 'active' },
    { name: 'e-NAM (Online Agri Market)',     ministry: 'Ministry of Agriculture',   budget: 350000,   used: 170000,  beneficiaries: 38,  status: 'active' },
    { name: 'SMAM (Farm Mechanization)',      ministry: 'Ministry of Agriculture',   budget: 1100000,  used: 440000,  beneficiaries: 22,  status: 'active' },
    { name: 'Rashtriya Krishi Vikas Yojana', ministry: 'Ministry of Agriculture',   budget: 2400000,  used: 1580000, beneficiaries: 91,  status: 'active' },
    { name: 'Paramparagat Krishi Vikas',      ministry: 'Ministry of Agriculture',   budget: 620000,   used: 410000,  beneficiaries: 28,  status: 'active' },
];

const MOCK_ACTIVITY = [
    { actor: 'Admin',      action: 'Approved',   target: 'PM Kisan enrollment — Rekha Ingole, Wani GP',               time: '2 hrs ago',  color: 'green' },
    { actor: 'GP Pingli',  action: 'Filed',      target: 'Complaint: Canal water supply stopped — Ganesh Pawar',       time: '4 hrs ago',  color: 'red'   },
    { actor: 'System',     action: 'Generated',  target: 'Soil PDF report — Manoj Wankhede (Hindi)',                   time: '5 hrs ago',  color: 'blue'  },
    { actor: 'GP Vadgaon', action: 'Forwarded',  target: 'Fertilizer overcharging complaint → Agriculture Officer',    time: '1 day ago',  color: 'purple'},
    { actor: 'Admin',      action: 'Disbursed',  target: 'PM Kisan March installment ₹2000 × 274 farmers via DBT',     time: '1 day ago',  color: 'green' },
    { actor: 'System',     action: 'Alert',      target: 'Low Nitrogen detected — 23 farms in Yavatmal cluster',       time: '2 days ago', color: 'amber' },
    { actor: 'GP Kasbe',   action: 'Enrolled',   target: 'Kiran Chougule in PKVY organic farming cluster',             time: '3 days ago', color: 'teal'  },
    { actor: 'System',     action: 'Closed',     target: 'PMFBY Kharif enrollment. 312 policies issued.',              time: '4 days ago', color: 'slate' },
];

const MOCK_REPORT_LOGS = [
    { farmer: 'Ramchandra Jagtap', lang: 'Marathi', soil: 'Black Cotton', farm: '3.5 Ac', date: 'Mar 22, 2025', gp: 'Pingli' },
    { farmer: 'Ashok Sonawane',    lang: 'English', soil: 'Alluvial',     farm: '4.5 Ac', date: 'Mar 25, 2025', gp: 'Vadgaon' },
    { farmer: 'Manoj Wankhede',    lang: 'Hindi',   soil: 'Black Cotton', farm: '8.0 Ac', date: 'Mar 27, 2025', gp: 'Wani' },
    { farmer: 'Kiran Chougule',    lang: 'Marathi', soil: 'Laterite',     farm: '3.0 Ac', date: 'Mar 29, 2025', gp: 'Kasbe' },
    { farmer: 'Demo Farmer',       lang: 'English', soil: 'Loamy',        farm: '2.0 Ac', date: 'Apr 01, 2025', gp: '—' },
];

// ── Stat Card ─────────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, sub, color }) => (
    <div className={`relative overflow-hidden rounded-2xl p-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition group`}>
        <div className={`absolute top-0 right-0 w-24 h-24 ${color} opacity-10 rounded-full -mr-8 -mt-8 group-hover:scale-125 transition-transform duration-500`} />
        <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center mb-3`}>
            <Icon size={20} className="text-white" />
        </div>
        <div className="text-2xl font-bold text-slate-900 dark:text-white">{value}</div>
        <div className="text-sm font-semibold text-slate-600 dark:text-slate-300 mt-0.5">{label}</div>
        {sub && <div className="text-xs text-slate-400 mt-1">{sub}</div>}
    </div>
);

// ── Budget Progress Bar ────────────────────────────────────────
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
        { id: 'overview',   label: 'Overview',          icon: BarChart2 },
        { id: 'gp',         label: 'Grampanchayat',      icon: Landmark  },
        { id: 'farmers',    label: 'Farmer Requests',    icon: Users     },
        { id: 'schemes',    label: 'Schemes',            icon: IndianRupee },
        { id: 'reports',    label: 'Soil Reports',       icon: Leaf      },
        { id: 'activity',   label: 'Activity Log',       icon: Activity  },
    ];

    const filteredSubs = MOCK_SUBMISSIONS.filter(s => {
        const q = searchQ.toLowerCase();
        const matchQ = !q || s.farmer_name.toLowerCase().includes(q) || s.village.toLowerCase().includes(q) || (s.scheme_name||'').toLowerCase().includes(q);
        const matchS = statusFilter === 'all' || s.status === statusFilter;
        const matchGP = !activeGP || s.gp_name.toLowerCase().includes(MOCK_GPS.find(g=>g.id===activeGP)?.gp_name.split(' ')[0]?.toLowerCase()||'');
        return matchQ && matchS && matchGP;
    });

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
            <GooeyNavbar />

            <div className="pt-20 pb-16 max-w-7xl mx-auto px-4 sm:px-6">

                {/* ── Page Header ─────────────────────────────── */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                    <div>
                        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-1">
                            <Shield size={14} />
                            <span>Annadata Saathi — Official Administration</span>
                        </div>
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                            Admin <span className="text-emerald-600">Control Panel</span>
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Maharashtra Agricultural Platform · Real-time data</p>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl text-sm text-emerald-700 dark:text-emerald-400">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        Live · {new Date().toLocaleDateString('en-IN', { day:'numeric',month:'short',year:'numeric' })}
                    </div>
                </div>

                {/* ── Tab Navigation ──────────────────────────── */}
                <div className="flex gap-1.5 mb-8 overflow-x-auto pb-1 no-scrollbar">
                    {tabs.map(t => {
                        const Icon = t.icon;
                        return (
                            <button
                                key={t.id}
                                onClick={() => setActiveTab(t.id)}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all
                                    ${activeTab === t.id
                                        ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20'
                                        : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:border-emerald-300 hover:text-emerald-600'
                                    }`}
                            >
                                <Icon size={15} />
                                {t.label}
                            </button>
                        );
                    })}
                </div>

                {/* ══════════════════════════════════════════════
                    TAB: OVERVIEW
                ══════════════════════════════════════════════ */}
                {activeTab === 'overview' && (
                    <div className="space-y-8">
                        {/* Stat Cards */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            <StatCard icon={Users}        label="Registered Farmers"     value="1,284"    sub="+38 this month"          color="bg-emerald-500" />
                            <StatCard icon={Landmark}     label="Active GP Portals"       value="5"        sub="4 Maharashtra, 1 pending" color="bg-blue-500"   />
                            <StatCard icon={Star}         label="Scheme Beneficiaries"    value="507"      sub="9 active schemes"         color="bg-violet-500" />
                            <StatCard icon={IndianRupee}  label="Budget Disbursed"        value="₹1.45 Cr" sub="Financial year 2024-25"   color="bg-amber-500"  />
                            <StatCard icon={Leaf}         label="Soil Tests Done"         value="892"      sub="234 PDF reports issued"   color="bg-teal-500"   />
                            <StatCard icon={AlertTriangle}label="Pending Requests"        value="34"       sub="12 urgent, 22 normal"     color="bg-red-500"    />
                            <StatCard icon={FileText}     label="Schemes Active"          value="12"       sub="3 schemes completed"      color="bg-orange-500" />
                            <StatCard icon={TrendingUp}   label="Compliance Rate"         value="94.2%"    sub="Above national avg"       color="bg-indigo-500" />
                        </div>

                        {/* Summary Tables Row */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* GP Summary */}
                            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                                <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                                    <div className="font-bold text-slate-900 dark:text-white">Grampanchayat Status</div>
                                    <button onClick={() => setActiveTab('gp')} className="text-xs text-emerald-600 font-semibold flex items-center gap-1 hover:gap-2 transition-all">
                                        View All <ChevronRight size={13} />
                                    </button>
                                </div>
                                <div className="divide-y divide-slate-50 dark:divide-slate-800">
                                    {MOCK_GPS.map(gp => (
                                        <div key={gp.id} className="px-5 py-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-2 h-2 rounded-full ${gp.is_active ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                                                <div>
                                                    <p className="text-sm font-semibold text-slate-800 dark:text-white">{gp.gp_name}</p>
                                                    <p className="text-xs text-slate-400">{gp.district} · {gp.farmers} farmers</p>
                                                </div>
                                            </div>
                                            {gp.pending > 0 && (
                                                <span className="text-xs font-bold bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 px-2 py-0.5 rounded-full">
                                                    {gp.pending} pending
                                                </span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Recent Activity (mini) */}
                            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                                <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                                    <div className="font-bold text-slate-900 dark:text-white">Recent Activity</div>
                                    <button onClick={() => setActiveTab('activity')} className="text-xs text-emerald-600 font-semibold flex items-center gap-1 hover:gap-2 transition-all">
                                        Full Log <ChevronRight size={13} />
                                    </button>
                                </div>
                                <div className="divide-y divide-slate-50 dark:divide-slate-800">
                                    {MOCK_ACTIVITY.slice(0, 5).map((a, i) => (
                                        <div key={i} className="px-5 py-3 flex items-start gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                                            <div className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 bg-${a.color}-500`} />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs text-slate-700 dark:text-slate-300 leading-tight">
                                                    <span className="font-bold">{a.actor}</span> · {a.action}
                                                </p>
                                                <p className="text-xs text-slate-500 truncate mt-0.5">{a.target}</p>
                                            </div>
                                            <span className="text-[10px] text-slate-400 whitespace-nowrap">{a.time}</span>
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
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                            {MOCK_GPS.map(gp => (
                                <div key={gp.id}
                                    onClick={() => { setActiveGP(gp.id === activeGP ? null : gp.id); setActiveTab('farmers'); }}
                                    className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-5 cursor-pointer hover:border-emerald-300 hover:shadow-md transition group">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${gp.is_active ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-slate-100 dark:bg-slate-800'}`}>
                                            <Home size={22} className={gp.is_active ? 'text-emerald-600' : 'text-slate-400'} />
                                        </div>
                                        <div className="flex flex-col items-end gap-1">
                                            <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${gp.is_active ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-slate-100 text-slate-400'}`}>
                                                {gp.is_active ? '● ACTIVE' : '○ INACTIVE'}
                                            </span>
                                        </div>
                                    </div>

                                    <h3 className="font-bold text-slate-900 dark:text-white text-base leading-tight mb-1">{gp.gp_name}</h3>
                                    <p className="text-xs text-slate-500 mb-3">{gp.taluka} Taluka, {gp.district} District</p>

                                    <div className="grid grid-cols-2 gap-2 mb-4">
                                        <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-2.5">
                                            <p className="text-[10px] text-slate-400 uppercase font-bold">Sarpanch</p>
                                            <p className="text-xs font-semibold text-slate-800 dark:text-white truncate">{gp.sarpanch_name}</p>
                                        </div>
                                        <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-2.5">
                                            <p className="text-[10px] text-slate-400 uppercase font-bold">Contact</p>
                                            <p className="text-xs font-semibold text-slate-800 dark:text-white">{gp.phone}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                                        <div className="flex items-center gap-4 text-xs text-slate-500">
                                            <span className="flex items-center gap-1"><Users size={11} /> {gp.farmers} farmers</span>
                                            {gp.pending > 0 && (
                                                <span className="flex items-center gap-1 text-red-500 font-bold"><Clock size={11} /> {gp.pending} pending</span>
                                            )}
                                        </div>
                                        <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1 group-hover:gap-2 transition-all">
                                            View <ChevronRight size={12} />
                                        </span>
                                    </div>
                                </div>
                            ))}

                            {/* Add GP Card */}
                            <div className="rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 p-5 flex flex-col items-center justify-center min-h-[200px] text-slate-400 hover:border-emerald-400 hover:text-emerald-500 transition cursor-pointer">
                                <Building2 size={28} className="mb-2" />
                                <p className="text-sm font-semibold">Onboard New GP</p>
                                <p className="text-xs mt-1 text-center">Add a Grampanchayat to the portal</p>
                            </div>
                        </div>

                        {/* Scheme overview per GP */}
                        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">
                                <h2 className="font-bold text-slate-900 dark:text-white">Scheme Budget Utilization Across GPs</h2>
                                <p className="text-xs text-slate-400 mt-0.5">Live data from Supabase · Financial Year 2024-25</p>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-slate-50 dark:bg-slate-800/50 text-xs font-bold text-slate-500 uppercase tracking-wide">
                                            <th className="px-6 py-3 text-left">Scheme</th>
                                            <th className="px-4 py-3 text-left">Ministry</th>
                                            <th className="px-4 py-3 text-center">Beneficiaries</th>
                                            <th className="px-4 py-3 text-left w-48">Budget Usage</th>
                                            <th className="px-4 py-3 text-center">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                                        {MOCK_SCHEMES.map((s, i) => (
                                            <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition">
                                                <td className="px-6 py-3.5 font-semibold text-slate-800 dark:text-white">{s.name}</td>
                                                <td className="px-4 py-3.5 text-xs text-slate-500">{s.ministry}</td>
                                                <td className="px-4 py-3.5 text-center font-bold text-slate-700 dark:text-slate-300">{s.beneficiaries}</td>
                                                <td className="px-4 py-3.5 w-48"><BudgetBar used={s.used} total={s.budget} /></td>
                                                <td className="px-4 py-3.5 text-center">
                                                    <Badge label={s.status} style={STATUS_STYLES[s.status] || ''} />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* ══════════════════════════════════════════════
                    TAB: FARMER REQUESTS
                ══════════════════════════════════════════════ */}
                {activeTab === 'farmers' && (
                    <div className="space-y-5">
                        {/* Filters */}
                        <div className="flex flex-wrap gap-3 items-center">
                            <div className="relative flex-1 min-w-[200px]">
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    value={searchQ}
                                    onChange={e => setSearchQ(e.target.value)}
                                    placeholder="Search farmer, village, scheme..."
                                    className="w-full pl-8 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-400"
                                />
                            </div>
                            <select
                                value={statusFilter}
                                onChange={e => setStatusFilter(e.target.value)}
                                className="px-3 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 focus:outline-none focus:border-emerald-400"
                            >
                                <option value="all">All Status</option>
                                <option value="pending">Pending</option>
                                <option value="under_review">Under Review</option>
                                <option value="approved">Approved</option>
                                <option value="forwarded">Forwarded</option>
                                <option value="rejected">Rejected</option>
                            </select>
                            {activeGP && (
                                <button onClick={() => setActiveGP(null)} className="px-3 py-2.5 text-xs rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold hover:bg-emerald-100 transition">
                                    × Clear GP Filter
                                </button>
                            )}
                            <div className="text-xs text-slate-400 ml-auto">{filteredSubs.length} results</div>
                        </div>

                        {/* Submissions Cards */}
                        <div className="space-y-3">
                            {filteredSubs.map(s => (
                                <div key={s.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-5 hover:shadow-md transition">
                                    <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                                        <div>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h3 className="font-bold text-slate-900 dark:text-white">{s.farmer_name}</h3>
                                                <Badge label={s.priority} style={PRIORITY_STYLES[s.priority]||''} />
                                                <Badge label={s.status.replace('_',' ')} style={STATUS_STYLES[s.status]||''} />
                                            </div>
                                            <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                                                <span className="flex items-center gap-1"><MapPin size={10}/> {s.village}</span>
                                                <span className="flex items-center gap-1"><Phone size={10}/> {s.mobile}</span>
                                                <span className="flex items-center gap-1"><Building2 size={10}/> {s.gp_name}</span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-xs font-bold text-slate-500 uppercase">{s.request_type.replace('_',' ')}</div>
                                            <div className="text-xs text-slate-400 mt-0.5">{s.submitted_at}</div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
                                        {[
                                            ['Land', s.land_size],
                                            ['Soil', s.soil_type],
                                            ['Crop', s.crop_type],
                                            ['Scheme', s.scheme_name || 'N/A'],
                                        ].map(([k, v]) => (
                                            <div key={k} className="bg-slate-50 dark:bg-slate-800 rounded-lg px-3 py-2">
                                                <div className="text-[10px] text-slate-400 font-bold uppercase">{k}</div>
                                                <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate">{v}</div>
                                            </div>
                                        ))}
                                    </div>

                                    {s.reviewer_note && (
                                        <div className="flex items-start gap-2 p-2.5 rounded-lg bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-800">
                                            <CheckCircle size={13} className="text-green-500 mt-0.5 flex-shrink-0" />
                                            <p className="text-xs text-green-700 dark:text-green-400">{s.reviewer_note}</p>
                                        </div>
                                    )}

                                    {s.status === 'pending' && (
                                        <div className="flex gap-2 mt-3">
                                            <button className="flex-1 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition">Approve</button>
                                            <button className="flex-1 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition">Forward</button>
                                            <button className="flex-1 py-2 text-xs font-bold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg transition">Reject</button>
                                        </div>
                                    )}
                                </div>
                            ))}

                            {filteredSubs.length === 0 && (
                                <div className="text-center py-16 text-slate-400">
                                    <Search size={36} className="mx-auto mb-3 opacity-30" />
                                    <p className="font-semibold">No submissions match your filter</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ══════════════════════════════════════════════
                    TAB: SCHEMES
                ══════════════════════════════════════════════ */}
                {activeTab === 'schemes' && (
                    <div className="space-y-4">
                        {MOCK_SCHEMES.map((s, i) => (
                            <div key={i} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-5 hover:shadow-md transition">
                                <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                                    <div>
                                        <h3 className="font-bold text-slate-900 dark:text-white text-base">{s.name}</h3>
                                        <p className="text-xs text-slate-400 mt-0.5">{s.ministry}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="text-right">
                                            <div className="text-xl font-bold text-slate-900 dark:text-white">{s.beneficiaries}</div>
                                            <div className="text-xs text-slate-400">beneficiaries</div>
                                        </div>
                                        <Badge label={s.status} style={STATUS_STYLES[s.status]||''} />
                                    </div>
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
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                            <div>
                                <h2 className="font-bold text-slate-900 dark:text-white">Soil Health Report History</h2>
                                <p className="text-xs text-slate-400 mt-0.5">All PDF reports generated via Annadata Saathi</p>
                            </div>
                            <span className="text-xs font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 px-3 py-1 rounded-full">
                                {MOCK_REPORT_LOGS.length} reports
                            </span>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-slate-50 dark:bg-slate-800/50 text-xs font-bold text-slate-500 uppercase">
                                        <th className="px-6 py-3 text-left">Farmer</th>
                                        <th className="px-4 py-3 text-left">GP</th>
                                        <th className="px-4 py-3 text-left">Soil Type</th>
                                        <th className="px-4 py-3 text-left">Farm Size</th>
                                        <th className="px-4 py-3 text-center">Language</th>
                                        <th className="px-4 py-3 text-left">Date</th>
                                        <th className="px-4 py-3 text-center">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                                    {MOCK_REPORT_LOGS.map((r, i) => (
                                        <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition">
                                            <td className="px-6 py-3.5 font-semibold text-slate-800 dark:text-white">{r.farmer}</td>
                                            <td className="px-4 py-3.5 text-xs text-slate-500">{r.gp}</td>
                                            <td className="px-4 py-3.5">
                                                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">{r.soil}</span>
                                            </td>
                                            <td className="px-4 py-3.5 text-xs text-slate-600 dark:text-slate-400">{r.farm}</td>
                                            <td className="px-4 py-3.5 text-center">
                                                <span className="text-xs font-bold uppercase text-slate-500">{r.lang}</span>
                                            </td>
                                            <td className="px-4 py-3.5 text-xs text-slate-500">{r.date}</td>
                                            <td className="px-4 py-3.5 text-center">
                                                <button className="flex items-center gap-1 mx-auto text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition">
                                                    <Download size={12} /> PDF
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* ══════════════════════════════════════════════
                    TAB: ACTIVITY LOG
                ══════════════════════════════════════════════ */}
                {activeTab === 'activity' && (
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                            <div>
                                <h2 className="font-bold text-slate-900 dark:text-white">System Activity Log</h2>
                                <p className="text-xs text-slate-400 mt-0.5">All admin and GP actions recorded</p>
                            </div>
                            <button className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-emerald-600 transition font-semibold">
                                <RefreshCw size={12} /> Refresh
                            </button>
                        </div>
                        <div className="divide-y divide-slate-50 dark:divide-slate-800">
                            {MOCK_ACTIVITY.map((a, i) => (
                                <div key={i} className="flex items-start gap-4 px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition">
                                    <div className={`mt-1 w-2.5 h-2.5 rounded-full flex-shrink-0 bg-${a.color}-500 ring-4 ring-${a.color}-100 dark:ring-${a.color}-900/30`} />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="text-sm font-bold text-slate-800 dark:text-white">{a.actor}</span>
                                            <span className="text-xs font-semibold text-slate-500">{a.action}</span>
                                        </div>
                                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5 leading-snug">{a.target}</p>
                                    </div>
                                    <span className="text-xs text-slate-400 whitespace-nowrap mt-0.5">{a.time}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};

export default AdminDashboard;
