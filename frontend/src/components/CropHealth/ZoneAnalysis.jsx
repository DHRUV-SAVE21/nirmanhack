import React, { useState, useMemo } from "react";

// ============================================
// MINI ANIMATED NUMBER
// ============================================
const MiniNum = ({ value, decimals = 2 }) => {
    if (value === null || value === undefined) return <span>—</span>;
    return <span>{parseFloat(value).toFixed(decimals)}</span>;
};

// ============================================
// ZONE CELL (Single zone in the grid)
// ============================================
const ZoneCell = ({ zone, isSelected, onSelect, isBest, isWorst }) => {
    if (!zone) return <div className="w-full aspect-square bg-white/[0.02] rounded-lg" />;

    const ndvi = zone.ndvi_avg;
    const hasData = ndvi !== null && ndvi !== undefined;

    return (
        <button
            onClick={() => onSelect(zone)}
            className={`relative w-full aspect-square rounded-xl border transition-all duration-300 group overflow-hidden
                ${isSelected
                    ? 'border-white/40 shadow-lg scale-105 z-10 ring-2 ring-white/20'
                    : 'border-white/[0.06] hover:border-white/20 hover:scale-[1.02]'}`}
            style={{
                backgroundColor: hasData ? zone.color + '25' : 'rgba(255,255,255,0.02)',
            }}
        >
            {/* Color fill bar from bottom based on NDVI */}
            {hasData && (
                <div
                    className="absolute bottom-0 left-0 right-0 transition-all duration-700 ease-out opacity-30"
                    style={{
                        height: `${Math.max(10, Math.min(100, ndvi * 120))}%`,
                        backgroundColor: zone.color,
                    }}
                />
            )}

            {/* Zone Label */}
            <div className="absolute top-1 left-1.5 text-[8px] font-black text-white/60 tracking-wider">
                {zone.label}
            </div>

            {/* Badge for best/worst */}
            {isBest && (
                <div className="absolute top-0.5 right-0.5 text-[8px]">🏆</div>
            )}
            {isWorst && (
                <div className="absolute top-0.5 right-0.5 text-[8px] animate-pulse">⚠️</div>
            )}

            {/* NDVI Value */}
            <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-black text-slate-900 dark:text-white drop-shadow-md">
                    {hasData ? ndvi.toFixed(2) : "–"}
                </span>
            </div>

            {/* Risk indicator dot */}
            {hasData && (
                <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex items-center gap-0.5">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: zone.color }} />
                </div>
            )}
        </button>
    );
};

// ============================================
// ZONE DETAIL CARD (Selected zone)
// ============================================
const ZoneDetailCard = ({ zone, onClose }) => {
    if (!zone) return null;

    return (
        <div className="bg-white/[0.04] border border-slate-200 dark:border-white/10 rounded-2xl p-4 animate-in slide-in-from-bottom-2 duration-300 relative overflow-hidden">
            {/* Top accent line */}
            <div className="absolute top-0 left-0 right-0 h-1" style={{ backgroundColor: zone.color }} />

            <div className="flex items-start justify-between mb-3">
                <div>
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black text-slate-900 dark:text-white"
                            style={{ backgroundColor: zone.color + '30', border: `1px solid ${zone.color}50` }}>
                            {zone.label}
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-slate-900 dark:text-white">Zone {zone.label}</h4>
                            <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full"
                                style={{ color: zone.color, backgroundColor: zone.color + '15', border: `1px solid ${zone.color}30` }}>
                                {zone.health}
                            </span>
                        </div>
                    </div>
                </div>
                <button onClick={onClose} className="text-slate-500 hover:text-white text-xs p-1">✕</button>
            </div>

            {/* NDVI Stats */}
            <div className="grid grid-cols-4 gap-2 mb-3">
                {[
                    { label: "AVG", value: zone.ndvi_avg, color: zone.color },
                    { label: "MIN", value: zone.ndvi_min, color: "#ef4444" },
                    { label: "MAX", value: zone.ndvi_max, color: "#22c55e" },
                    { label: "σ DEV", value: zone.ndvi_std, color: "#8b5cf6" },
                ].map((s, i) => (
                    <div key={i} className="bg-black/20 rounded-lg p-2 text-center">
                        <div className="text-[8px] text-slate-500 uppercase tracking-wider">{s.label}</div>
                        <div className="text-sm font-black" style={{ color: s.color }}>
                            <MiniNum value={s.value} decimals={s.label === "σ DEV" ? 3 : 2} />
                        </div>
                    </div>
                ))}
            </div>

            {/* NDVI Bar */}
            <div className="mb-3">
                <div className="flex justify-between text-[8px] text-slate-500 mb-1">
                    <span>0.0</span><span>Vegetation Index</span><span>1.0</span>
                </div>
                <div className="h-2.5 bg-gradient-to-r from-red-900/30 via-yellow-900/30 to-green-900/30 rounded-full overflow-hidden relative">
                    {/* Marker for zone avg */}
                    {zone.ndvi_avg !== null && (
                        <div className="absolute top-0 bottom-0 w-1 rounded-full transition-all duration-1000 shadow-lg"
                            style={{
                                left: `${Math.max(0, Math.min(100, zone.ndvi_avg * 100))}%`,
                                backgroundColor: zone.color,
                                boxShadow: `0 0 8px ${zone.color}`,
                            }} />
                    )}
                    {/* Range bar min-max */}
                    {zone.ndvi_min !== null && zone.ndvi_max !== null && (
                        <div className="absolute top-0.5 bottom-0.5 rounded-full opacity-40"
                            style={{
                                left: `${Math.max(0, zone.ndvi_min * 100)}%`,
                                width: `${Math.max(1, (zone.ndvi_max - zone.ndvi_min) * 100)}%`,
                                backgroundColor: zone.color,
                            }} />
                    )}
                </div>
            </div>

            {/* Action */}
            <div className="bg-black/20 rounded-xl p-3 border border-slate-200 dark:border-white/5">
                <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-[9px]">⚡</span>
                    <span className="text-[9px] uppercase tracking-widest font-bold" style={{ color: zone.color }}>
                        Zone-Specific Action
                    </span>
                </div>
                <p className="text-[11px] text-slate-700 dark:text-slate-300 leading-relaxed">{zone.action}</p>
            </div>

            {/* Coordinates */}
            <div className="mt-2 text-center">
                <span className="text-[8px] text-slate-600 font-mono">
                    📍 {zone.center?.lat?.toFixed(5)}, {zone.center?.lng?.toFixed(5)} • {zone.pixel_count} px
                </span>
            </div>
        </div>
    );
};

// ============================================
// ZONE SUMMARY BAR
// ============================================
const ZoneSummaryBar = ({ summary }) => {
    if (!summary) return null;

    const total = summary.total_zones;
    const critWidth = (summary.critical_count / total) * 100;
    const stressWidth = ((summary.stressed_count - summary.critical_count) / total) * 100;
    const healthyWidth = (summary.healthy_count / total) * 100;

    return (
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-3">
            <div className="flex items-center justify-between mb-2">
                <h4 className="text-[9px] uppercase tracking-widest text-slate-500 font-bold">Zone Summary</h4>
                <span className="text-[8px] text-slate-600 font-mono">{summary.grid_size} grid</span>
            </div>

            {/* Stacked bar */}
            <div className="h-3 bg-white dark:bg-white/5 shadow-sm dark:shadow-none rounded-full overflow-hidden flex mb-2">
                {critWidth > 0 && (
                    <div className="h-full bg-red-500 transition-all duration-700" style={{ width: `${critWidth}%` }} />
                )}
                {stressWidth > 0 && (
                    <div className="h-full bg-amber-500 transition-all duration-700" style={{ width: `${stressWidth}%` }} />
                )}
                {healthyWidth > 0 && (
                    <div className="h-full bg-green-500 transition-all duration-700" style={{ width: `${healthyWidth}%` }} />
                )}
            </div>

            <div className="grid grid-cols-3 gap-2">
                <div className="text-center">
                    <div className="text-lg font-black text-red-400">{summary.critical_count}</div>
                    <div className="text-[8px] text-slate-500">CRITICAL</div>
                </div>
                <div className="text-center">
                    <div className="text-lg font-black text-amber-400">{summary.stressed_count}</div>
                    <div className="text-[8px] text-slate-500">STRESSED</div>
                </div>
                <div className="text-center">
                    <div className="text-lg font-black text-green-400">{summary.healthy_count}</div>
                    <div className="text-[8px] text-slate-500">HEALTHY</div>
                </div>
            </div>

            {/* Best/Worst + Uniformity */}
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-200 dark:border-white/5">
                <div className="flex items-center gap-3 text-[9px]">
                    {summary.best_zone && (
                        <span className="text-green-400">🏆 Best: <b>{summary.best_zone}</b></span>
                    )}
                    {summary.worst_zone && (
                        <span className="text-red-400">⚠️ Worst: <b>{summary.worst_zone}</b></span>
                    )}
                </div>
                <div className="text-[9px] text-slate-500">
                    Uniformity: <span className={`font-bold ${summary.uniformity > 0.7 ? 'text-green-400' : summary.uniformity > 0.4 ? 'text-amber-400' : 'text-red-400'}`}>
                        {(summary.uniformity * 100).toFixed(0)}%
                    </span>
                </div>
            </div>
        </div>
    );
};

// ============================================
// SORTED ZONE LIST (Priority-ranked)
// ============================================
const ZonePriorityList = ({ zones, onSelectZone }) => {
    const sorted = useMemo(() => {
        if (!zones) return [];
        return [...zones]
            .filter(z => z.ndvi_avg !== null)
            .sort((a, b) => (a.ndvi_avg || 0) - (b.ndvi_avg || 0));
    }, [zones]);

    if (sorted.length === 0) return null;

    return (
        <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-3">
            <h4 className="text-[9px] uppercase tracking-widest text-slate-500 font-bold mb-2">📋 Priority Action Queue</h4>
            <div className="space-y-1">
                {sorted.slice(0, 6).map((zone, i) => (
                    <button
                        key={zone.zone_id}
                        onClick={() => onSelectZone(zone)}
                        className="w-full flex items-center gap-2 p-2 rounded-lg bg-white/[0.02] hover:bg-white/[0.05] transition-all group text-left"
                    >
                        <div className="w-5 h-5 rounded flex items-center justify-center text-[9px] font-black"
                            style={{ backgroundColor: zone.color + '25', color: zone.color }}>
                            {i + 1}
                        </div>
                        <div className="w-6 h-6 rounded flex items-center justify-center text-[8px] font-black text-slate-900 dark:text-white bg-white/[0.05]">
                            {zone.label}
                        </div>
                        <div className="flex-1">
                            <div className="h-1.5 bg-white dark:bg-white/5 shadow-sm dark:shadow-none rounded-full overflow-hidden">
                                <div className="h-full rounded-full transition-all duration-500"
                                    style={{ width: `${Math.max(5, (zone.ndvi_avg || 0) * 100)}%`, backgroundColor: zone.color }} />
                            </div>
                        </div>
                        <span className="text-[10px] font-mono font-bold w-10 text-right" style={{ color: zone.color }}>
                            {zone.ndvi_avg?.toFixed(2)}
                        </span>
                        <span className="text-[8px] text-slate-600 w-14 text-right uppercase">{zone.health}</span>
                    </button>
                ))}
            </div>
        </div>
    );
};

// ============================================
// MAIN: ZoneAnalysisPanel
// ============================================
const ZoneAnalysisPanel = ({ zones, zoneSummary, onZoneHover }) => {
    const [selectedZone, setSelectedZone] = useState(null);
    const [showGrid, setShowGrid] = useState(true);

    if (!zones || zones.length === 0) return null;

    // Build grid from zones
    const gridSize = Math.round(Math.sqrt(zones.length));

    return (
        <div className="space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 px-1">
                    <div className="relative">
                        <div className="w-2 h-2 bg-emerald-400 rounded-full" />
                        <div className="absolute inset-0 w-2 h-2 bg-emerald-400 rounded-full animate-ping opacity-50" />
                    </div>
                    <h3 className="text-[10px] uppercase tracking-[0.2em] text-emerald-400 font-bold">
                        Zone-Level Precision
                    </h3>
                    <span className="text-[8px] bg-emerald-400/10 text-emerald-400 px-1.5 py-0.5 rounded font-mono">
                        {zones.length} zones
                    </span>
                </div>
                <button
                    onClick={() => setShowGrid(!showGrid)}
                    className="text-[9px] text-slate-500 hover:text-white px-2 py-1 rounded bg-white/[0.03] transition-colors"
                >
                    {showGrid ? '▼ Grid' : '▶ Grid'}
                </button>
            </div>

            {/* Zone Summary */}
            <ZoneSummaryBar summary={zoneSummary} />

            {/* Interactive Grid */}
            {showGrid && (
                <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-3">
                    <div className="flex items-center justify-between mb-2">
                        <h4 className="text-[9px] uppercase tracking-widest text-slate-500 font-bold">🗺️ Zone Grid</h4>
                        <div className="flex items-center gap-2">
                            {[
                                { color: "#ef4444", label: "Critical" },
                                { color: "#f59e0b", label: "Stressed" },
                                { color: "#22c55e", label: "Healthy" },
                            ].map((l, i) => (
                                <div key={i} className="flex items-center gap-1">
                                    <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: l.color }} />
                                    <span className="text-[7px] text-slate-600">{l.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div
                        className="grid gap-1.5"
                        style={{ gridTemplateColumns: `repeat(${gridSize}, 1fr)` }}
                    >
                        {zones.map((zone) => (
                            <ZoneCell
                                key={zone.zone_id}
                                zone={zone}
                                isSelected={selectedZone?.zone_id === zone.zone_id}
                                onSelect={(z) => {
                                    setSelectedZone(z);
                                    if (onZoneHover) onZoneHover(z);
                                }}
                                isBest={zoneSummary?.best_zone === zone.label}
                                isWorst={zoneSummary?.worst_zone === zone.label}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Selected Zone Detail */}
            {selectedZone && (
                <ZoneDetailCard
                    zone={selectedZone}
                    onClose={() => setSelectedZone(null)}
                />
            )}

            {/* Priority Action Queue */}
            <ZonePriorityList zones={zones} onSelectZone={(z) => {
                setSelectedZone(z);
                if (onZoneHover) onZoneHover(z);
            }} />
        </div>
    );
};

export default ZoneAnalysisPanel;
