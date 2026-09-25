import React, { useState, useEffect, useMemo } from "react";

// ============================================
// MINI SPARKLINE CHART (Pure SVG)
// ============================================
const SparklineChart = ({ data, width = 320, height = 120, anomalies = [] }) => {
    const validData = data.filter(d => d.ndvi !== null);
    if (validData.length < 2) return <div className="text-xs text-slate-600 text-center py-8">Insufficient data for chart</div>;

    const ndviValues = validData.map(d => d.ndvi);
    const minVal = Math.max(0, Math.min(...ndviValues) - 0.05);
    const maxVal = Math.min(1, Math.max(...ndviValues) + 0.05);
    const range = maxVal - minVal || 0.1;

    const padding = { top: 12, bottom: 24, left: 8, right: 8 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    const points = validData.map((d, i) => ({
        x: padding.left + (i / (validData.length - 1)) * chartW,
        y: padding.top + chartH - ((d.ndvi - minVal) / range) * chartH,
        ndvi: d.ndvi,
        label: d.week_label,
        week: d.week,
    }));

    const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    const areaPath = linePath + ` L ${points[points.length - 1].x} ${padding.top + chartH} L ${points[0].x} ${padding.top + chartH} Z`;

    // Anomaly week numbers
    const anomalyWeeks = new Set(anomalies.map(a => a.week));

    // Health zone thresholds (Y positions)
    const critY = padding.top + chartH - ((0.25 - minVal) / range) * chartH;
    const stressY = padding.top + chartH - ((0.50 - minVal) / range) * chartH;

    return (
        <svg width={width} height={height} className="w-full" viewBox={`0 0 ${width} ${height}`}>
            {/* Health zones */}
            {critY > padding.top && critY < padding.top + chartH && (
                <line x1={padding.left} y1={critY} x2={width - padding.right} y2={critY}
                    stroke="#ef4444" strokeWidth="0.5" strokeDasharray="4 4" opacity="0.3" />
            )}
            {stressY > padding.top && stressY < padding.top + chartH && (
                <line x1={padding.left} y1={stressY} x2={width - padding.right} y2={stressY}
                    stroke="#f59e0b" strokeWidth="0.5" strokeDasharray="4 4" opacity="0.3" />
            )}

            {/* Gradient def */}
            <defs>
                <linearGradient id="ndviAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22c55e" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#22c55e" stopOpacity="0.02" />
                </linearGradient>
                <linearGradient id="ndviLineGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#06b6d4" />
                    <stop offset="50%" stopColor="#22c55e" />
                    <stop offset="100%" stopColor="#22c55e" />
                </linearGradient>
            </defs>

            {/* Area fill */}
            <path d={areaPath} fill="url(#ndviAreaGrad)" />

            {/* Line */}
            <path d={linePath} fill="none" stroke="url(#ndviLineGrad)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

            {/* Data points */}
            {points.map((p, i) => (
                <g key={i}>
                    {anomalyWeeks.has(p.week) ? (
                        <>
                            <circle cx={p.x} cy={p.y} r="5" fill="#ef4444" opacity="0.3">
                                <animate attributeName="r" values="5;9;5" dur="1.5s" repeatCount="indefinite" />
                            </circle>
                            <circle cx={p.x} cy={p.y} r="4" fill="#ef4444" stroke="#fff" strokeWidth="1.5" />
                        </>
                    ) : (
                        <circle cx={p.x} cy={p.y} r="3" fill="#22c55e" stroke="#fff" strokeWidth="1" />
                    )}
                    {/* Week label below */}
                    <text x={p.x} y={height - 4} textAnchor="middle" fill="#64748b" fontSize="7" fontWeight="600">
                        {p.label}
                    </text>
                </g>
            ))}
        </svg>
    );
};

// ============================================
// GROWTH STAGE CARD
// ============================================
const GrowthStageCard = ({ stage, deviationMessage }) => {
    if (!stage) return null;

    const isAhead = stage.deviation_pct > 10;
    const isBehind = stage.deviation_pct < -10;
    const devColor = isBehind ? "#ef4444" : isAhead ? "#22c55e" : "#3b82f6";

    return (
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-0.5" style={{ backgroundColor: devColor }} />

            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <span className="text-2xl">{stage.icon}</span>
                    <div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">{stage.name}</h4>
                        <span className="text-[9px] text-slate-500">Expected weeks: {stage.week_range}</span>
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-lg font-black" style={{ color: devColor }}>
                        {stage.deviation_pct > 0 ? "+" : ""}{stage.deviation_pct}%
                    </div>
                    <div className="text-[8px] text-slate-500">vs expected</div>
                </div>
            </div>

            {/* Expected vs Actual bar */}
            <div className="mb-3">
                <div className="flex justify-between text-[8px] text-slate-500 mb-1">
                    <span>Expected: {stage.expected_ndvi}</span>
                    <span>Actual: {stage.actual_ndvi}</span>
                </div>
                <div className="h-3 bg-white dark:bg-white/5 shadow-sm dark:shadow-none rounded-full relative overflow-hidden">
                    {/* Expected marker */}
                    <div className="absolute top-0 bottom-0 w-0.5 bg-white/40 z-10"
                        style={{ left: `${stage.expected_ndvi * 100}%` }} />
                    {/* Actual bar */}
                    <div className="h-full rounded-full transition-all duration-1000"
                        style={{
                            width: `${Math.min(100, stage.actual_ndvi * 100)}%`,
                            backgroundColor: devColor,
                        }} />
                </div>
            </div>

            {/* Deviation message */}
            <div className="bg-black/20 rounded-lg p-2.5 border border-slate-200 dark:border-white/5">
                <p className="text-[11px] leading-relaxed" style={{ color: devColor }}>
                    {isBehind ? "⚠️" : isAhead ? "🚀" : "✅"} {deviationMessage}
                </p>
            </div>
        </div>
    );
};

// ============================================
// ANOMALY ALERT CARD  
// ============================================
const AnomalyAlert = ({ anomaly }) => (
    <div className={`flex items-start gap-2 p-2.5 rounded-lg border ${anomaly.severity === 'critical' ? 'bg-red-500/10 border-red-500/20' : 'bg-amber-500/10 border-amber-500/20'}`}>
        <span className="text-sm mt-0.5">{anomaly.severity === 'critical' ? '🚨' : '⚠️'}</span>
        <div>
            <div className="text-[10px] font-bold text-slate-900 dark:text-white">{anomaly.week_label}: {anomaly.drop_pct}% NDVI Drop</div>
            <div className="text-[9px] text-slate-600 dark:text-slate-400">{anomaly.from_ndvi} → {anomaly.to_ndvi}</div>
            <p className="text-[9px] text-slate-500 mt-0.5">{anomaly.message}</p>
        </div>
    </div>
);

// ============================================
// LIVE SENSOR DATA CARD (from DB)
// ============================================
const LiveSensorPanel = ({ data, timestamp, source }) => {
    if (!data) return null;

    const sensors = [
        {
            key: "soil_moisture", label: "Soil Moisture", value: data.soil_moisture, unit: "%", icon: "💧",
            color: data.soil_moisture < 30 ? "#ef4444" : data.soil_moisture < 50 ? "#f59e0b" : "#22c55e",
            status: data.soil_moisture < 30 ? "LOW" : data.soil_moisture < 50 ? "OK" : "GOOD"
        },
        {
            key: "soil_temperature", label: "Soil Temperature", value: data.soil_temperature, unit: "°C", icon: "🌡️",
            color: data.soil_temperature > 35 ? "#ef4444" : data.soil_temperature < 15 ? "#3b82f6" : "#22c55e",
            status: data.soil_temperature > 35 ? "HOT" : data.soil_temperature < 15 ? "COLD" : "OK"
        },
        {
            key: "nitrogen", label: "Nitrogen (N)", value: data.nitrogen, unit: "kg/ha", icon: "🧪",
            color: data.nitrogen < 50 ? "#ef4444" : data.nitrogen < 100 ? "#f59e0b" : "#22c55e",
            status: data.nitrogen < 50 ? "LOW" : data.nitrogen < 100 ? "MED" : "OK"
        },
        {
            key: "phosphorus", label: "Phosphorus (P)", value: data.phosphorus, unit: "kg/ha", icon: "⚗️",
            color: data.phosphorus < 30 ? "#ef4444" : data.phosphorus < 60 ? "#f59e0b" : "#22c55e",
            status: data.phosphorus < 30 ? "LOW" : data.phosphorus < 60 ? "MED" : "OK"
        },
        {
            key: "potassium", label: "Potassium (K)", value: data.potassium, unit: "kg/ha", icon: "🧂",
            color: data.potassium < 40 ? "#ef4444" : data.potassium < 80 ? "#f59e0b" : "#22c55e",
            status: data.potassium < 40 ? "LOW" : data.potassium < 80 ? "MED" : "OK"
        },
        {
            key: "ph", label: "Soil pH", value: data.ph, unit: "pH", icon: "📊",
            color: data.ph < 5.5 ? "#ef4444" : data.ph > 8.0 ? "#ef4444" : data.ph < 6.0 || data.ph > 7.5 ? "#f59e0b" : "#22c55e",
            status: data.ph < 5.5 || data.ph > 8.0 ? "BAD" : data.ph < 6.0 || data.ph > 7.5 ? "OK" : "GOOD"
        },
    ].filter(s => s.value !== null && s.value !== undefined);

    return (
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-3">
            <div className="flex items-center justify-between mb-2">
                <h4 className="text-[9px] uppercase tracking-widest text-slate-500 font-bold flex items-center gap-1.5">
                    <span className="relative"><span className="w-1.5 h-1.5 bg-green-400 rounded-full inline-block" /><span className="absolute inset-0 w-1.5 h-1.5 bg-green-400 rounded-full animate-ping opacity-50 inline-block" /></span>
                    Live Field Sensors
                </h4>
                <span className="text-[8px] text-slate-600 font-mono">
                    {timestamp ? new Date(timestamp).toLocaleTimeString() : "—"}
                </span>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
                {sensors.map((s) => (
                    <div key={s.key} className="bg-black/20 rounded-xl p-2 border border-slate-200 dark:border-white/5 group hover:bg-white/[0.04] transition-all">
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-xs">{s.icon}</span>
                            <span className="text-[7px] font-bold px-1 py-0.5 rounded"
                                style={{ color: s.color, backgroundColor: s.color + '15', border: `1px solid ${s.color}30` }}>
                                {s.status}
                            </span>
                        </div>
                        <div className="text-sm font-black text-slate-900 dark:text-white">{s.value !== null ? (typeof s.value === 'number' ? s.value.toFixed(s.unit === 'pH' ? 1 : 0) : s.value) : "—"}</div>
                        <div className="text-[7px] text-slate-500 uppercase tracking-wider">{s.label}</div>
                        <div className="text-[7px] text-slate-600">{s.unit}</div>
                    </div>
                ))}
            </div>
            <div className="mt-2 text-center text-[7px] text-slate-700 font-mono">
                Source: {source || "autonomous_sensors"}
            </div>
        </div>
    );
};

// ============================================
// MAIN: NDVITimeSeriesPanel
// ============================================
const NDVITimeSeriesPanel = ({ apiUrl, center, bbox }) => {
    const [timeseries, setTimeseries] = useState(null);
    const [sensorData, setSensorData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [sensorLoading, setSensorLoading] = useState(false);

    const fetchTimeSeries = async () => {
        if (!center) return;
        setLoading(true);
        try {
            const res = await fetch(`${apiUrl}/api/feature2/ndvi-timeseries`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    lat: center.lat || center[0],
                    lng: center.lng || center[1],
                    weeks: 8,
                    bbox: bbox || null,
                }),
            });
            const data = await res.json();
            setTimeseries(data);
        } catch (e) {
            console.error("Time-series fetch failed:", e);
        } finally {
            setLoading(false);
        }
    };

    const fetchSensors = async () => {
        setSensorLoading(true);
        try {
            const res = await fetch(`${apiUrl}/api/feature2/field-sensors`);
            const data = await res.json();
            if (data.status === "success") {
                setSensorData(data);
            }
        } catch (e) {
            console.error("Sensor fetch failed:", e);
        } finally {
            setSensorLoading(false);
        }
    };

    useEffect(() => {
        fetchTimeSeries();
        fetchSensors();
    }, [center]);

    return (
        <div className="space-y-3">
            {/* Header */}
            <div className="flex items-center gap-2 px-1">
                <div className="relative">
                    <div className="w-2 h-2 bg-violet-400 rounded-full" />
                    <div className="absolute inset-0 w-2 h-2 bg-violet-400 rounded-full animate-ping opacity-50" />
                </div>
                <h3 className="text-[10px] uppercase tracking-[0.2em] text-violet-400 font-bold">
                    Time-Series Intelligence
                </h3>
            </div>

            {/* Live Sensor Data from DB */}
            {sensorData?.data && (
                <LiveSensorPanel
                    data={sensorData.data}
                    timestamp={sensorData.data.timestamp}
                    source={sensorData.source}
                />
            )}
            {sensorLoading && (
                <div className="text-center py-2 text-[9px] text-slate-500 animate-pulse">Loading sensor data from DB...</div>
            )}

            {/* Loading */}
            {loading && (
                <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6 flex flex-col items-center gap-2">
                    <div className="relative w-10 h-10">
                        <div className="absolute inset-0 border-2 border-violet-500/20 rounded-full" />
                        <div className="absolute inset-0 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                    <p className="text-[10px] text-violet-400 font-mono animate-pulse">FETCHING 8-WEEK SATELLITE HISTORY...</p>
                    <p className="text-[8px] text-slate-600">Querying Sentinel-2 for each week individually</p>
                </div>
            )}

            {/* Time-series Results */}
            {timeseries && !loading && (
                <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {/* Trend Badge */}
                    <div className="flex items-center justify-between bg-white/[0.03] border border-white/[0.06] rounded-2xl p-3">
                        <div className="flex items-center gap-2">
                            <span className="text-lg">
                                {timeseries.trend === 'improving' ? '📈' : timeseries.trend === 'declining' ? '📉' : '➡️'}
                            </span>
                            <div>
                                <div className="text-xs font-bold text-slate-900 dark:text-white">{timeseries.trend_text}</div>
                                <div className="text-[8px] text-slate-500">{timeseries.weeks_analyzed} weeks analyzed • {timeseries.source}</div>
                            </div>
                        </div>
                        <span className={`text-[9px] font-bold uppercase px-2 py-1 rounded-full
                            ${timeseries.trend === 'improving' ? 'bg-green-500/20 text-green-400' :
                                timeseries.trend === 'declining' ? 'bg-red-500/20 text-red-400' :
                                    'bg-blue-500/20 text-blue-400'}`}>
                            {timeseries.trend}
                        </span>
                    </div>

                    {/* Sparkline Chart */}
                    {timeseries.weekly_data && (
                        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-3">
                            <h4 className="text-[9px] uppercase tracking-widest text-slate-500 font-bold mb-2">📊 Weekly NDVI Curve</h4>
                            <SparklineChart
                                data={timeseries.weekly_data}
                                anomalies={timeseries.anomalies || []}
                                width={360}
                                height={120}
                            />
                            {/* Stats row */}
                            {timeseries.stats && (
                                <div className="grid grid-cols-4 gap-2 mt-2">
                                    {[
                                        { label: "CURRENT", value: timeseries.stats.current, color: "#22c55e" },
                                        { label: "AVG", value: timeseries.stats.avg, color: "#3b82f6" },
                                        { label: "MIN", value: timeseries.stats.min, color: "#ef4444" },
                                        { label: "MAX", value: timeseries.stats.max, color: "#22c55e" },
                                    ].map((s, i) => (
                                        <div key={i} className="text-center bg-black/20 rounded-lg p-1.5">
                                            <div className="text-[7px] text-slate-500 uppercase">{s.label}</div>
                                            <div className="text-sm font-black" style={{ color: s.color }}>{s.value}</div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Growth Stage */}
                    <GrowthStageCard
                        stage={timeseries.growth_stage}
                        deviationMessage={timeseries.deviation_message}
                    />

                    {/* Anomalies */}
                    {timeseries.anomalies?.length > 0 && (
                        <div className="space-y-1.5">
                            <h4 className="text-[9px] uppercase tracking-widest text-red-400 font-bold px-1 flex items-center gap-1.5">
                                🚨 Anomalies Detected ({timeseries.anomalies.length})
                            </h4>
                            {timeseries.anomalies.map((a, i) => (
                                <AnomalyAlert key={i} anomaly={a} />
                            ))}
                        </div>
                    )}

                    {/* Watermark */}
                    <div className="text-center pt-1">
                        <p className="text-[7px] text-slate-700 font-mono">
                            TIME-SERIES ENGINE v1.0 • {timeseries.source} • {new Date().toLocaleTimeString()}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NDVITimeSeriesPanel;
