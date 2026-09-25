import React, { useState, useRef, useCallback, useEffect } from 'react';
import Webcam from "react-webcam";
import { useTranslation } from 'react-i18next';
import {
    Scan, AlertTriangle, CheckCircle, Activity,
    ThermometerSun, Droplets, ShieldAlert, Calendar,
    MoreHorizontal, ThumbsUp, ThumbsDown, Volume2, Leaf, FlaskConical, TrendingUp,
    Trash2, ShoppingCart, Minus, Plus, Send, MessageSquare, Bot, User, FileText, ExternalLink, Phone,
    Camera, ChevronRight, RefreshCw, X, Upload
} from 'lucide-react';

const STATIC_AGRONOMISTS = [
    { name: "Dr. Neelay", phone: "+919021935820" },
    { name: "Dr. Dhruv", phone: "+919579649407" }
];

const CameraDiagnose = () => {
    const { t, i18n } = useTranslation();
    const apiBase = import.meta.env.VITE_API_BASE_URL || 'https://let-go-3-0.onrender.com';
    const [image, setImage] = useState(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null); // Step 1: CNN Result + Quality + Heatmap
    const [analysis, setAnalysis] = useState(null); // Step 2: Full Plan (JSON parsed)
    const [showHeatmap, setShowHeatmap] = useState(false);
    const [cart, setCart] = useState({ organic: [], chemical: [] });
    const [cameraError, setCameraError] = useState(null);

    const [orderPlaced, setOrderPlaced] = useState(false);
    const [experts, setExperts] = useState([]); // Store 2 random experts

    // Chat State
    const [chatHistory, setChatHistory] = useState([]);
    const [chatInput, setChatInput] = useState("");
    const [chatLoading, setChatLoading] = useState(false);
    const chatContainerRef = useRef(null);


    const webcamRef = useRef(null);

    const handleCameraError = useCallback((error) => {
        console.error("Camera Error:", error);
        let msg = "Camera unavailable.";
        if (error.name === "NotReadableError") msg = "Camera is in use by another app.";
        else if (error.name === "NotAllowedError") msg = "Permission denied.";
        else if (error.name === "NotFoundError") msg = "No camera found.";
        setCameraError(msg);
    }, []);

    const capture = useCallback(() => {
        const imageSrc = webcamRef.current.getScreenshot();
        setImage(imageSrc);
        setResult(null);
        setAnalysis(null);
    }, [webcamRef]);

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImage(reader.result);
                setResult(null);
                setAnalysis(null);
            };
            reader.readAsDataURL(file);
        }
    };

    // Step 1: Detailed Scan (CNN + Quality + Heatmap)
    const runScan = async () => {
        setLoading(true);
        setResult(null);
        setAnalysis(null);
        try {
            const res = await fetch(image);
            const blob = await res.blob();

            const formData = new FormData();
            formData.append('file', blob, 'crop_image.jpg');

            const response = await fetch(`${apiBase}/api/feature2/predict`, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) throw new Error("Scan failed");

            const data = await response.json();
            setResult(data);

            // Auto-trigger analysis if confidence is high, or wait for user?
            // User flow says: "Get Recommendations". Best to let user click.
        } catch (error) {
            alert("Error: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    // Step 2: Get Expert Analysis
    const getAnalysis = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${apiBase}/api/feature2/analyze`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    disease: result.class,
                    confidence: result.confidence
                })
            });

            if (!response.ok) throw new Error("Analysis failed");

            const data = await response.json();

            // Parse the nested JSON string in treatment_plan
            let parsedPlan = {};
            try {
                // Agent might strip/add markdown code blocks, clean it just in case
                let rawJson = data.treatment.replace(/```json/g, '').replace(/```/g, '').trim();
                parsedPlan = JSON.parse(rawJson);
            } catch (e) {
                console.error("Failed to parse plan", e);
                parsedPlan = { error: "Could not parse plan", severity: "Medium" }; // Default to Medium to show UI
            }

            let parsedSubsidy = null;
            try {
                if (data.subsidy && data.subsidy.trim().startsWith('{')) {
                    parsedSubsidy = JSON.parse(data.subsidy);
                } else {
                    parsedSubsidy = { schemes: [{ name: "General Advice", details: data.subsidy, benefits: "" }] };
                }
            } catch (e) {
                console.error("Failed to parse subsidy", e);
                parsedSubsidy = { schemes: [] };
            }

            setAnalysis({ ...data, parsedPlan, parsedSubsidy });

            // Fetch Experts from Database
            try {
                const expertsResponse = await fetch(`${apiBase}/api/feature2/agronomists?count=2`);
                if (expertsResponse.ok) {
                    const expertsData = await expertsResponse.json();
                    if (expertsData.agronomists && expertsData.agronomists.length > 0) {
                        setExperts(expertsData.agronomists);
                    } else {
                        // Fallback to static if API returns empty
                        setExperts(STATIC_AGRONOMISTS.slice(0, 2));
                    }
                } else {
                    // Fallback to static on error
                    setExperts(STATIC_AGRONOMISTS.slice(0, 2));
                }
            } catch (err) {
                console.error("Failed to fetch agronomists from DB:", err);
                // Fallback to static agronomists
                setExperts(STATIC_AGRONOMISTS.slice(0, 2));
            }

            // Initialize Chat with the Analysis Report
            setChatHistory([{
                role: 'ai',
                content: `**Diagnosis Complete:** ${result.class}\n\n${data.analysis}\n\nI am your AI Agronomist. Ask me anything about this diagnosis or treatment.`
            }]);

        } catch (error) {
            alert("Error: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    // Chat Functionality
    const handleChatSend = async () => {
        if (!chatInput.trim()) return;

        const userMsg = chatInput;
        setChatInput("");
        setChatHistory(prev => [...prev, { role: 'user', content: userMsg }]);
        setChatLoading(true);

        try {
            const response = await fetch(`${apiBase}/api/feature2/agent/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: userMsg,
                    state: { history: chatHistory },
                    context: {
                        disease: result?.class,
                        confidence: result?.confidence,
                        analysis: analysis?.analysis
                    }
                })
            });

            if (!response.ok) throw new Error("Chat failed");

            const data = await response.json();
            setChatHistory(prev => [...prev, { role: 'ai', content: data.response }]);

        } catch (error) {
            setChatHistory(prev => [...prev, { role: 'ai', content: "I'm having trouble connecting to the network." }]);
        } finally {
            setChatLoading(false);
        }
    };

    // Auto-scroll chat
    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [chatHistory]);

    // Helper to assign affordable prices
    const getPrice = (name) => {
        const n = name.toLowerCase();
        if (n.includes('neem')) return 250;
        if (n.includes('urea') || n.includes('npk')) return 300;
        if (n.includes('fungicide')) return 450;
        if (n.includes('pesticide')) return 550;
        if (n.includes('seeds')) return 180;
        // Hash the name to get a consistent pseudo-random price between 150 and 850
        let hash = 0;
        for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
        return 150 + (Math.abs(hash) % 700);
    };

    // Initialize Cart when Analysis arrives
    useEffect(() => {
        if (analysis?.parsedPlan?.treatment) {
            const formatItems = (items) => {
                if (!items) return [];
                const list = Array.isArray(items) ? items : [{ item: items, description: 'General Recommendation', usage: '-' }];
                return list.map(i => {
                    const itemName = i.item || i.name || "Treatment";
                    return { ...i, qty: 1, price: getPrice(itemName) };
                });
            };
            setCart({
                organic: formatItems(analysis.parsedPlan.treatment.organic),
                chemical: formatItems(analysis.parsedPlan.treatment.chemical)
            });
        }
    }, [analysis]);

    const updateQty = (type, index, delta) => {
        setCart(prev => ({
            ...prev,
            [type]: prev[type].map((item, i) =>
                i === index ? { ...item, qty: Math.max(1, (item.qty || 1) + delta) } : item
            )
        }));
    };

    const removeItem = (type, index) => {
        setCart(prev => ({
            ...prev,
            [type]: prev[type].filter((_, i) => i !== index)
        }));
    };

    const calculateTotal = () => {
        const orgTotal = cart.organic.reduce((sum, item) => sum + (item.price * item.qty), 0);
        const chemTotal = cart.chemical.reduce((sum, item) => sum + (item.price * item.qty), 0);
        return orgTotal + chemTotal;
    };

    const handleOrder = () => {
        // Collect all items from the cart with details
        const allItems = [
            ...cart.organic.map(i => ({ name: i.item || i.name, qty: i.qty, price: i.price })),
            ...cart.chemical.map(i => ({ name: i.item || i.name, qty: i.qty, price: i.price }))
        ].filter(i => i.name);

        if (allItems.length === 0) {
            alert("Cart is empty!");
            return;
        }

        // Agentic AI: "Adding items to your cart..."
        setOrderPlaced(true);

        // Construct URL for Farmer Mart
        // Format: items=Name:Qty:Price,...
        const itemsQuery = allItems.map(item =>
            `${encodeURIComponent(item.name.trim())}:${parseInt(item.qty)}:${parseInt(item.price)}`
        ).join(',');

        const marketplaceUrl = `https://farmer-mart-drab.vercel.app/cart?items=${itemsQuery}`;

        // Redirect after a short "processing" delay for effect
        setTimeout(() => {
            setOrderPlaced(false);
            window.open(marketplaceUrl, '_blank');
        }, 1500);
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-300">
            {/* Green Accent Bar */}
            <div className="h-1.5 bg-gradient-to-r from-organic-green-600 via-organic-green-500 to-organic-green-400" />

            {/* Header */}
            <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl overflow-hidden shadow-md">
                            <img src="/logo.png" alt="Logo" className="w-full h-full object-cover" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white leading-none">
                                ANNADATA<span className="text-organic-green font-extrabold">SAATHI</span>
                            </h1>
                            <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">{t('cropHealth.diagnosticCenter') || 'Crop Diagnostic Center'}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="hidden md:flex items-center gap-4 text-sm font-medium text-slate-600 dark:text-slate-400">
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                                <ThermometerSun size={16} className="text-orange-500" />
                                <span className="font-semibold">32°C</span>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                                <Droplets size={16} className="text-blue-500" />
                                <span className="font-semibold">65%</span>
                            </div>
                        </div>
                        <div className="h-8 w-px bg-slate-200 dark:bg-slate-700 hidden md:block"></div>
                        <button
                            onClick={() => window.location.reload()}
                            className="p-2.5 text-slate-500 hover:text-organic-green hover:bg-organic-green/10 rounded-lg transition-all"
                            title={t('cropHealth.resetSystem') || 'Reset System'}
                        >
                            <RefreshCw size={20} />
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                    {/* LEFT COLUMN: Camera & Input */}
                    <div className="lg:col-span-5 space-y-6">

                        {/* Camera Card */}
                        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                                <h2 className="font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                                    <Camera size={18} className="text-blue-600 dark:text-blue-500" />
                                    {t('cropHealth.imageAnalysis')}
                                </h2>
                                {result?.heatmap && (
                                    <button
                                        onClick={() => setShowHeatmap(!showHeatmap)}
                                        className={`text-xs font-medium px-3 py-1.5 rounded-full transition-all flex items-center gap-1.5 ${showHeatmap ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}
                                    >
                                        <ThermometerSun size={12} />
                                        {showHeatmap ? t('cropHealth.thermalView') : t('cropHealth.standardView')}
                                    </button>
                                )}
                            </div>

                            <div className="relative aspect-[4/3] bg-slate-100 dark:bg-black/50 overflow-hidden group">
                                {!image ? (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                                        {cameraError ? (
                                            <div className="max-w-xs mx-auto">
                                                <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                                    <AlertTriangle size={32} />
                                                </div>
                                                <p className="text-slate-900 dark:text-white font-medium mb-1">{t('cropHealth.cameraAccessFailed')}</p>
                                                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">{cameraError}</p>
                                                <button
                                                    onClick={() => setCameraError(null)}
                                                    className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                                                >
                                                    {t('cropHealth.retryConnection')}
                                                </button>
                                            </div>
                                        ) : (
                                            <>
                                                <Webcam
                                                    audio={false}
                                                    ref={webcamRef}
                                                    screenshotFormat="image/jpeg"
                                                    className="absolute inset-0 w-full h-full object-cover"
                                                    onUserMediaError={handleCameraError}
                                                />
                                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                                    <div className="w-48 h-48 border-2 border-white/30 rounded-lg relative">
                                                        <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-white"></div>
                                                        <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-white"></div>
                                                        <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-white"></div>
                                                        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-white"></div>
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                ) : (
                                    <>
                                        <img
                                            src={showHeatmap && result?.heatmap ? result.heatmap : image}
                                            alt="Crop Analysis"
                                            className="w-full h-full object-cover"
                                        />
                                        <button
                                            onClick={() => { setImage(null); setResult(null); setAnalysis(null); setShowHeatmap(false); }}
                                            className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/70 text-slate-900 dark:text-white rounded-full transition-colors backdrop-blur-sm"
                                        >
                                            <X size={16} />
                                        </button>
                                    </>
                                )}

                                {loading && (
                                    <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm flex flex-col items-center justify-center z-20">
                                        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                                        <p className="text-slate-900 dark:text-white font-medium animate-pulse">{t('cropHealth.processingCropData')}</p>
                                    </div>
                                )}
                            </div>

                            <div className="p-5 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
                                {!image ? (
                                    <div className="flex gap-4">
                                        <button
                                            onClick={capture}
                                            disabled={cameraError}
                                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-medium shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <Camera size={20} /> {t('cropHealth.capturePhoto')}
                                        </button>
                                        <label className="px-4 flex items-center justify-center bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl cursor-pointer transition-colors border border-transparent hover:border-slate-300 dark:hover:border-slate-600">
                                            <Upload size={20} />
                                            <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                                        </label>
                                    </div>
                                ) : (
                                    <div className="flex gap-4">
                                        {!result ? (
                                            <button
                                                onClick={runScan}
                                                className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-medium shadow-lg shadow-green-500/20 transition-all flex items-center justify-center gap-2"
                                            >
                                                <Activity size={20} /> {t('cropHealth.runDiagnostics')}
                                            </button>
                                        ) : (
                                            !analysis ? (
                                                <button
                                                    onClick={getAnalysis}
                                                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-slate-900 dark:text-white py-3 rounded-xl font-medium shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center gap-2"
                                                >
                                                    <FileText size={20} /> {t('cropHealth.getTreatmentPlan')}
                                                </button>
                                            ) : (
                                                <div className="flex-1 text-center text-sm text-green-600 dark:text-green-500 font-medium flex items-center justify-center gap-1.5 py-2">
                                                    <CheckCircle size={18} /> {t('cropHealth.analysisComplete')}
                                                </div>
                                            )
                                        )}
                                    </div>
                                )}

                                {/* Validation Badge */}
                                {result?.quality && (
                                    <div className={`mt-4 flex items-center gap-2 text-xs font-medium px-3 py-2 rounded-lg ${result.quality.valid ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400' : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'}`}>
                                        {result.quality.valid ? <CheckCircle size={14} /> : <AlertTriangle size={14} />}
                                        Quality Check: {result.quality.valid ? t('cropHealth.passed') : result.quality.message}
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>

                    {/* RIGHT COLUMN: Results & Insights */}
                    <div className="lg:col-span-7 space-y-6">

                        {!result ? (
                            // Empty State
                            <div className="h-full min-h-[400px] bg-slate-50 dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col items-center justify-center text-center p-8">
                                <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-full shadow-sm flex items-center justify-center mb-4">
                                    <Scan size={32} className="text-slate-700 dark:text-slate-300 dark:text-slate-600" />
                                </div>
                                <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300">{t('cropHealth.readyToAnalyze')}</h3>
                                <p className="text-slate-500 dark:text-slate-400 max-w-sm mt-1">{t('cropHealth.captureInstruction')}</p>
                            </div>
                        ) : (
                            <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">

                                {/* 1. Diagnosis Card */}
                                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row gap-8 items-center md:items-start">

                                    {/* Confidence Ring */}
                                    <div className="relative w-32 h-32 shrink-0">
                                        <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                                            <path className="text-slate-100 dark:text-slate-800" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
                                            <path
                                                className={result.class.includes('Healthy') ? "text-green-500" : "text-red-500"}
                                                strokeDasharray={`${result.confidence * 100}, 100`}
                                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="3"
                                                strokeLinecap="round"
                                            />
                                        </svg>
                                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                                            <span className="text-2xl font-bold text-slate-900 dark:text-white">{(result.confidence * 100).toFixed(0)}%</span>
                                            <span className="text-[10px] text-slate-500 uppercase font-medium">{t('cropHealth.certainty')}</span>
                                        </div>
                                    </div>

                                    <div className="flex-1 text-center md:text-left">
                                        <div className="mb-2">
                                            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{t('cropHealth.detectedCondition')}</span>
                                            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mt-1">{result.class}</h2>
                                        </div>
                                        <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed max-w-xl">
                                            Our AI model has identified visual patterns consistent with <strong>{result.class}</strong>.
                                            {analysis?.parsedPlan?.explanation && (
                                                <span className="block mt-2 italic border-l-2 border-slate-200 dark:border-slate-700 pl-3">
                                                    "{analysis.parsedPlan.explanation}"
                                                </span>
                                            )}
                                        </p>
                                    </div>
                                </div>

                                {/* 2. Analysis Content */}
                                {analysis && (
                                    <>
                                        {/* Severity & Forecast Row */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
                                                <h4 className="text-xs font-bold text-slate-500 uppercase mb-3">{t('cropHealth.severityAssessment')}</h4>
                                                <div className="flex items-center gap-3 mb-3">
                                                    <span className={`text-2xl font-bold ${analysis.parsedPlan.severity === 'High' ? 'text-red-600' : analysis.parsedPlan.severity === 'Medium' ? 'text-orange-500' : 'text-green-600'}`}>
                                                        {analysis.parsedPlan.severity || 'N/A'}
                                                    </span>
                                                    <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-xs font-medium text-slate-600 dark:text-slate-400">{t('cropHealth.riskLevel')}</span>
                                                </div>
                                                <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full transition-all duration-1000 ${analysis.parsedPlan.severity === 'High' ? 'bg-red-500 w-full' : analysis.parsedPlan.severity === 'Medium' ? 'bg-orange-500 w-2/3' : 'bg-green-500 w-1/3'}`}
                                                    ></div>
                                                </div>
                                            </div>

                                            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
                                                <h4 className="text-xs font-bold text-slate-500 uppercase mb-3">{t('cropHealth.recoveryForecast')}</h4>
                                                {analysis.parsedPlan.recovery_forecast ? (
                                                    <div className="space-y-4">
                                                        {/* Line Graph */}
                                                        <div className="relative h-32 flex items-end justify-between gap-2">
                                                            {/* Y-Axis Labels */}
                                                            <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-[10px] text-slate-600 dark:text-slate-400">
                                                                <span>100%</span>
                                                                <span>50%</span>
                                                                <span>0%</span>
                                                            </div>

                                                            {/* Graph Area */}
                                                            <div className="flex-1 ml-8 relative h-full">
                                                                {/* Grid Lines */}
                                                                <div className="absolute inset-0 flex flex-col justify-between">
                                                                    <div className="w-full h-px bg-slate-200 dark:bg-slate-700"></div>
                                                                    <div className="w-full h-px bg-slate-200 dark:bg-slate-700"></div>
                                                                    <div className="w-full h-px bg-slate-200 dark:bg-slate-700"></div>
                                                                </div>

                                                                {/* Line Graph with Points */}
                                                                <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
                                                                    {/* Recovery Line */}
                                                                    <polyline
                                                                        points={analysis.parsedPlan.recovery_forecast.map((val, i) => {
                                                                            const x = (i / (analysis.parsedPlan.recovery_forecast.length - 1)) * 100;
                                                                            const y = 100 - val;
                                                                            return `${x}%,${y}%`;
                                                                        }).join(' ')}
                                                                        fill="none"
                                                                        stroke="url(#recoveryGradient)"
                                                                        strokeWidth="3"
                                                                        strokeLinecap="round"
                                                                        strokeLinejoin="round"
                                                                        className="drop-shadow-md"
                                                                    />

                                                                    {/* Gradient Definition */}
                                                                    <defs>
                                                                        <linearGradient id="recoveryGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                                                            <stop offset="0%" stopColor="#ef4444" />
                                                                            <stop offset="50%" stopColor="#f59e0b" />
                                                                            <stop offset="100%" stopColor="#10b981" />
                                                                        </linearGradient>
                                                                    </defs>

                                                                    {/* Data Points */}
                                                                    {analysis.parsedPlan.recovery_forecast.map((val, i) => {
                                                                        const x = (i / (analysis.parsedPlan.recovery_forecast.length - 1)) * 100;
                                                                        const y = 100 - val;
                                                                        return (
                                                                            <circle
                                                                                key={i}
                                                                                cx={`${x}%`}
                                                                                cy={`${y}%`}
                                                                                r="5"
                                                                                fill={val < 30 ? '#ef4444' : val < 70 ? '#f59e0b' : '#10b981'}
                                                                                className="drop-shadow-lg animate-pulse"
                                                                            />
                                                                        );
                                                                    })}
                                                                </svg>

                                                                {/* Hover Tooltips */}
                                                                <div className="absolute inset-0 flex items-end justify-between">
                                                                    {analysis.parsedPlan.recovery_forecast.map((val, i) => (
                                                                        <div key={i} className="flex-1 flex flex-col items-center group">
                                                                            <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 dark:bg-slate-700 text-slate-900 dark:text-white text-[10px] px-2 py-1 rounded shadow-lg mb-1">
                                                                                {val}%
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* X-Axis Labels (Weeks) */}
                                                        <div className="flex items-center justify-between text-[10px] text-slate-600 dark:text-slate-400 px-2">
                                                            {analysis.parsedPlan.recovery_forecast.map((_, i) => (
                                                                <span key={i} className="flex-1 text-center font-medium">
                                                                    Week {i + 1}
                                                                </span>
                                                            ))}
                                                        </div>

                                                        {/* Recovery Status Indicator */}
                                                        <div className="flex items-center justify-center gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                                                            <div className="flex items-center gap-1.5 text-[10px]">
                                                                <span className="w-2 h-2 rounded-full bg-red-500"></span>
                                                                <span className="text-slate-500">Critical</span>
                                                            </div>
                                                            <div className="flex items-center gap-1.5 text-[10px]">
                                                                <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                                                                <span className="text-slate-500">Moderate</span>
                                                            </div>
                                                            <div className="flex items-center gap-1.5 text-[10px]">
                                                                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                                                <span className="text-slate-500">Healthy</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ) : <span className="text-sm text-slate-500">{t('cropHealth.noForecastData')}</span>}
                                            </div>
                                        </div>

                                        {/* Treatment Plan Wrapper */}
                                        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                                            <div className="p-5 border-b border-slate-200 dark:border-slate-800">
                                                <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                                    <FileText size={20} className="text-indigo-500" />
                                                    {t('cropHealth.recommendedTreatmentPlan')}
                                                </h3>
                                            </div>

                                            {/* Trust & Explainability Layer */}
                                            {analysis?.parsedPlan?.reason && (
                                                <div className="mx-6 mt-6 p-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/30 rounded-2xl">
                                                    <div className="flex items-center gap-2 mb-3">
                                                        <ShieldAlert size={16} className="text-indigo-600 dark:text-indigo-400" />
                                                        <h4 className="text-[10px] font-black text-indigo-700 dark:text-indigo-300 uppercase tracking-widest">Trust & Explainability Layer</h4>
                                                    </div>

                                                    <div className="space-y-3">
                                                        <div>
                                                            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-bold uppercase mb-1">Reason for Recommendation</p>
                                                            <p className="text-sm text-slate-800 dark:text-slate-200 italic leading-relaxed">
                                                                "{analysis.parsedPlan.reason}"
                                                            </p>
                                                        </div>

                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div>
                                                                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase mb-1">Data Source</p>
                                                                <p className="text-xs text-slate-800 dark:text-slate-100 font-medium">
                                                                    {analysis.parsedPlan.data_source || "Computer Vision Scan"}
                                                                </p>
                                                            </div>
                                                            <div>
                                                                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase mb-1">Last Updated</p>
                                                                <p className="text-xs text-slate-800 dark:text-slate-100 font-medium">
                                                                    {analysis.parsedPlan.last_updated ? new Date(analysis.parsedPlan.last_updated).toLocaleString() : "Real-time"}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        <div>
                                                            <div className="flex justify-between items-center mb-1">
                                                                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase">Confidence Level</p>
                                                                <span className="text-xs font-black text-indigo-600 dark:text-indigo-400">
                                                                    {Math.round((analysis.parsedPlan.confidence || result.confidence) * 100)}%
                                                                </span>
                                                            </div>
                                                            <div className="h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                                                                <div
                                                                    className="h-full bg-indigo-500 rounded-full transition-all duration-1000"
                                                                    style={{ width: `${(analysis.parsedPlan.confidence || result.confidence) * 100}%` }}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            <div className="p-6 space-y-8">
                                                {/* Organic Section */}
                                                {cart.organic.length > 0 && (
                                                    <div className="space-y-4">
                                                        <h4 className="text-sm font-bold text-green-700 dark:text-green-400 uppercase tracking-wide flex items-center gap-2">
                                                            <Leaf size={16} /> {t('cropHealth.organicSolutions')}
                                                        </h4>
                                                        <div className="overflow-x-auto">
                                                            <table className="w-full text-left">
                                                                <thead className="bg-slate-50 dark:bg-slate-800 text-xs text-slate-500 uppercase font-semibold">
                                                                    <tr>
                                                                        <th className="px-4 py-3 rounded-l-lg">Product / Action</th>
                                                                        <th className="px-4 py-3">Usage</th>
                                                                        <th className="px-4 py-3 text-center">Qty</th>
                                                                        <th className="px-4 py-3 rounded-r-lg text-right">Action</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                                                    {cart.organic.map((item, idx) => (
                                                                        <tr key={idx} className="text-sm text-slate-700 dark:text-slate-300">
                                                                            <td className="px-4 py-4 font-medium">
                                                                                {item.item || item.name}
                                                                                <div className="text-xs text-slate-500 font-normal mt-0.5">{item.description}</div>
                                                                            </td>
                                                                            <td className="px-4 py-4">{item.usage || "-"}</td>
                                                                            <td className="px-4 py-4 text-center">
                                                                                <div className="inline-flex items-center border border-slate-200 dark:border-slate-700 rounded-lg">
                                                                                    <button onClick={() => updateQty('organic', idx, -1)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-l-lg"><Minus size={12} /></button>
                                                                                    <span className="w-8 text-center text-xs font-semibold">{item.qty}</span>
                                                                                    <button onClick={() => updateQty('organic', idx, 1)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-r-lg"><Plus size={12} /></button>
                                                                                </div>
                                                                            </td>
                                                                            <td className="px-4 py-4 text-right">
                                                                                <button onClick={() => removeItem('organic', idx)} className="text-slate-600 dark:text-slate-400 hover:text-red-500 transition-colors">
                                                                                    <Trash2 size={16} />
                                                                                </button>
                                                                            </td>
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Chemical Section */}
                                                {cart.chemical.length > 0 && (
                                                    <div className="space-y-4">
                                                        <h4 className="text-sm font-bold text-red-700 dark:text-red-400 uppercase tracking-wide flex items-center gap-2">
                                                            <FlaskConical size={16} /> {t('cropHealth.chemicalSolutions')}
                                                        </h4>
                                                        <div className="overflow-x-auto">
                                                            <table className="w-full text-left">
                                                                <thead className="bg-slate-50 dark:bg-slate-800 text-xs text-slate-500 uppercase font-semibold">
                                                                    <tr>
                                                                        <th className="px-4 py-3 rounded-l-lg">Product / Action</th>
                                                                        <th className="px-4 py-3">Usage</th>
                                                                        <th className="px-4 py-3 text-center">Qty</th>
                                                                        <th className="px-4 py-3 rounded-r-lg text-right">Action</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                                                    {cart.chemical.map((item, idx) => (
                                                                        <tr key={idx} className="text-sm text-slate-700 dark:text-slate-300">
                                                                            <td className="px-4 py-4 font-medium">
                                                                                {item.item || item.name}
                                                                                <div className="text-xs text-slate-500 font-normal mt-0.5">{item.description}</div>
                                                                            </td>
                                                                            <td className="px-4 py-4">{item.usage || "-"}</td>
                                                                            <td className="px-4 py-4 text-center">
                                                                                <div className="inline-flex items-center border border-slate-200 dark:border-slate-700 rounded-lg">
                                                                                    <button onClick={() => updateQty('chemical', idx, -1)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-l-lg"><Minus size={12} /></button>
                                                                                    <span className="w-8 text-center text-xs font-semibold">{item.qty}</span>
                                                                                    <button onClick={() => updateQty('chemical', idx, 1)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-r-lg"><Plus size={12} /></button>
                                                                                </div>
                                                                            </td>
                                                                            <td className="px-4 py-4 text-right">
                                                                                <button onClick={() => removeItem('chemical', idx)} className="text-slate-600 dark:text-slate-400 hover:text-red-500 transition-colors">
                                                                                    <Trash2 size={16} />
                                                                                </button>
                                                                            </td>
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    </div>
                                                )}

                                                <button
                                                    onClick={handleOrder}
                                                    className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-slate-900 dark:text-white rounded-xl font-bold shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-3 transition-transform active:scale-[0.99]"
                                                >
                                                    <ShoppingCart size={20} />
                                                    {t('cropHealth.proceedToPurchase')}
                                                </button>
                                            </div>
                                        </div>

                                        {/* AI Chat Bot */}
                                        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden h-[500px] flex flex-col">
                                            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                                                        <Bot size={20} />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-slate-800 dark:text-white text-sm">{t('cropHealth.aiAgronomist')}</h4>
                                                        <p className="text-[10px] text-green-600 font-medium flex items-center gap-1">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span> {t('cropHealth.online')}
                                                        </p>
                                                    </div>
                                                </div>
                                                <button onClick={() => {
                                                    const lastMsg = chatHistory[chatHistory.length - 1]?.content;
                                                    if (lastMsg) {
                                                        const speech = new SpeechSynthesisUtterance(lastMsg.replace(/\*/g, ''));
                                                        window.speechSynthesis.speak(speech);
                                                    }
                                                }} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full text-slate-500 transition-colors">
                                                    <Volume2 size={18} />
                                                </button>
                                            </div>

                                            <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-950/50">
                                                {chatHistory.map((msg, idx) => (
                                                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                                        <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-tl-none shadow-sm'}`}>
                                                            {msg.content.replace(/\*\*/g, '')}
                                                        </div>
                                                    </div>
                                                ))}
                                                {chatLoading && (
                                                    <div className="flex justify-start">
                                                        <div className="bg-white dark:bg-slate-800 rounded-2xl rounded-tl-none px-4 py-3 border border-slate-200 dark:border-slate-700 shadow-sm flex gap-1.5">
                                                            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                                                            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                                                            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
                                                <div className="flex gap-2">
                                                    <input
                                                        type="text"
                                                        value={chatInput}
                                                        onChange={(e) => setChatInput(e.target.value)}
                                                        onKeyDown={(e) => e.key === 'Enter' && handleChatSend()}
                                                        placeholder={t('cropHealth.askPlaceholder')}
                                                        className="flex-1 bg-slate-100 dark:bg-slate-800 border-transparent focus:bg-white dark:focus:bg-slate-950 border focus:border-blue-500 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 outline-none transition-all"
                                                    />
                                                    <button
                                                        onClick={handleChatSend}
                                                        disabled={chatLoading || !chatInput.trim()}
                                                        className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white p-3 rounded-xl transition-colors shadow-lg shadow-blue-500/20"
                                                    >
                                                        <Send size={20} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Experts Section */}
                                        {experts.length > 0 && (
                                            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
                                                <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200 uppercase mb-4 flex items-center gap-2">
                                                    <Phone size={16} className="text-blue-500" />
                                                    {t('cropHealth.consultHumanExperts')}
                                                </h4>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    {experts.map((exp, i) => (
                                                        <div key={i} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700/50">
                                                            <div>
                                                                <div className="font-bold text-slate-900 dark:text-white text-sm">{exp.name}</div>
                                                                <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">{t('cropHealth.seniorConsultant')}</div>
                                                            </div>
                                                            <button
                                                                onClick={async (e) => {
                                                                    e.preventDefault();
                                                                    const btn = e.currentTarget;
                                                                    const originalContent = btn.innerHTML;
                                                                    btn.disabled = true;
                                                                    btn.innerHTML = '<span class="animate-spin mr-2">⏳</span> Calling...';
                                                                    try {
                                                                        const apiBase = import.meta.env.VITE_API_BASE_URL || 'https://let-go-3-0.onrender.com';
                                                                        const res = await fetch(`${apiBase}/api/feature3/consultation-call?to_number=${encodeURIComponent(exp.phone)}`, { method: 'POST' });
                                                                        const data = await res.json();

                                                                        if (data.status === 'called') {
                                                                            alert(`✅ Call Initiated!\n\nCalling ${exp.name} at ${exp.phone}.\nThe agronomist should receive the call shortly.`);
                                                                        } else if (data.status === 'mock_called') {
                                                                            const message = data.message || `Demo Mode: Consultation request sent to ${exp.name}`;
                                                                            const note = data.note ? `\n\n${data.note}` : '';
                                                                            alert(`${message}${note}`);
                                                                        } else {
                                                                            alert("❌ Call failed: " + (data.error || "Unknown error"));
                                                                        }
                                                                    } catch (e) {
                                                                        alert("Failed to connect to Twilio service.");
                                                                    } finally {
                                                                        btn.disabled = false;
                                                                        btn.innerHTML = originalContent;
                                                                    }
                                                                }}
                                                                className="px-3 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg text-xs font-bold hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors flex items-center gap-2"
                                                            >
                                                                <Phone size={14} /> {t('cropHealth.callNow')}
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Subsidy/Gov Info */}
                                        {analysis?.parsedSubsidy?.schemes?.length > 0 && (
                                            <div className="p-6 bg-indigo-50 dark:bg-indigo-900/10 rounded-2xl border border-indigo-100 dark:border-indigo-500/20">
                                                <h4 className="text-sm font-bold text-indigo-800 dark:text-indigo-300 uppercase mb-3 flex items-center gap-2">
                                                    <ShieldAlert size={16} /> {t('cropHealth.governmentSchemes')}
                                                </h4>
                                                <div className="space-y-3">
                                                    {analysis.parsedSubsidy.schemes.map((scheme, i) => (
                                                        <div key={i} className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-indigo-100 dark:border-indigo-500/20 shadow-sm">
                                                            <div className="flex items-start justify-between gap-3">
                                                                <div className="flex-1">
                                                                    <h5 className="font-bold text-indigo-900 dark:text-indigo-100 text-sm">{scheme.name}</h5>
                                                                    <p className="text-xs text-indigo-700 dark:text-indigo-300 mt-1">{scheme.details}</p>
                                                                    {scheme.benefits && <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-2 font-medium">✨ Benefit: {scheme.benefits}</p>}
                                                                </div>
                                                                {scheme.website_url ? (
                                                                    <a
                                                                        href={scheme.website_url}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="shrink-0 px-3 py-2 bg-indigo-100 dark:bg-indigo-900/30 hover:bg-indigo-200 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
                                                                    >
                                                                        Official Site
                                                                        <ExternalLink size={12} />
                                                                    </a>
                                                                ) : (
                                                                    <a
                                                                        href={`/schemes?search=${encodeURIComponent(scheme.name)}`}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="shrink-0 px-3 py-2 bg-indigo-100 dark:bg-indigo-900/30 hover:bg-indigo-200 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
                                                                    >
                                                                        View Details
                                                                        <ExternalLink size={12} />
                                                                    </a>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default CameraDiagnose;
