import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, useMap, Circle, Polygon, Rectangle, Tooltip, useMapEvents, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import axios from "axios";
import { Phone, ExternalLink } from "lucide-react";
import DecisionIntelligencePanel from "./DecisionIntelligence";

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const STATIC_AGRONOMISTS = [
    { name: "Dr. Neelay", phone: "+919021935820" },
    { name: "Dr. Dhruv", phone: "+919579649407" }
];

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const MapController = ({ coords }) => {
    const map = useMap();
    useEffect(() => {
        if (coords) {
            map.flyTo(coords, 16, { duration: 2.5, easeLinearity: 0.25 });
        }
    }, [coords, map]);
    return null;
};

const DrawController = ({ isDrawing, onAddPoint }) => {
    useMapEvents({
        click(e) {
            if (isDrawing) {
                onAddPoint([e.latlng.lat, e.latlng.lng]);
            }
        }
    });
    return null;
};

const StatusBadge = ({ health }) => {
    let color = "bg-gray-500";
    let icon = "⚪";

    if (health.includes("Excellent") || health.includes("Good")) {
        color = "bg-green-500";
        icon = "🌿";
    } else if (health.includes("Stress") || health.includes("Moderate")) {
        color = "bg-yellow-500";
        icon = "⚠️";
    } else if (health.includes("Critical") || health.includes("Loss")) {
        color = "bg-red-500";
        icon = "🚨";
    }

    return (
        <div className={`flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 shadow-lg backdrop-blur-md ${color}/20 text-white font-bold animate-in fade-in zoom-in duration-500`}>
            <span className="text-xl">{icon}</span>
            <span className={`tracking-wide text-sm uppercase ${health.includes("Critical") ? "animate-pulse" : ""}`}>{health}</span>
        </div>
    );
};

const SatelliteMonitor = () => {
    const navigate = useNavigate();
    const [center, setCenter] = useState(null);
    const [heatmapData, setHeatmapData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [locationStatus, setLocationStatus] = useState("initializing");
    const [address, setAddress] = useState("");

    // Dynamic Recovery Logic
    const [isRecoveryMode, setIsRecoveryMode] = useState(false);
    const [analysisData, setAnalysisData] = useState(null);
    const [analysisLoading, setAnalysisLoading] = useState(false);

    // UI Logic States
    const [drawingMode, setDrawingMode] = useState(false);
    const [polygonPoints, setPolygonPoints] = useState([]);
    const [showAgent, setShowAgent] = useState(false);
    const [chatInput, setChatInput] = useState("");
    const [chatHistory, setChatHistory] = useState([]);
    const [agentState, setAgentState] = useState({ step: "START", history: [] });
    const [highlightedZone, setHighlightedZone] = useState(null);
    const [showLocationPin, setShowLocationPin] = useState(false);

    // --- GEOLOCATION: 4-tier fallback (Saved Lands -> Network GPS -> IP -> Last Known -> Failure) ---
    const reverseGeocode = async (lat, lng) => {
        try {
            const res = await axios.get(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10`);
            if (res.data?.address) {
                const addr = res.data.address;
                const city = addr.village || addr.town || addr.city || addr.suburb || "Your Farm";
                const state = addr.state || "";
                setAddress(`${city}${state ? ', ' + state : ''}`);
                return `${city}, ${state}`;
            }
        } catch (e) {
            console.warn("Reverse geocode failed:", e);
        }
        return "Detected Farm";
    };

    const detectLocation = async () => {
        localStorage.removeItem('last_known_location');
        setLocationStatus("detecting");
        
        const geoOptions = {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0 
        };

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                async (pos) => {
                    const { latitude, longitude } = pos.coords;
                    setCenter([latitude, longitude]);
                    setLocationStatus("gps");
                    setShowLocationPin(true);
                    reverseGeocode(latitude, longitude);
                },
                async (err) => {
                    await tryImmediateIP();
                },
                geoOptions
            );
        } else {
            await tryImmediateIP();
        }
    };

    const tryImmediateIP = async () => {
        try {
            const res = await axios.get('http://ip-api.com/json/').catch(() => null);
            if (res?.data?.lat && res?.data?.lon) {
                const { lat, lon, city, regionName } = res.data;
                setCenter([lat, lon]);
                setLocationStatus("ip");
                setShowLocationPin(true);
                setAddress(`${city}, ${regionName}`);
            } else {
                throw new Error("IP detection failed");
            }
        } catch (ipErr) {
            setCenter([20.5937, 78.9629]); 
            setLocationStatus("failed");
            setAddress("India (Fallback Data)");
        }
    };

    useEffect(() => {
        detectLocation();
    }, []);

    useEffect(() => {
        if (showAgent && chatHistory.length === 0) {
            handleSendChat("START_SESSION_TRIGGER");
        }
    }, [showAgent]);

    const handleSendChat = async (overrideMsg) => {
        const msg = overrideMsg || chatInput;
        if (!msg) return;

        if (!overrideMsg) {
            setChatHistory(prev => [...prev, { role: "user", content: msg }]);
            setChatInput("");
        }

        try {
            const currentState = { ...agentState };
            if (msg === "START_SESSION_TRIGGER") currentState.step = "START";

            const context = heatmapData ? {
                disease: "Vegetation Stress (NDVI)",
                confidence: 1.0,
                analysis: heatmapData.analysis
            } : null;

            const res = await axios.post(`${API_URL}/api/feature2/agent/chat`, {
                message: msg === "START_SESSION_TRIGGER" ? "" : msg,
                state: currentState,
                context: context
            });

            const result = res.data;
            setAgentState({ step: result.step, history: result.history, ndvi: currentState.ndvi });
            if (result.response) setChatHistory(prev => [...prev, { role: "agent", content: result.response }]);
        } catch (e) {
            setChatHistory(prev => [...prev, { role: "agent", content: "⚠️ Connection error." }]);
        }
    };

    const fetchExpertInsights = async (healthStatus, ndviVal) => {
        setAnalysisLoading(true);
        try {
            const response = await axios.post(`${API_URL}/api/feature2/analyze`, {
                disease: healthStatus || "Crop Health Analysis",
                confidence: 0.95
            });
            const data = response.data;

            let parsedPlan = {};
            let parsedSubsidy = { schemes: [] };

            try {
                let rawJson = data.treatment.replace(/```json/g, '').replace(/```/g, '').trim();
                parsedPlan = JSON.parse(rawJson);
            } catch (e) { parsedPlan = { timeline: [] }; }

            try {
                if (data.subsidy && data.subsidy.trim().startsWith('{')) {
                    parsedSubsidy = JSON.parse(data.subsidy);
                }
            } catch (e) { }

            setAnalysisData({ ...data, parsedPlan, parsedSubsidy });
        } catch (e) {
            console.error("Analysis Failed", e);
        } finally {
            setAnalysisLoading(false);
        }
    };

    const fetchNDVI = async () => {
        if (polygonPoints.length < 3) {
            setError("Please complete the farm boundary first (Minimum 3 points).");
            return;
        }
        setLoading(true);
        setError(null);
        setIsRecoveryMode(false);
        setAnalysisData(null);

        try {
            const lats = polygonPoints.map(p => p[0]);
            const lngs = polygonPoints.map(p => p[1]);
            const centerLat = lats.reduce((a, b) => a + b, 0) / lats.length;
            const centerLng = lngs.reduce((a, b) => a + b, 0) / lngs.length;

            const payload = {
                lat: centerLat, lng: centerLng,
                bbox: [Math.min(...lngs), Math.min(...lats), Math.max(...lngs), Math.max(...lats)]
            };

            const response = await axios.post(`${API_URL}/api/feature2/ndvi`, payload);
            const data = response.data;

            if (!data || !data.heatmap_points || data.heatmap_points.length === 0) {
                throw new Error("Satellite network returned no data for this boundary.");
            }

            setHeatmapData(data);
            setDrawingMode(false);

            fetchExpertInsights(data.overall_health, data.average_ndvi);

            if (data.average_ndvi < 0.25) {
                setIsRecoveryMode(true);
            }
        } catch (error) {
            setError(error.response?.data?.detail || "Satellite Feed Offline.");
        } finally {
            setLoading(false);
        }
    };

    const handleReset = () => {
        setPolygonPoints([]);
        setHeatmapData(null);
        setDrawingMode(false);
        setError(null);
        setIsRecoveryMode(false);
        setAnalysisData(null);
    };

    return (
        <div className="flex flex-col min-h-screen w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-sans overflow-x-hidden">
            <header className="relative h-16 flex items-center justify-between px-6 z-[10] bg-slate-950/80 backdrop-blur-sm border-b border-white/5">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center shadow-lg">
                        <span className="text-2xl">🛰️</span>
                    </div>
                    {address && (
                        <div className="flex flex-col">
                            <span className="text-[10px] text-slate-500 font-bold uppercase">Monitoring</span>
                            <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                                <div className="w-1 h-1 rounded-full bg-blue-500 animate-pulse" />
                                {address}
                            </span>
                        </div>
                    )}
                </div>
                <div>{heatmapData && <StatusBadge health={heatmapData.overall_health} />}</div>
            </header>

            <main className="flex-1 flex flex-col lg:flex-row relative">
                <div className={`relative min-h-[50vh] bg-slate-900 transition-all duration-700 ${isRecoveryMode ? 'lg:w-1/3' : 'flex-1'}`}>
                    {!center ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                            <div className="w-12 h-12 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                            <p className="text-xs text-blue-400 font-mono uppercase">Scanning...</p>
                        </div>
                    ) : (
                        <MapContainer center={center} zoom={16} zoomControl={false} style={{ height: "100%", width: "100%" }}>
                            <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" />
                            <MapController coords={center} />
                            <DrawController isDrawing={drawingMode} onAddPoint={(pt) => setPolygonPoints(prev => [...prev, pt])} />
                            {polygonPoints.length > 0 && <Polygon positions={polygonPoints} pathOptions={{ color: '#06b6d4', weight: 3 }} />}
                            {heatmapData?.heatmap_points.map((pt, idx) => (
                                <Circle key={idx} center={[pt.lat, pt.lng]} radius={12} pathOptions={{ fillColor: pt.value < 0.25 ? "#ef4444" : pt.value < 0.45 ? "#f59e0b" : "#22c55e", color: "transparent", fillOpacity: 0.6 }} />
                            ))}
                        </MapContainer>
                    )}

                    <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 flex gap-4 z-[900]">
                        {!drawingMode && polygonPoints.length === 0 && !heatmapData && (
                            <button onClick={() => setDrawingMode(true)} className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-bold">📍 Mark My Farm</button>
                        )}
                        {drawingMode && (
                            <div className="flex gap-3">
                                <button onClick={fetchNDVI} disabled={polygonPoints.length < 3} className="px-6 py-3 bg-green-600 text-white rounded-xl font-bold">📡 Scan Now</button>
                                <button onClick={() => { setDrawingMode(false); setPolygonPoints([]); }} className="px-6 py-3 bg-slate-800 text-white rounded-xl">Cancel</button>
                            </div>
                        )}
                        {heatmapData && <button onClick={handleReset} className="px-6 py-3 bg-slate-800 text-white rounded-xl font-bold">🔄 New Scan</button>}
                    </div>
                </div>

                {/* RIGHT PANEL: DASHBOARD */}
                {(heatmapData || error) && (
                    <div className={`bg-slate-900 border-l border-white/10 p-6 overflow-y-auto duration-700 ${isRecoveryMode ? 'lg:w-2/3' : 'lg:w-[480px]'}`}>
                        
                        {isRecoveryMode && analysisData ? (
                            <div className="animate-in slide-in-from-right space-y-6">
                                <h2 className="text-3xl font-black text-red-500 uppercase">Recovery Protocol</h2>
                                <div className="bg-black/20 rounded-2xl p-4 border border-red-500/10">
                                    <DecisionIntelligencePanel ndviValue={heatmapData.average_ndvi} health={heatmapData.overall_health} heatmapData={heatmapData} apiUrl={API_URL} onZoneHover={setHighlightedZone} center={{ lat: center[0], lng: center[1] }} />
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    <div className="space-y-4">
                                        <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                                            <h3 className="text-red-400 font-bold uppercase text-xs mb-2">Diagnosis</h3>
                                            <p className="text-slate-300 text-sm leading-relaxed">{analysisData.analysis}</p>
                                        </div>
                                        <button onClick={() => setShowAgent(true)} className="w-full bg-blue-600 text-white p-4 rounded-2xl flex items-center justify-between font-bold text-sm"><span>🤖 Ask AI Agronomist</span><span>→</span></button>
                                        <div className="bg-slate-950/50 p-4 rounded-2xl border border-blue-500/20">
                                            <h3 className="text-blue-400 font-bold uppercase text-xs mb-3">Expert consultation</h3>
                                            <div className="space-y-2">
                                                {STATIC_AGRONOMISTS.map((exp, i) => (
                                                    <div key={i} className="flex justify-between items-center bg-slate-900 p-2 rounded-lg border border-white/5 text-xs">
                                                        <span>{exp.name}</span>
                                                        <button 
                                                            onClick={async (e) => {
                                                                e.preventDefault();
                                                                const btn = e.currentTarget;
                                                                const originalContent = btn.innerHTML;
                                                                btn.disabled = true;
                                                                btn.innerHTML = '⏳ Calling...';

                                                                try {
                                                                    const res = await fetch(`${API_URL}/api/feature-agent/start-call`, {
                                                                        method: 'POST',
                                                                        headers: { 'Content-Type': 'application/json' },
                                                                        body: JSON.stringify({ farmer_phone: exp.phone })
                                                                    });
                                                                    const data = await res.json();
                                                                    if (data.success) alert(`Call initiated to ${exp.name}. Connecting shortly...`);
                                                                    else alert("Call failed: " + (data.detail || "Unknown error"));
                                                                } catch (e) {
                                                                    alert("Failed to place call. Check your connection.");
                                                                } finally {
                                                                    btn.disabled = false;
                                                                    btn.innerHTML = originalContent;
                                                                }
                                                            }}
                                                            className="bg-blue-600/20 text-blue-400 px-2 py-1 rounded font-bold uppercase flex items-center gap-1 hover:bg-blue-600 hover:text-white transition-all"
                                                        >
                                                            <Phone size={10} /> Call
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="bg-slate-950/30 p-5 rounded-3xl border border-yellow-500/20">
                                        <h3 className="text-yellow-500 font-bold text-sm uppercase mb-4">Recovery Steps</h3>
                                        <div className="space-y-4 relative pl-4 border-l border-yellow-500/20">
                                            {analysisData.parsedPlan?.timeline?.slice(0, 4).map((step, i) => (
                                                <div key={i}>
                                                    <span className="text-[10px] text-yellow-500/70 block uppercase font-mono">{step.day}</span>
                                                    <p className="text-xs text-slate-300 font-bold">{step.title}</p>
                                                    <p className="text-[10px] text-slate-500">{step.task}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <h3 className="text-green-500 font-bold text-sm uppercase">Financial Aid</h3>
                                        <div className="space-y-3">
                                            {analysisData.parsedSubsidy?.schemes?.slice(0,3).map((scheme, idx) => (
                                                <div key={idx} className="bg-green-900/10 p-4 rounded-2xl border border-green-500/20">
                                                    <h5 className="font-bold text-green-100 text-sm">{scheme.name}</h5>
                                                    <p className="text-[10px] text-green-100/60 mb-2 line-clamp-2">{scheme.details}</p>
                                                    <a href={scheme.website_url} target="_blank" className="text-[9px] text-green-400 uppercase font-bold">Visit portal</a>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            !isRecoveryMode && heatmapData && (
                                <div className="space-y-5 animate-in fade-in">
                                    <h2 className="text-2xl font-bold">Crop Health Report</h2>
                                    <DecisionIntelligencePanel ndviValue={heatmapData.average_ndvi} health={heatmapData.overall_health} heatmapData={heatmapData} apiUrl={API_URL} onZoneHover={setHighlightedZone} center={{ lat: center[0], lng: center[1] }} />
                                    <div className="bg-blue-900/10 p-5 rounded-2xl border border-blue-500/20">
                                        <p className="text-slate-300 text-sm">{heatmapData.analysis}</p>
                                    </div>

                                    {/* Related Schemes Section */}
                                    <div className="mt-8 bg-slate-950/40 rounded-3xl p-6 border border-white/5">
                                        <h3 className="text-green-500 font-bold uppercase text-xs mb-4">Related Government Schemes</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {analysisData?.parsedSubsidy?.schemes?.length > 0 ? (
                                                analysisData.parsedSubsidy.schemes.slice(0, 4).map((scheme, idx) => (
                                                    <div key={idx} className="bg-white/5 p-4 rounded-xl border border-white/10">
                                                        <h5 className="font-bold text-slate-200 text-sm mb-1">{scheme.name}</h5>
                                                        <p className="text-[10px] text-slate-400 mb-2 line-clamp-2">{scheme.details}</p>
                                                        <a href={scheme.website_url} target="_blank" className="text-[10px] text-green-400 uppercase font-bold">Portal</a>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="text-slate-500 text-xs italic">{analysisLoading ? "Checking schemes..." : "No schemes found."}</div>
                                            )}
                                        </div>
                                    </div>
                                    <button onClick={() => setShowAgent(true)} className="w-full bg-slate-800 text-white p-4 rounded-2xl border border-white/5 font-bold">💬 Chat with Agronomist</button>
                                </div>
                            )
                        )}

                        {analysisLoading && !analysisData && (
                            <div className="flex flex-col items-center justify-center h-48 gap-4">
                                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                                <p className="text-xs text-blue-400 uppercase animate-pulse">Running Analysis...</p>
                            </div>
                        )}
                    </div>
                )}
            </main>

            {showAgent && (
                <div className="fixed inset-0 z-[2000] bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
                    <div className="bg-slate-900 w-full max-w-lg h-[80vh] sm:rounded-3xl border border-slate-700 flex flex-col overflow-hidden">
                        <div className="p-4 bg-slate-800 border-b border-slate-700 flex justify-between items-center text-white">
                            <h3 className="font-bold">AI Agronomist</h3>
                            <button onClick={() => setShowAgent(false)}>✕</button>
                        </div>
                        <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-950/50">
                            {chatHistory.map((msg, i) => (
                                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[85%] p-4 rounded-2xl text-sm ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-200'}`}>{msg.content}</div>
                                </div>
                            ))}
                        </div>
                        <div className="p-4 border-t border-slate-700">
                            <div className="flex gap-2">
                                <input className="flex-1 bg-slate-800 border-none rounded-xl px-4 py-3 text-white" placeholder="Ask advice..." value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSendChat()} />
                                <button onClick={() => handleSendChat()} className="bg-blue-600 text-white px-5 rounded-xl font-bold">➤</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SatelliteMonitor;
