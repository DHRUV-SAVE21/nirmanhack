import React, { useState, useEffect, useRef } from "react";
import ZoneAnalysisPanel from "./ZoneAnalysis";
import NDVITimeSeriesPanel from "./NDVITimeSeries";
import PredictiveAlertsPanel from "./PredictiveAlerts";

// ============================================
// SUB-COMPONENTS
// ============================================

const AnimatedNumber = ({ value, decimals = 1, duration = 1200 }) => {
    const [display, setDisplay] = useState(0);
    useEffect(() => {
        let start = 0;
        const end = parseFloat(value) || 0;
        const step = (end - start) / (duration / 16);
        let current = start;
        const timer = setInterval(() => {
            current += step;
            if ((step > 0 && current >= end) || (step < 0 && current <= end)) {
                current = end;
                clearInterval(timer);
            }
            setDisplay(current);
        }, 16);
        return () => clearInterval(timer);
    }, [value, duration]);
    return <span>{display.toFixed(decimals)}</span>;
};

const PulseRing = ({ color, size = 48, active = true }) => (
    <div className="relative" style={{ width: size, height: size }}>
        {active && (
            <>
                <div className="absolute inset-0 rounded-full animate-ping opacity-20" style={{ backgroundColor: color }} />
                <div className="absolute inset-1 rounded-full animate-ping opacity-10 animation-delay-200" style={{ backgroundColor: color }} />
            </>
        )}
        <div className="absolute inset-0 rounded-full opacity-30" style={{ backgroundColor: color }} />
        <div className="absolute inset-1.5 rounded-full" style={{ backgroundColor: color }} />
    </div>
);

// ============================================
// NDVI GAUGE (Animated Radial)
// ============================================
const NDVIGauge = ({ value, health }) => {
    const radius = 70;
    const circumference = 2 * Math.PI * radius;
    const normalizedValue = Math.max(0, Math.min(1, value));
    const strokeDashoffset = circumference - (normalizedValue * circumference * 0.75);

    const getColor = (v) => {
        if (v < 0.25) return "#ef4444";
        if (v < 0.45) return "#f59e0b";
        if (v < 0.60) return "#84cc16";
        return "#22c55e";
    };

    const color = getColor(value);

    return (
        <div className="relative flex flex-col items-center">
            <svg width="180" height="150" viewBox="0 0 180 160" className="drop-shadow-lg">
                <defs>
                    <linearGradient id="ndviGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor={color} stopOpacity="0.3" />
                        <stop offset="100%" stopColor={color} />
                    </linearGradient>
                    <filter id="glow">
                        <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                        <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>
                {/* Background arc */}
                <circle cx="90" cy="90" r={radius} fill="none" stroke="rgba(255,255,255,0.05)"
                    strokeWidth="12" strokeLinecap="round"
                    strokeDasharray={circumference} strokeDashoffset={circumference * 0.25}
                    transform="rotate(135, 90, 90)" />
                {/* Value arc */}
                <circle cx="90" cy="90" r={radius} fill="none" stroke="url(#ndviGrad)"
                    strokeWidth="12" strokeLinecap="round" filter="url(#glow)"
                    strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
                    transform="rotate(135, 90, 90)"
                    style={{ transition: "stroke-dashoffset 1.5s cubic-bezier(0.4, 0, 0.2, 1)" }} />
                {/* Center value */}
                <text x="90" y="80" textAnchor="middle" className="fill-white text-3xl font-black" style={{ fontSize: '32px', fontWeight: 900 }}>
                    {value.toFixed(2)}
                </text>
                <text x="90" y="100" textAnchor="middle" className="fill-slate-400 text-xs" style={{ fontSize: '11px' }}>
                    NDVI INDEX
                </text>
            </svg>
            <div className="flex items-center gap-2 -mt-2">
                <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: color }} />
                <span className="text-xs font-bold uppercase tracking-widest" style={{ color }}>{health || "Scanning..."}</span>
            </div>
        </div>
    );
};

// ============================================
// SIGNAL CARD (Individual sensor reading)
// ============================================
const SignalCard = ({ label, value, unit, icon, status, color, severity }) => {
    const barWidth = Math.min(100, severity * 100);
    return (
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-3 hover:bg-white/[0.06] transition-all group">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <span className="text-lg">{icon}</span>
                    <span className="text-[10px] text-slate-600 dark:text-slate-400 uppercase tracking-wider font-bold">{label}</span>
                </div>
                <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border"
                    style={{ color, borderColor: color + '40', backgroundColor: color + '15' }}>
                    {status}
                </span>
            </div>
            <div className="flex items-baseline gap-1 mb-2">
                <span className="text-xl font-black text-slate-900 dark:text-white">
                    {value !== null && value !== undefined ? <AnimatedNumber value={value} decimals={value % 1 === 0 ? 0 : 1} /> : "—"}
                </span>
                <span className="text-xs text-slate-500">{unit}</span>
            </div>
            <div className="h-1.5 bg-white dark:bg-white/5 shadow-sm dark:shadow-none rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${barWidth}%`, backgroundColor: color }} />
            </div>
        </div>
    );
};

// ============================================
// HYPOTHESIS CARD (Causal reasoning result)
// ============================================
const HypothesisCard = ({ hypothesis, rank, isExpanded, onToggle }) => {
    const confidencePercent = Math.round(hypothesis.confidence * 100);

    return (
        <div
            className={`relative overflow-hidden rounded-2xl border transition-all duration-500 cursor-pointer group
                ${isExpanded
                    ? 'bg-white/[0.06] border-white/20 shadow-xl'
                    : 'bg-white/[0.02] border-white/[0.06] hover:border-white/15 hover:bg-white/[0.04]'}`}
            onClick={onToggle}
        >
            {/* Gradient accent line */}
            <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${hypothesis.gradient}`} />

            {/* Header */}
            <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-lg"
                            style={{ backgroundColor: hypothesis.color + '20', boxShadow: `0 4px 15px ${hypothesis.color}30` }}>
                            {hypothesis.icon}
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">{hypothesis.cause}</h4>
                            <div className="flex items-center gap-2 mt-1">
                                {hypothesis.signals_used?.map((s, i) => (
                                    <span key={i} className="text-[8px] font-mono bg-white dark:bg-white/5 shadow-sm dark:shadow-none px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-400">{s}</span>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                        <div className="text-lg font-black" style={{ color: hypothesis.color }}>
                            {confidencePercent}%
                        </div>
                        <div className="text-[8px] text-slate-500 uppercase tracking-wider">confidence</div>
                    </div>
                </div>

                {/* Confidence bar */}
                <div className="mt-3 h-1 bg-white dark:bg-white/5 shadow-sm dark:shadow-none rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-1500 ease-out"
                        style={{ width: `${confidencePercent}%`, backgroundColor: hypothesis.color }} />
                </div>
            </div>

            {/* Expanded Content */}
            {isExpanded && (
                <div className="px-4 pb-4 space-y-3 animate-in slide-in-from-top-2 duration-300">
                    <div className="bg-black/20 rounded-xl p-3 border border-slate-200 dark:border-white/5">
                        <h5 className="text-[9px] uppercase tracking-widest text-slate-500 font-bold mb-1">🧠 Reasoning</h5>
                        <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">{hypothesis.reasoning}</p>
                    </div>

                    <div className="bg-black/20 rounded-xl p-3 border border-slate-200 dark:border-white/5">
                        <h5 className="text-[9px] uppercase tracking-widest font-bold mb-2" style={{ color: hypothesis.color }}>
                            ⚡ Immediate Action
                        </h5>
                        <p className="text-xs text-slate-900 dark:text-white font-semibold">{hypothesis.immediate_action}</p>
                    </div>

                    {hypothesis.detailed_steps && (
                        <div className="space-y-1.5 pl-2 border-l-2" style={{ borderColor: hypothesis.color + '40' }}>
                            {hypothesis.detailed_steps.map((step, i) => (
                                <div key={i} className="flex items-start gap-2 group/step">
                                    <div className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold flex-shrink-0 mt-0.5"
                                        style={{ backgroundColor: hypothesis.color + '20', color: hypothesis.color }}>
                                        {i + 1}
                                    </div>
                                    <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">{step}</p>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Trust Layer */}
                    <div className="mt-4 pt-4 border-t border-slate-200 dark:border-white/5 space-y-3">
                        <div className="flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
                            <h5 className="text-[8px] font-black text-cyan-400 uppercase tracking-widest">Trust & Explainability Layer</h5>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-black/40 rounded-xl p-2.5 border border-slate-200 dark:border-white/5">
                                <div className="text-[7px] text-slate-500 font-bold uppercase mb-0.5">Primary Reason</div>
                                <div className="text-[10px] text-slate-100 font-medium leading-tight">
                                    {hypothesis.reason || hypothesis.cause}
                                </div>
                            </div>
                            <div className="bg-black/40 rounded-xl p-2.5 border border-slate-200 dark:border-white/5">
                                <div className="text-[7px] text-slate-500 font-bold uppercase mb-0.5">Data Source</div>
                                <div className="text-[10px] text-cyan-400 font-black">
                                    {hypothesis.data_source || "Multi-Signal IoT Core"}
                                </div>
                                <div className="text-[7px] text-slate-600 mt-0.5 uppercase">
                                    {hypothesis.last_updated ? new Date(hypothesis.last_updated).toLocaleTimeString() : 'Real-time Signal'}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};


// ============================================
// RISK SCORE DISPLAY
// ============================================
const RiskScoreWidget = ({ riskScore }) => {
    if (!riskScore) return null;
    const { score, level, color, breakdown } = riskScore;

    return (
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
                <h4 className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Crop Risk Score</h4>
                <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full"
                    style={{ color, backgroundColor: color + '20', border: `1px solid ${color}40` }}>
                    {level}
                </span>
            </div>
            <div className="flex items-center gap-4 mb-3">
                <div className="text-4xl font-black" style={{ color }}>
                    <AnimatedNumber value={score} decimals={0} />
                </div>
                <div className="flex-1">
                    <div className="h-3 bg-white dark:bg-white/5 shadow-sm dark:shadow-none rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-2000 ease-out relative"
                            style={{ width: `${Math.min(100, score)}%`, backgroundColor: color }}>
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/20 rounded-full" />
                        </div>
                    </div>
                    <div className="flex justify-between text-[8px] text-slate-600 mt-1">
                        <span>LOW</span><span>MOD</span><span>HIGH</span><span>CRIT</span>
                    </div>
                </div>
            </div>
            {/* Breakdown mini-bars */}
            <div className="space-y-1.5">
                {breakdown?.slice(0, 4).map((item, i) => (
                    <div key={i} className="flex items-center gap-2">
                        <span className="text-[9px] text-slate-500 w-16 truncate capitalize">{item.signal.replace('_', ' ')}</span>
                        <div className="flex-1 h-1 bg-white dark:bg-white/5 shadow-sm dark:shadow-none rounded-full overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${item.contribution * 3}%`, backgroundColor: item.color }} />
                        </div>
                        <span className="text-[9px] font-mono text-slate-600 dark:text-slate-400 w-8 text-right">{item.contribution}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

// ============================================
// MAIN COMPONENT: DecisionIntelligencePanel
// ============================================
const DecisionIntelligencePanel = ({ ndviValue, health, heatmapData, apiUrl, onZoneHover, center }) => {
    const [intelligence, setIntelligence] = useState(null);
    const [loading, setLoading] = useState(false);
    const [expandedHypothesis, setExpandedHypothesis] = useState(0);
    const [showPanel, setShowPanel] = useState(false);
    const [activeTab, setActiveTab] = useState('intelligence'); // 'intelligence' | 'zones'

    // Fetch intelligence when NDVI data is available
    const fetchIntelligence = async () => {
        if (ndviValue === null || ndviValue === undefined) return;
        setLoading(true);
        try {
            const response = await fetch(`${apiUrl}/api/feature2/intelligence`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ndvi_value: ndviValue,
                    lat: center?.lat || heatmapData?.center?.lat,
                    lng: center?.lng || heatmapData?.center?.lng,
                })
            });
            const data = await response.json();
            setIntelligence(data);
            setShowPanel(true);
        } catch (e) {
            console.error("Intelligence fetch failed:", e);
            // Generate client-side fallback
            setIntelligence(generateClientSideFallback(ndviValue));
            setShowPanel(true);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (ndviValue !== null && ndviValue !== undefined) {
            fetchIntelligence();
        }
    }, [ndviValue]);

    // Signal icons map
    const signalIcons = {
        ndvi: "🛰️", soil_moisture: "💧", nitrogen: "🧪",
        phosphorus: "⚗️", potassium: "🧂", ph: "📊", temperature: "🌡️"
    };
    const signalUnits = {
        ndvi: "index", soil_moisture: "%", nitrogen: "mg/kg",
        phosphorus: "mg/kg", potassium: "mg/kg", ph: "pH", temperature: "°C"
    };

    if (!heatmapData) return null;

    return (
        <div className="space-y-4">
            {/* NDVI Gauge */}
            <div className="bg-gradient-to-br from-slate-900/80 to-slate-950/80 rounded-3xl p-5 border border-white/[0.06] shadow-2xl backdrop-blur-sm">
                <NDVIGauge value={ndviValue} health={health} />

                {/* Quick Stats Row */}
                <div className="grid grid-cols-3 gap-2 mt-4">
                    <div className="bg-white/[0.03] rounded-xl p-2 text-center">
                        <div className="text-[9px] text-slate-500 uppercase tracking-wider">Max</div>
                        <div className="text-sm font-bold text-slate-900 dark:text-white">{heatmapData?.max_ndvi || "—"}</div>
                    </div>
                    <div className="bg-white/[0.03] rounded-xl p-2 text-center">
                        <div className="text-[9px] text-slate-500 uppercase tracking-wider">Points</div>
                        <div className="text-sm font-bold text-slate-900 dark:text-white">{heatmapData?.heatmap_points?.length || 0}</div>
                    </div>
                    <div className="bg-white/[0.03] rounded-xl p-2 text-center">
                        <div className="text-[9px] text-slate-500 uppercase tracking-wider">Source</div>
                        <div className="text-[9px] font-bold text-cyan-400">Sentinel-2</div>
                    </div>
                </div>
            </div>

            {/* Tab Switcher */}
            <div className="flex items-center gap-1 bg-white/[0.03] rounded-xl p-1">
                {[
                    { id: 'intelligence', label: '🧠 Intelligence', color: 'cyan' },
                    { id: 'predictions', label: '🔮 Predict', color: 'amber' },
                    { id: 'timeseries', label: '📈 Trends', color: 'violet' },
                    { id: 'zones', label: '🗺️ Zones', color: 'emerald', badge: heatmapData?.zone_summary?.critical_count },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex-1 text-[9px] font-bold uppercase tracking-wider py-2 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5
                            ${activeTab === tab.id
                                ? `bg-${tab.color}-500/20 text-${tab.color}-400 shadow-sm`
                                : 'text-slate-500 hover:text-slate-300'}`}
                        style={activeTab === tab.id ? {
                            backgroundColor: tab.color === 'cyan' ? 'rgba(6,182,212,0.15)' : tab.color === 'violet' ? 'rgba(139,92,246,0.15)' : tab.color === 'amber' ? 'rgba(245,158,11,0.15)' : 'rgba(16,185,129,0.15)',
                            color: tab.color === 'cyan' ? '#22d3ee' : tab.color === 'violet' ? '#a78bfa' : tab.color === 'amber' ? '#f59e0b' : '#34d399'
                        } : {}}
                    >
                        {tab.label}
                        {tab.badge > 0 && (
                            <span className="w-4 h-4 rounded-full bg-red-500 text-white text-[8px] flex items-center justify-center font-black animate-pulse">
                                {tab.badge}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Predictive Alerts Tab */}
            {activeTab === 'predictions' && (
                <PredictiveAlertsPanel
                    apiUrl={apiUrl}
                    center={center || { lat: heatmapData?.center?.lat, lng: heatmapData?.center?.lng }}
                    bbox={heatmapData?.bbox || null}
                    ndviSeries={ndviValue ? [ndviValue] : null}
                />
            )}

            {/* Time-Series Intelligence Tab */}
            {activeTab === 'timeseries' && (
                <NDVITimeSeriesPanel
                    apiUrl={apiUrl}
                    center={center || { lat: heatmapData?.center?.lat, lng: heatmapData?.center?.lng }}
                    bbox={heatmapData?.bbox || null}
                />
            )}

            {/* Zone Precision Tab */}
            {activeTab === 'zones' && heatmapData?.zones && (
                <ZoneAnalysisPanel
                    zones={heatmapData.zones}
                    zoneSummary={heatmapData.zone_summary}
                    onZoneHover={onZoneHover}
                />
            )}

            {/* Intelligence Tab Content */}
            {activeTab === 'intelligence' && loading && (
                <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-8 flex flex-col items-center gap-3">
                    <div className="relative w-12 h-12">
                        <div className="absolute inset-0 border-2 border-cyan-500/20 rounded-full" />
                        <div className="absolute inset-0 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
                        <div className="absolute inset-2 border-2 border-purple-500 border-b-transparent rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '0.8s' }} />
                    </div>
                    <div className="text-center">
                        <p className="text-xs text-cyan-400 font-mono animate-pulse">ANALYZING MULTI-SIGNAL DATA...</p>
                        <p className="text-[9px] text-slate-600 mt-1">Cross-referencing NDVI × Soil × NPK × Weather</p>
                    </div>
                </div>
            )}

            {/* Intelligence Results */}
            {activeTab === 'intelligence' && intelligence && showPanel && !loading && (
                <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {/* Sensor Signals Grid */}
                    {intelligence.signals && Object.keys(intelligence.signals).length > 1 && (
                        <div>
                            <h4 className="text-[9px] uppercase tracking-widest text-slate-500 font-bold mb-2 px-1">Live Sensor Signals</h4>
                            <div className="grid grid-cols-2 gap-2">
                                {Object.entries(intelligence.signals).map(([key, signal]) => (
                                    <SignalCard
                                        key={key}
                                        label={key.replace('_', ' ')}
                                        value={signal.raw_value}
                                        unit={signalUnits[key] || ""}
                                        icon={signalIcons[key] || "📡"}
                                        status={signal.label}
                                        color={signal.color}
                                        severity={signal.severity}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* AI Summary */}
                    {intelligence.ai_summary && (
                        <div className="bg-gradient-to-br from-cyan-950/30 to-purple-950/30 border border-cyan-500/20 rounded-2xl p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-sm">🧠</span>
                                <span className="text-[9px] uppercase tracking-widest text-cyan-400 font-bold">AI Briefing</span>
                            </div>
                            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">{intelligence.ai_summary}</p>
                        </div>
                    )}

                    {/* Risk Score */}
                    {intelligence.risk_score && (
                        <RiskScoreWidget riskScore={intelligence.risk_score} />
                    )}

                    {/* Causal Hypotheses */}
                    {intelligence.hypotheses?.length > 0 && (
                        <div>
                            <h4 className="text-[9px] uppercase tracking-widest text-slate-500 font-bold mb-2 px-1 flex items-center gap-2">
                                <span>🔍</span> Causal Diagnosis
                                <span className="text-[8px] bg-white dark:bg-white/5 shadow-sm dark:shadow-none px-1.5 py-0.5 rounded text-slate-600">
                                    {intelligence.hypotheses.length} hypothesis{intelligence.hypotheses.length > 1 ? 'es' : ''}
                                </span>
                            </h4>
                            <div className="space-y-2">
                                {intelligence.hypotheses.map((h, i) => (
                                    <HypothesisCard
                                        key={h.id || i}
                                        hypothesis={h}
                                        rank={i + 1}
                                        isExpanded={expandedHypothesis === i}
                                        onToggle={() => setExpandedHypothesis(expandedHypothesis === i ? -1 : i)}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Correlation Insights */}
                    {intelligence.correlations?.length > 0 && (
                        <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-3">
                            <h4 className="text-[9px] uppercase tracking-widest text-slate-500 font-bold mb-2">🔗 Signal Correlations</h4>
                            {intelligence.correlations.map((c, i) => (
                                <div key={i} className="flex items-start gap-2 text-[10px] text-slate-600 dark:text-slate-400 mb-1.5 last:mb-0">
                                    <span className="text-cyan-500 mt-0.5">→</span>
                                    <p>{c.insight}</p>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Engine Watermark */}
                    <div className="text-center pt-2">
                        <p className="text-[8px] text-slate-700 font-mono">
                            ENGINE v{intelligence.engine_version || "2.0"} • {intelligence.has_sensor_data ? "IoT + Satellite" : "Satellite Only"} • {new Date().toLocaleTimeString()}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

// ============================================
// CLIENT-SIDE FALLBACK (when backend is unreachable)
// ============================================
function generateClientSideFallback(ndviValue) {
    const signals = {
        ndvi: {
            raw_value: ndviValue,
            status: ndviValue < 0.25 ? "critical" : ndviValue < 0.5 ? "stressed" : "healthy",
            label: ndviValue < 0.25 ? "Critical" : ndviValue < 0.5 ? "Stressed" : "Healthy",
            color: ndviValue < 0.25 ? "#ef4444" : ndviValue < 0.5 ? "#f59e0b" : "#22c55e",
            severity: ndviValue < 0.25 ? 1.0 : ndviValue < 0.5 ? 0.6 : 0.0
        }
    };

    let hypotheses = [];
    if (ndviValue < 0.25) {
        hypotheses = [{
            id: "possible_stress", cause: "Vegetation Stress Detected (Satellite Only)", confidence: 0.60,
            icon: "🛰️", color: "#ef4444", gradient: "from-red-500 to-orange-500",
            reasoning: "NDVI satellite analysis shows critical vegetation decline. Connect IoT sensors for precise causal diagnosis — is it water, nutrients, or disease?",
            signals_used: ["NDVI ↓"], immediate_action: "Connect IoT sensors OR visually inspect the field for water/nutrient/disease signs.",
            severity: "high",
            detailed_steps: [
                "Check soil moisture manually — is the soil dry or wet?",
                "Look for yellowing leaves (nutrient) vs wilting (water) vs spots (disease)",
                "Use the Camera Diagnose feature for AI disease detection",
                "Connect IoT hardware for automated multi-signal analysis"
            ]
        }];
    } else if (ndviValue < 0.5) {
        hypotheses = [{
            id: "moderate_stress", cause: "Moderate Vegetation Stress", confidence: 0.55,
            icon: "⚠️", color: "#f59e0b", gradient: "from-amber-500 to-yellow-500",
            reasoning: "NDVI shows moderate stress. Without ground sensor data, the exact cause is uncertain. Could be early water stress, nutrient depletion, or seasonal variation.",
            signals_used: ["NDVI ↓"], immediate_action: "Monitor closely and consider soil testing.",
            severity: "medium",
            detailed_steps: ["Check irrigation schedule", "Order soil NPK test", "Re-scan in 48 hours"]
        }];
    } else {
        hypotheses = [{
            id: "healthy", cause: "Crop is Healthy", confidence: 0.90,
            icon: "✅", color: "#22c55e", gradient: "from-green-500 to-emerald-500",
            reasoning: "NDVI indicates strong photosynthetic activity. Vegetation appears healthy.",
            signals_used: ["NDVI ✓"], immediate_action: "Continue current management.",
            severity: "none", detailed_steps: ["Maintain current irrigation", "Schedule next soil test in 15 days"]
        }];
    }

    return {
        signals, hypotheses, has_sensor_data: false,
        risk_score: { score: ndviValue < 0.25 ? 65 : ndviValue < 0.5 ? 35 : 8, level: ndviValue < 0.25 ? "High" : ndviValue < 0.5 ? "Moderate" : "Low", color: ndviValue < 0.25 ? "#ef4444" : ndviValue < 0.5 ? "#f59e0b" : "#22c55e", breakdown: [{ signal: "ndvi", contribution: ndviValue < 0.25 ? 35 : 10, color: signals.ndvi.color }] },
        correlations: [], engine_version: "2.0-CLIENT"
    };
}

export default DecisionIntelligencePanel;
