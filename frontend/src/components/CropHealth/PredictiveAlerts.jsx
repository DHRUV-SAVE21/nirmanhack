import React, { useState, useEffect } from "react";

// ============================================
// INDIVIDUAL ALERT CARD
// ============================================
const AlertCard = ({ alert }) => {
    const [expanded, setExpanded] = useState(false);

    const colorMap = {
        high: "#ef4444", critical: "#ef4444",
        moderate: "#f59e0b", warning: "#f59e0b",
        low: "#22c55e", stable: "#22c55e",
        excellent: "#22c55e", good: "#3b82f6",
        poor: "#ef4444",
    };

    const bgMap = {
        high: "rgba(239,68,68,0.08)", critical: "rgba(239,68,68,0.08)",
        moderate: "rgba(245,158,11,0.08)", warning: "rgba(245,158,11,0.08)",
        low: "rgba(34,197,94,0.06)", stable: "rgba(34,197,94,0.06)",
        excellent: "rgba(34,197,94,0.06)", good: "rgba(59,130,246,0.06)",
        poor: "rgba(239,68,68,0.08)",
    };

    const color = colorMap[alert.level] || "#64748b";
    const bg = bgMap[alert.level] || "rgba(100,116,139,0.06)";

    // Probability ring (mini gauge)
    const prob = alert.probability || 0;
    const circumference = 2 * Math.PI * 18;
    const dashOffset = circumference - (prob / 100) * circumference;

    return (
        <div
            className="rounded-2xl border transition-all duration-300 cursor-pointer hover:scale-[1.01]"
            style={{ backgroundColor: bg, borderColor: color + "30" }}
            onClick={() => setExpanded(!expanded)}
        >
            <div className="p-3 flex items-center gap-3">
                {/* Probability Ring */}
                <div className="relative w-11 h-11 flex-shrink-0">
                    <svg className="w-11 h-11 -rotate-90" viewBox="0 0 40 40">
                        <circle cx="20" cy="20" r="18" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
                        <circle
                            cx="20" cy="20" r="18" fill="none"
                            stroke={color} strokeWidth="3"
                            strokeDasharray={circumference}
                            strokeDashoffset={dashOffset}
                            strokeLinecap="round"
                            className="transition-all duration-1000"
                        />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-[10px] font-black" style={{ color }}>{prob}%</span>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">{alert.title}</h4>
                        <span className="text-[7px] font-black uppercase px-1.5 py-0.5 rounded-full flex-shrink-0"
                            style={{ color, backgroundColor: color + '20', border: `1px solid ${color}40` }}>
                            {alert.level}
                        </span>
                    </div>
                    <p className="text-[9px] text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-2">{alert.message}</p>
                </div>

                {/* Expand chevron */}
                <svg className={`w-4 h-4 text-slate-500 transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </div>

            {/* Expanded Details */}
            {expanded && (
                <div className="px-3 pb-3 border-t border-slate-200 dark:border-white/5 pt-2 space-y-2">
                    {/* Type-specific details */}
                    {alert.type === "stress_risk" && alert.factors && (
                        <div className="grid grid-cols-2 gap-1.5">
                            {Object.entries(alert.factors).filter(([, v]) => v !== null).map(([key, val]) => (
                                <div key={key} className="bg-black/20 rounded-lg p-2">
                                    <div className="text-[7px] text-slate-500 uppercase">{key.replace(/_/g, ' ')}</div>
                                    <div className="text-[10px] font-bold text-slate-900 dark:text-white">{typeof val === 'number' ? val.toFixed(3) : val}</div>
                                </div>
                            ))}
                        </div>
                    )}

                    {alert.type === "irrigation_forecast" && (
                        <div className="grid grid-cols-3 gap-1.5">
                            <div className="bg-black/20 rounded-lg p-2 text-center">
                                <div className="text-[7px] text-slate-500">DAYS TO CRITICAL</div>
                                <div className="text-sm font-black" style={{ color }}>{alert.days_to_critical}</div>
                            </div>
                            <div className="bg-black/20 rounded-lg p-2 text-center">
                                <div className="text-[7px] text-slate-500">CURRENT MOISTURE</div>
                                <div className="text-sm font-black text-blue-400">{alert.current_moisture}%</div>
                            </div>
                            <div className="bg-black/20 rounded-lg p-2 text-center">
                                <div className="text-[7px] text-slate-500">LOSS RATE</div>
                                <div className="text-sm font-black text-amber-400">{alert.daily_loss_rate}%/day</div>
                            </div>
                        </div>
                    )}

                    {alert.type === "disease_risk" && alert.risk_factors?.length > 0 && (
                        <div className="space-y-1">
                            <div className="text-[8px] text-slate-500 uppercase font-bold">Risk Factors</div>
                            {alert.risk_factors.map((f, i) => (
                                <div key={i} className="flex items-start gap-1.5 text-[9px] text-slate-600 dark:text-slate-400">
                                    <span className="text-red-400 mt-0.5">•</span> {f}
                                </div>
                            ))}
                        </div>
                    )}

                    {alert.type === "yield_forecast" && (
                        <div className="space-y-2">
                            <div className="grid grid-cols-3 gap-1.5">
                                <div className="bg-black/20 rounded-lg p-2 text-center">
                                    <div className="text-[7px] text-slate-500">YIELD</div>
                                    <div className="text-sm font-black" style={{ color }}>{alert.predicted_yield_per_ha} t/ha</div>
                                </div>
                                <div className="bg-black/20 rounded-lg p-2 text-center">
                                    <div className="text-[7px] text-slate-500">CONFIDENCE</div>
                                    <div className="text-sm font-black text-blue-400">{alert.confidence}%</div>
                                </div>
                                <div className="bg-black/20 rounded-lg p-2 text-center">
                                    <div className="text-[7px] text-slate-500">SEASON</div>
                                    <div className="text-sm font-black text-cyan-400">{alert.season_progress}%</div>
                                </div>
                            </div>
                            {/* Yield bar */}
                            <div>
                                <div className="flex justify-between text-[7px] text-slate-500 mb-1">
                                    <span>0%</span>
                                    <span>Yield Potential: {alert.yield_percentage}%</span>
                                    <span>100%</span>
                                </div>
                                <div className="h-2 bg-white dark:bg-white/5 shadow-sm dark:shadow-none rounded-full overflow-hidden">
                                    <div className="h-full rounded-full transition-all duration-1000"
                                        style={{ width: `${alert.yield_percentage}%`, backgroundColor: color }} />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Trust & Explainability Layer */}
                    <div className="mt-4 pt-3 border-t border-slate-200 dark:border-white/5 space-y-2.5">
                        <div className="flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                            <h5 className="text-[8px] font-black text-blue-400 uppercase tracking-widest">Trust & Explainability</h5>
                        </div>

                        <div className="bg-blue-500/5 rounded-xl p-3 border border-blue-500/10">
                            <div className="space-y-2">
                                <div>
                                    <div className="text-[7px] text-blue-400/60 font-bold uppercase mb-0.5">Reason</div>
                                    <p className="text-[10px] text-slate-200 leading-relaxed italic">
                                        "{(alert.reason || alert.message)}"
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-3 pt-1">
                                    <div>
                                        <div className="text-[7px] text-blue-400/60 font-bold uppercase mb-0.5">Data Source</div>
                                        <div className="flex items-center gap-1">
                                            <span className="text-[9px] text-slate-900 dark:text-white font-medium">{alert.data_source || 'Multi-Signal Analysis'}</span>
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-[7px] text-blue-400/60 font-bold uppercase mb-0.5">Last Updated</div>
                                        <div className="text-[9px] text-slate-900 dark:text-white font-medium">
                                            {alert.last_updated ? new Date(alert.last_updated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Live'}
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <div className="text-[7px] text-blue-400/60 font-bold uppercase mb-1">Confidence Score</div>
                                    <div className="flex items-center gap-2">
                                        <div className="flex-1 h-1 bg-white dark:bg-white/5 shadow-sm dark:shadow-none rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-blue-500 rounded-full transition-all duration-1000"
                                                style={{ width: `${alert.confidence || alert.probability || 0}%` }}
                                            />
                                        </div>
                                        <span className="text-[9px] font-black text-blue-400">{alert.confidence || alert.probability || 0}%</span>
                                    </div>
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
// OVERALL STATUS BADGE
// ============================================
const OverallStatusBadge = ({ status, maxRisk, alertCount }) => {
    const statusConfig = {
        critical: { color: "#ef4444", icon: "🚨", label: "CRITICAL" },
        warning: { color: "#f59e0b", icon: "⚠️", label: "WARNING" },
        stable: { color: "#22c55e", icon: "✅", label: "STABLE" },
    };

    const cfg = statusConfig[status] || statusConfig.stable;

    return (
        <div className="flex items-center justify-between bg-white/[0.03] border rounded-2xl p-3"
            style={{ borderColor: cfg.color + '20' }}>
            <div className="flex items-center gap-2">
                <span className="text-lg">{cfg.icon}</span>
                <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">Predictive Status: <span style={{ color: cfg.color }}>{cfg.label}</span></div>
                    <div className="text-[8px] text-slate-500">{alertCount} active predictions • max risk {maxRisk}%</div>
                </div>
            </div>
            <div className="text-right">
                <div className="text-lg font-black" style={{ color: cfg.color }}>{maxRisk}%</div>
                <div className="text-[7px] text-slate-600">max risk</div>
            </div>
        </div>
    );
};

// ============================================
// MAIN: PredictiveAlertsPanel
// ============================================
const PredictiveAlertsPanel = ({ apiUrl, center, bbox, ndviSeries }) => {
    const [predictions, setPredictions] = useState(null);
    const [loading, setLoading] = useState(false);

    const fetchPredictions = async () => {
        if (!center) return;
        setLoading(true);
        try {
            const res = await fetch(`${apiUrl}/api/feature2/predictive-alerts`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    lat: center.lat || center[0],
                    lng: center.lng || center[1],
                    ndvi_series: ndviSeries || null,
                    crop_type: "general",
                    bbox: bbox || null,
                }),
            });
            const data = await res.json();
            setPredictions(data);
        } catch (e) {
            console.error("Predictive alerts fetch failed:", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPredictions();
    }, [center, ndviSeries]);

    return (
        <div className="space-y-3">
            {/* Header */}
            <div className="flex items-center gap-2 px-1">
                <div className="relative">
                    <div className="w-2 h-2 bg-amber-400 rounded-full" />
                    <div className="absolute inset-0 w-2 h-2 bg-amber-400 rounded-full animate-ping opacity-50" />
                </div>
                <h3 className="text-[10px] uppercase tracking-[0.2em] text-amber-400 font-bold">
                    Predictive Alerts Engine
                </h3>
                <span className="text-[7px] text-slate-600 ml-auto font-mono">REAL DATA ONLY</span>
            </div>

            {/* Loading */}
            {loading && (
                <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6 flex flex-col items-center gap-2">
                    <div className="relative w-10 h-10">
                        <div className="absolute inset-0 border-2 border-amber-500/20 rounded-full" />
                        <div className="absolute inset-0 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                    <p className="text-[10px] text-amber-400 font-mono animate-pulse">COMPUTING PREDICTIONS...</p>
                    <p className="text-[8px] text-slate-600">Analyzing NDVI trends + sensor signals</p>
                </div>
            )}

            {/* Results */}
            {predictions && !loading && (
                <div className="space-y-2.5">
                    {/* Overall Status */}
                    <OverallStatusBadge
                        status={predictions.overall_status}
                        maxRisk={predictions.max_risk}
                        alertCount={predictions.alert_count}
                    />

                    {/* Individual Alerts */}
                    {predictions.alerts?.map((alert, i) => (
                        <AlertCard key={i} alert={alert} />
                    ))}

                    {/* No alerts case */}
                    {predictions.alerts?.length === 0 && (
                        <div className="text-center py-4 bg-white/[0.02] rounded-2xl border border-white/[0.06]">
                            <p className="text-sm text-slate-500">No data available for predictions</p>
                            <p className="text-[9px] text-slate-600 mt-1">Scan your farm first to generate predictive alerts</p>
                        </div>
                    )}

                    {/* Data Sources */}
                    {predictions.data_sources && (
                        <div className="flex items-center justify-center gap-3 pt-1">
                            <span className="text-[7px] text-slate-700 font-mono">
                                NDVI: {predictions.data_sources.ndvi_weeks}wk •
                                Sensors: {predictions.data_sources.has_sensor_data ? '✅' : '❌'} •
                                Crop: {predictions.data_sources.crop_type}
                            </span>
                        </div>
                    )}

                    {/* Engine watermark */}
                    <div className="text-center pt-0.5">
                        <p className="text-[6px] text-slate-800 font-mono">{predictions.engine}</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PredictiveAlertsPanel;
