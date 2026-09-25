import React, { useState, useEffect } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import {
    TrendingUp, Users, FileText, AlertTriangle, Download, Calendar,
    ChevronDown, MapPin, Activity, DollarSign
} from 'lucide-react';
import { useThemeStore } from '../../store/themeStore';

const AdminReports = () => {
    const { theme } = useThemeStore();
    const isDark = theme === 'dark';

    const [stats, setStats] = useState(null);
    const [monthlyClaimsData, setMonthlyClaimsData] = useState([]);
    const [cropDistributionData, setCropDistributionData] = useState([]);
    const [regionImpactData, setRegionImpactData] = useState([]);
    const [landStatusData, setLandStatusData] = useState([]);
    const [recentActivity, setRecentActivity] = useState([]);
    const [loading, setLoading] = useState(true);

    const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

    useEffect(() => {
        fetchReportsData();
    }, []);

    const fetchReportsData = async () => {
        try {
            const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

            // Parallel Fetch
            const [statsRes, monthlyRes, cropRes, regionRes, landRes, activityRes] = await Promise.all([
                fetch(`${apiBase}/api/admin/dashboard-stats`),
                fetch(`${apiBase}/api/admin/reports/monthly-claims`),
                fetch(`${apiBase}/api/admin/reports/crop-distribution`),
                fetch(`${apiBase}/api/admin/reports/regional-impact`),
                fetch(`${apiBase}/api/admin/reports/land-registrations`),
                fetch(`${apiBase}/api/admin/recent-claims`)
            ]);

            if (statsRes.ok) setStats(await statsRes.json());
            if (monthlyRes.ok) setMonthlyClaimsData(await monthlyRes.json());
            if (cropRes.ok) setCropDistributionData(await cropRes.json());
            if (regionRes.ok) setRegionImpactData(await regionRes.json());
            if (landRes.ok) setLandStatusData(await landRes.json());
            if (activityRes.ok) setRecentActivity((await activityRes.json()).slice(0, 5)); // Top 5

        } catch (error) {
            console.error("Error fetching reports:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className={`p-6 min-h-screen flex items-center justify-center ${isDark ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'}`}>
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
            </div>
        );
    }

    return (
        <div className={`p-6 min-h-screen ${isDark ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'}`}>
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-black uppercase tracking-tight mb-2">Analytics & <span className="text-emerald-500">Reports</span></h1>
                    <p className={`text-sm font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        Comprehensive insights into platform performance and agriculture trends.
                    </p>
                </div>
                <div className="flex gap-4">
                    <button className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border transition-all
                        ${isDark ? 'bg-slate-900 border-slate-700 hover:bg-slate-800' : 'bg-white border-slate-200 hover:bg-slate-50'}`}>
                        <Calendar size={16} />
                        Last 30 Days
                        <ChevronDown size={16} />
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-slate-900 dark:text-white rounded-xl text-sm font-bold hover:bg-emerald-500 transition-all shadow-lg active:scale-95">
                        <Download size={16} />
                        Export Report
                    </button>
                </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <MetricCard
                    title="Total Farmers"
                    value={stats?.total_farmers || 0}
                    trend="+12%" // Mock trend for now
                    icon={Users}
                    color="blue"
                    isDark={isDark}
                />
                <MetricCard
                    title="Total Claims"
                    value={stats?.total_claims || 0}
                    trend={stats?.pending_approvals ? `${stats.pending_approvals} Pending` : "Stable"}
                    icon={FileText}
                    color="emerald"
                    isDark={isDark}
                />
                <MetricCard
                    title="Disbursed"
                    value={stats?.disbursed_amount || "₹0"}
                    trend="+8%"
                    icon={DollarSign}
                    color="purple"
                    isDark={isDark}
                />
                <MetricCard
                    title="Risk Alerts"
                    value={stats?.active_alerts || 0}
                    trend="-2%"
                    icon={AlertTriangle}
                    color="red"
                    isDark={isDark}
                />
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                {/* Claims Overview */}
                <ChartCard title="Claims Overview" isDark={isDark} className="lg:col-span-1">
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={monthlyClaimsData}>
                            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#334155" : "#e2e8f0"} vertical={false} />
                            <XAxis dataKey="name" stroke={isDark ? "#94a3b8" : "#64748b"} axisLine={false} tickLine={false} />
                            <YAxis stroke={isDark ? "#94a3b8" : "#64748b"} axisLine={false} tickLine={false} />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: isDark ? '#1e293b' : '#fff',
                                    borderColor: isDark ? '#334155' : '#e2e8f0',
                                    color: isDark ? '#fff' : '#0f172a'
                                }}
                            />
                            <Legend />
                            <Bar dataKey="approved" fill="#10b981" radius={[4, 4, 0, 0]} name="Approved" />
                            <Bar dataKey="pending" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Pending" />
                            <Bar dataKey="rejected" fill="#ef4444" radius={[4, 4, 0, 0]} name="Rejected" />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>

                {/* Land Registrations Breakdown */}
                <ChartCard title="Property Registrations" isDark={isDark} className="lg:col-span-1">
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={landStatusData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                fill="#8884d8"
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {landStatusData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.name === 'VERIFIED' ? '#10b981' : entry.name === 'REJECTED' ? '#ef4444' : '#f59e0b'} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: isDark ? '#1e293b' : '#fff',
                                    borderColor: isDark ? '#334155' : '#e2e8f0',
                                    color: isDark ? '#fff' : '#0f172a'
                                }}
                            />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </ChartCard>

                {/* Crop Distribution */}
                <ChartCard title="Crop Distribution" isDark={isDark} className="lg:col-span-1">
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            {/* Same as before but consistent styling */}
                            <Pie
                                data={cropDistributionData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                fill="#8884d8"
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {cropDistributionData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: isDark ? '#1e293b' : '#fff',
                                    borderColor: isDark ? '#334155' : '#e2e8f0',
                                    color: isDark ? '#fff' : '#0f172a'
                                }}
                            />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </ChartCard>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Regional Impact */}
                <ChartCard title="Regional Impact" isDark={isDark} className="lg:col-span-2">
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={regionImpactData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={isDark ? "#334155" : "#e2e8f0"} />
                            <XAxis type="number" stroke={isDark ? "#94a3b8" : "#64748b"} axisLine={false} tickLine={false} />
                            <YAxis dataKey="name" type="category" stroke={isDark ? "#94a3b8" : "#64748b"} axisLine={false} tickLine={false} width={80} />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: isDark ? '#1e293b' : '#fff',
                                    borderColor: isDark ? '#334155' : '#e2e8f0',
                                    color: isDark ? '#fff' : '#0f172a'
                                }}
                            />
                            <Bar dataKey="claims" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>

                {/* Recent Activity */}
                <div className={`rounded-2xl p-6 shadow-xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                    <h3 className={`text-lg font-bold mb-6 ${isDark ? 'text-white' : 'text-slate-900'}`}>Recent Activity</h3>
                    <div className="space-y-6">
                        {recentActivity.length > 0 ? (
                            recentActivity.map((item, idx) => (
                                <div key={idx} className="flex gap-4">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0
                                        ${isDark ? 'bg-slate-800 text-emerald-400' : 'bg-slate-100 text-emerald-600'}`}>
                                        <Activity size={18} />
                                    </div>
                                    <div>
                                        <p className={`text-sm font-bold ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>
                                            New Claim: {item.type}
                                        </p>
                                        <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                                            {item.farmer} • {item.amount} • {item.date}
                                        </p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-sm text-slate-500 italic">No recent activity.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const MetricCard = ({ title, value, trend, icon: Icon, color, isDark }) => {
    const colorClasses = {
        emerald: isDark ? 'text-emerald-400 bg-emerald-500/10' : 'text-emerald-600 bg-emerald-50',
        blue: isDark ? 'text-blue-400 bg-blue-500/10' : 'text-blue-600 bg-blue-50',
        purple: isDark ? 'text-purple-400 bg-purple-500/10' : 'text-purple-600 bg-purple-50',
        red: isDark ? 'text-red-400 bg-red-500/10' : 'text-red-600 bg-red-50',
    };

    return (
        <div className={`p-6 rounded-2xl shadow-xl border transition-all hover:-translate-y-1
            ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
            <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-xl ${colorClasses[color]}`}>
                    <Icon size={24} />
                </div>
                <div className={`px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1
                    ${trend.startsWith('+')
                        ? (isDark ? 'text-emerald-400 bg-emerald-500/10' : 'text-emerald-700 bg-emerald-50')
                        : (isDark ? 'text-red-400 bg-red-500/10' : 'text-red-700 bg-red-50')}`}>
                    <TrendingUp size={12} className={trend.startsWith('-') ? 'rotate-180' : ''} />
                    {trend}
                </div>
            </div>
            <h3 className={`text-3xl font-black mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>{value}</h3>
            <p className={`text-sm font-medium ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>{title}</p>
        </div>
    );
};

const ChartCard = ({ title, children, isDark, className = '' }) => (
    <div className={`p-6 rounded-2xl shadow-xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} ${className}`}>
        <h3 className={`text-lg font-bold mb-6 ${isDark ? 'text-white' : 'text-slate-900'}`}>{title}</h3>
        {children}
    </div>
);

export default AdminReports;
