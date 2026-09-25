import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Mic, MicOff, Send, Search, Plus, Filter, RefreshCw,
    Wheat, Leaf, Wrench, DollarSign, Package, AlertTriangle,
    CheckCircle2, TrendingUp, ShoppingCart, Activity,
    Sun, Moon, ChevronDown, ChevronUp, MoreVertical,
    Trash2, ExternalLink, QrCode, X, Loader2, Copy, Check,
    Zap, Battery, Wifi, WifiOff, Clock, MapPin, Tag,
    ArrowUpRight, BarChart3, Shield, Eye
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useTranslation } from 'react-i18next';
import { localizeNumber, localizeCurrency, localizeItemName, geoLang } from '../utils/localize';

const CATEGORIES = [
    { key: 'all',        label: 'inv_category_all',       icon: Package,    color: 'text-slate-400',  bg: 'bg-slate-100 dark:bg-slate-800' },
    { key: 'produce',    label: 'inv_category_produce',   icon: Wheat,      color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
    { key: 'inputs',     label: 'inv_category_inputs',    icon: Leaf,       color: 'text-lime-500',   bg: 'bg-lime-50 dark:bg-lime-900/20' },
    { key: 'assets',     label: 'inv_category_assets',    icon: Wrench,     color: 'text-blue-500',   bg: 'bg-blue-50 dark:bg-blue-900/20' },
    { key: 'financials', label: 'inv_category_financials',icon: DollarSign, color: 'text-amber-500',  bg: 'bg-amber-50 dark:bg-amber-900/20' },
];

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://let-go-3-0.onrender.com';
const SCANNABLE_BASE = import.meta.env.VITE_PUBLIC_URL || (typeof window !== 'undefined' ? window.location.origin : '');

// Stock level is based on % of original quantity, not absolute value
function getStockLevel(pct) {
    if (pct <= 0) return 'empty';
    if (pct <= 15) return 'critical';
    if (pct <= 40) return 'warn';
    return 'good';
}
function getStockPct(item) {
    const qty = parseFloat(item.quantity || 0);
    const orig = parseFloat(item.original_quantity || item.available_quantity || item.quantity || qty);
    if (orig <= 0) return qty > 0 ? 100 : 0;
    return Math.min(100, Math.round((qty / orig) * 100));
}
const LEVEL_COLORS = {
    good:     { bar: 'bg-emerald-500', text: 'text-emerald-600', badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
    warn:     { bar: 'bg-amber-400',   text: 'text-amber-600',   badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
    critical: { bar: 'bg-red-500',     text: 'text-red-600',     badge: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
    empty:    { bar: 'bg-slate-300',   text: 'text-slate-500',   badge: 'bg-slate-100 text-slate-500' },
};

const MOCK_SENSORS = [
    { id: 1, name: 'NPK Sensor  Field A',   battery: 78, lastPing: '2 min ago', status: 'online', type: 'NPK' },
    { id: 2, name: 'Soil Moisture  Field B', battery: 42, lastPing: '8 min ago', status: 'online', type: 'Moisture' },
    { id: 3, name: 'pH Sensor  Greenhouse', battery: 12, lastPing: '1 hr ago',  status: 'warn',   type: 'pH' },
];

const SummaryCard = ({ icon: Icon, label, value, sub, accent, fieldMode }) => (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        className={`rounded-2xl p-5 border flex flex-col gap-2 ${fieldMode ? 'bg-black border-orange-500 text-white' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700/50'}`}>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${accent}`}>
            <Icon size={20} className="text-white" />
        </div>
        <div>
            <p className={`text-xs font-bold uppercase tracking-widest mb-1 ${fieldMode ? 'text-orange-400' : 'text-slate-500 dark:text-slate-400'}`}>{label}</p>
            <p className={`text-3xl font-black ${fieldMode ? 'text-white' : 'text-slate-900 dark:text-white'}`}>{value}</p>
            {sub && <p className={`text-xs mt-0.5 ${fieldMode ? 'text-orange-300' : 'text-slate-400'}`}>{sub}</p>}
        </div>
    </motion.div>
);

const CategoryBadge = ({ category }) => {
    const { t } = useTranslation();
    const cat = CATEGORIES.find(c => c.key === category) || CATEGORIES[0];
    const Icon = cat.icon;
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${cat.bg} ${cat.color}`}>
            <Icon size={10} />{t(cat.label, cat.key)}
        </span>
    );
};

const StockBar = ({ quantity, originalQty }) => {
    const { t, i18n } = useTranslation();
    const lang = i18n.language;
    const orig = originalQty > 0 ? originalQty : quantity;
    const pct = orig > 0 ? Math.min(100, Math.round((quantity / orig) * 100)) : 0;
    const level = getStockLevel(pct);
    return (
        <div className="space-y-1">
            <div className="flex justify-between items-center">
                <span className={`text-[10px] font-bold uppercase tracking-wider ${LEVEL_COLORS[level].text}`}>
                    {t(`inv_stock_${level}`, level)}
                </span>
                <span className="text-[10px] text-slate-500">{localizeNumber(pct, lang)}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.6, ease: 'easeOut' }}
                    className={`h-full rounded-full ${LEVEL_COLORS[level].bar}`} />
            </div>
        </div>
    );
};

const SensorCard = ({ sensor, fieldMode }) => {
    const { i18n } = useTranslation();
    const lang = i18n.language;
    const batteryColor = sensor.battery <= 15 ? 'text-red-500' : sensor.battery <= 40 ? 'text-amber-500' : 'text-emerald-500';
    return (
        <div className={`rounded-xl p-4 border flex flex-col gap-3 ${fieldMode ? 'bg-black border-orange-500' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700/50'}`}>
            <div className="flex items-center justify-between">
                <span className={`text-xs font-bold ${fieldMode ? 'text-orange-400' : 'text-slate-500'}`}>{sensor.type}</span>
                <span className={`w-2 h-2 rounded-full animate-pulse ${sensor.status === 'online' ? 'bg-emerald-500' : sensor.status === 'warn' ? 'bg-amber-400' : 'bg-red-500'}`} />
            </div>
            <p className={`text-sm font-semibold leading-tight ${fieldMode ? 'text-white' : 'text-slate-800 dark:text-white'}`}>{sensor.name}</p>
            <div className="flex items-center justify-between text-xs">
                <span className={`flex items-center gap-1 font-bold ${batteryColor}`}><Battery size={12} />{localizeNumber(sensor.battery, lang)}%</span>
                <span className={`flex items-center gap-1 ${fieldMode ? 'text-orange-300' : 'text-slate-400'}`}><Clock size={10} />{sensor.lastPing}</span>
            </div>
            <div className="h-1 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                <div className={`h-full rounded-full ${batteryColor.replace('text-', 'bg-')}`} style={{ width: `${sensor.battery}%` }} />
            </div>
        </div>
    );
};

const FarmerInventory = () => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const routerLocation = useLocation();

    const [farmerId, setFarmerId] = useState('70adcaac-b6c7-4b08-bf0a-4012c0cf3191');

    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (userData) {
            try {
                const parsed = JSON.parse(userData);
                const id = parsed.id || parsed.user_id;
                if (id) setFarmerId(id);
            } catch (e) { /* keep fallback */ }
        }
    }, [routerLocation]);

    const [inventory, setInventory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [synced, setSynced] = useState(true);
    const [activeCategory, setActiveCategory] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [locationFilter, setLocationFilter] = useState('all');
    const [fieldMode, setFieldMode] = useState(false);
    const [sensorOpen, setSensorOpen] = useState(false);
    const [qrBatch, setQrBatch] = useState(null);
    const [qrCopied, setQrCopied] = useState(false);
    const [inputText, setInputText] = useState('');
    const [listening, setListening] = useState(false);
    const [voiceParsing, setVoiceParsing] = useState(false);
    const [parsedItem, setParsedItem] = useState(null);
    const [parseError, setParseError] = useState('');
    const [addingItem, setAddingItem] = useState(false);
    const [openMenu, setOpenMenu] = useState(null);
    const [currentLocation, setCurrentLocation] = useState('');
    const recognitionRef = useRef(null);

    const CACHE_KEY = `inv_cache_${farmerId}`;
    const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

    const readCache = useCallback(() => {
        try {
            const raw = localStorage.getItem(CACHE_KEY);
            if (!raw) return null;
            const { data, ts } = JSON.parse(raw);
            if (Date.now() - ts < CACHE_TTL) return data;
        } catch { /* ignore */ }
        return null;
    }, [CACHE_KEY]);

    const writeCache = useCallback((data) => {
        try { localStorage.setItem(CACHE_KEY, JSON.stringify({ data, ts: Date.now() })); } catch { /* ignore */ }
    }, [CACHE_KEY]);

    useEffect(() => {
        // Show cached data immediately (no loading flash)
        const cached = readCache();
        if (cached) {
            setInventory(cached);
            setLoading(false);
        } else {
            fetchInventory();
        }

        const channel = supabase
            .channel('inv-v2-changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'inventory', filter: `farmer_id=eq.${farmerId}` }, payload => {
                setInventory(prev => {
                    let next;
                    if (payload.eventType === 'INSERT') next = [payload.new, ...prev];
                    else if (payload.eventType === 'UPDATE') next = prev.map(i => i.id === payload.new.id ? payload.new : i);
                    else if (payload.eventType === 'DELETE') next = prev.filter(i => i.id !== payload.old.id);
                    else next = prev;
                    writeCache(next); // keep cache in sync with realtime changes
                    return next;
                });
            })
            .subscribe(status => setSynced(status === 'SUBSCRIBED'));
        return () => { supabase.removeChannel(channel); };
    }, [farmerId]);

    const fetchInventory = async (force = false) => {
        if (!force) {
            const cached = readCache();
            if (cached) { setInventory(cached); setLoading(false); return; }
        }
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/api/feature6/list/${farmerId}`);
            const data = await res.json();
            const list = Array.isArray(data) ? data : [];
            setInventory(list);
            writeCache(list);
        } catch (e) {
            console.error('Inventory fetch error:', e);
            setSynced(false);
        } finally {
            setLoading(false);
        }
    };

    const stats = useMemo(() => {
        const totalValue = inventory.reduce((acc, i) => acc + ((i.quantity || 0) * (i.price_per_quintal || 0)), 0);
        const criticalLows = inventory.filter(i => { const l = getStockLevel(getStockPct(i)); return l === 'critical' || l === 'empty'; }).length;
        const readyForSale = inventory.filter(i => i.status === 'ready_for_sale' || i.status === 'listed').length;
        const upcomingMaint = MOCK_SENSORS.filter(s => s.battery <= 15).length;
        return { totalValue, criticalLows, readyForSale, upcomingMaint };
    }, [inventory]);

    const locations = useMemo(() => [...new Set(inventory.map(i => i.location).filter(Boolean))], [inventory]);

    const filtered = useMemo(() => inventory.filter(item => {
        const name = (item.item_name || item.crop_name || '').toLowerCase();
        const matchCat = activeCategory === 'all' || (item.category || 'produce') === activeCategory;
        const matchSearch = !searchTerm || name.includes(searchTerm.toLowerCase()) || (item.batch_id || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchLoc = locationFilter === 'all' || item.location === locationFilter;
        return matchCat && matchSearch && matchLoc;
    }), [inventory, activeCategory, searchTerm, locationFilter]);

    const setupRecognition = useCallback(() => {
        const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRec) return null;
        const rec = new SpeechRec();
        rec.continuous = false;
        rec.interimResults = true;
        const lang = i18n.language;
        rec.lang = lang === 'hi' ? 'hi-IN' : lang === 'mr' ? 'mr-IN' : 'en-IN';
        return rec;
    }, [i18n.language]);

    const startListening = () => {
        setParseError(''); setParsedItem(null);
        const rec = setupRecognition();
        if (!rec) { setParseError(t('voice_not_supported', 'Voice not supported in this browser.')); return; }
        recognitionRef.current = rec;
        rec.onresult = (e) => {
            let transcript = '';
            for (let i = e.resultIndex; i < e.results.length; i++) transcript += e.results[i][0].transcript;
            setInputText(transcript);
        };
        rec.onerror = () => { setListening(false); setParseError(t('voice_error', 'Error listening. Please try again.')); };
        rec.onend = () => setListening(false);
        rec.start();
        setListening(true);
    };

    const stopListening = () => { recognitionRef.current?.stop(); setListening(false); };

    const handleSubmitInput = async () => {
        const text = inputText.trim();
        if (!text) return;
        setVoiceParsing(true); setParseError(''); setParsedItem(null);
        try {
            const res = await fetch(`${API_BASE}/api/feature6/parse-voice`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text, language: i18n.language || 'en' }),
            });
            const data = await res.json();
            if (data.success && data.parsed) setParsedItem(data.parsed);
            else setParseError(data.error || t('inv_parse_error', 'Could not understand. Please rephrase and try again.'));
        } catch (e) {
            setParseError(t('inv_parse_error', 'Could not understand. Please rephrase and try again.'));
        } finally { setVoiceParsing(false); }
    };

    const handleConfirmAdd = async () => {
        if (!parsedItem) return;
        setAddingItem(true);
        try {
            const res = await fetch(`${API_BASE}/api/feature6/add-item`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    farmer_id: farmerId,
                    item_name: parsedItem.item_name,
                    quantity: parsedItem.quantity,
                    unit: parsedItem.unit,
                    category: parsedItem.category,
                    price_per_unit: parsedItem.estimated_price_per_unit || 0,
                    location: (parsedItem.location && parsedItem.location !== 'Unknown') ? parsedItem.location : (currentLocation || 'Unknown'),
                }),
            });
            const data = await res.json();
            if (data.success) {
                setInventory(p => { const next = [data.data, ...p]; writeCache(next); return next; });
                setParsedItem(null); setInputText('');
            }
            else setParseError(t('inv_add_failed', 'Failed to add item. Please try again.'));
        } catch (e) { setParseError(t('inv_add_failed', 'Failed to add item. Please try again.')); }
        finally { setAddingItem(false); }
    };

    const handleMarkForSale = async (batchId) => {
        try {
            await fetch(`${API_BASE}/api/feature6/batch/update-status`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ batch_id: batchId, status: 'ready_for_sale' }),
            });
            setInventory(p => p.map(i => i.batch_id === batchId ? { ...i, status: 'ready_for_sale' } : i));
        } catch (e) { console.error(e); }
    };

    const handleCopyQr = (batchId) => {
        navigator.clipboard.writeText(`${SCANNABLE_BASE}/product-transparency/${batchId}`);
        setQrCopied(true); setTimeout(() => setQrCopied(false), 2000);
    };

    const fetchLocation = useCallback(() => {
        if (!navigator.geolocation) return;
        navigator.geolocation.getCurrentPosition(
            async ({ coords }) => {
                try {
                    const r = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?lat=${coords.latitude}&lon=${coords.longitude}&format=json`,
                        { headers: { 'Accept-Language': geoLang(i18n.language) } }
                    );
                    const geo = await r.json();
                    const a = geo.address || {};
                    const place = a.village || a.suburb || a.town || a.city || a.county || a.state_district || a.state || '';
                    setCurrentLocation(place || `${coords.latitude.toFixed(3)}°N, ${coords.longitude.toFixed(3)}°E`);
                } catch {
                    setCurrentLocation(`${coords.latitude.toFixed(3)}°N, ${coords.longitude.toFixed(3)}°E`);
                }
            },
            () => {} // permission denied — stay empty
        );
    }, []);

    useEffect(() => { fetchLocation(); }, [fetchLocation]);

    const toggleMenu = (id) => setOpenMenu(prev => prev === id ? null : id);

    const fm = fieldMode ? 'bg-black text-white' : 'bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white';

    return (
        <div className={`min-h-screen ${fm} transition-colors duration-500 pt-20 pb-16`}>
            <div className="max-w-7xl mx-auto px-4 md:px-8 space-y-8">

                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <div className={`w-8 h-[2px] ${fieldMode ? 'bg-orange-500' : 'bg-emerald-500'}`} />
                            <span className={`text-[10px] font-black uppercase tracking-[0.35em] ${fieldMode ? 'text-orange-400' : 'text-emerald-500'}`}>
                                {t('inv_annadata_vault', 'Annadata Smart Vault')}
                            </span>
                        </div>
                        <h1 className={`text-4xl md:text-5xl font-black uppercase tracking-tighter leading-none ${fieldMode ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                            {t('inv_smart', 'Smart')}{' '}
                            <span className={fieldMode ? 'text-orange-500' : 'text-emerald-500'}>{t('inv_inventory_label', 'Inventory')}</span>
                        </h1>
                        <p className={`text-sm ${fieldMode ? 'text-orange-300' : 'text-slate-500 dark:text-slate-400'}`}>
                            {t('inv_subtitle', 'Voice-powered multilingual farm stock management')}
                        </p>
                        {currentLocation && (
                            <p className={`text-xs flex items-center gap-1 mt-0.5 ${fieldMode ? 'text-orange-400/70' : 'text-slate-400 dark:text-slate-500'}`}>
                                <MapPin size={11} />{currentLocation}
                            </p>
                        )}
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                        <span className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full ${synced ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-100 text-red-600'}`}>
                            {synced ? <Wifi size={12} /> : <WifiOff size={12} />}
                            {synced ? t('inv_synced', 'Live') : t('inv_offline', 'Offline')}
                        </span>
                        <button onClick={() => setFieldMode(f => !f)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold border transition-all ${fieldMode ? 'bg-orange-500 text-black border-orange-500' : 'border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-orange-400'}`}>
                            {fieldMode ? <Moon size={13} /> : <Sun size={13} />}
                            {fieldMode ? t('inv_field_off', 'Exit Field Mode') : t('inv_field_mode', 'Field Mode')}
                        </button>
                        <button onClick={() => fetchInventory(true)}
                            title="Force refresh from server"
                            className={`p-2 rounded-full border transition-all ${fieldMode ? 'border-orange-500 text-orange-400 hover:bg-orange-500/10' : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
                        </button>
                    </div>
                </div>

                {/* Smart Input Bar */}
                <div className="space-y-3">
                    <div className={`relative flex items-center rounded-2xl border-2 transition-all overflow-hidden ${
                        listening
                            ? (fieldMode ? 'border-orange-500 shadow-lg shadow-orange-500/20' : 'border-emerald-500 shadow-lg shadow-emerald-500/20')
                            : (fieldMode ? 'border-orange-500/40 bg-black' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900')
                    }`}>
                        {listening && (
                            <motion.div className={`absolute inset-0 ${fieldMode ? 'bg-orange-500/5' : 'bg-emerald-500/5'}`}
                                animate={{ opacity: [0.3, 0.8, 0.3] }} transition={{ duration: 1.5, repeat: Infinity }} />
                        )}
                        <div className={`pl-4 pr-2 ${fieldMode ? 'text-orange-400' : 'text-slate-400'}`}>
                            {voiceParsing ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
                        </div>
                        <input type="text" value={inputText} onChange={e => setInputText(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleSubmitInput()}
                            placeholder={t('inv_voice_placeholder', '"I have 20 kg potato" or "50 bags of urea"...')}
                            className={`flex-1 py-4 text-base bg-transparent outline-none placeholder:text-sm ${fieldMode ? 'text-white placeholder-orange-400/50 text-lg' : 'text-slate-900 dark:text-white placeholder-slate-400'}`} />
                        {inputText && (
                            <button onClick={() => { setInputText(''); setParsedItem(null); setParseError(''); }}
                                className={`p-2 ${fieldMode ? 'text-orange-400' : 'text-slate-400'}`}><X size={16} /></button>
                        )}
                        <button onClick={listening ? stopListening : startListening}
                            className={`mx-1 p-3 rounded-xl transition-all active:scale-95 ${listening ? 'bg-red-500 text-white shadow-md' : fieldMode ? 'bg-orange-500/20 text-orange-400 hover:bg-orange-500/30' : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100'}`}>
                            {listening ? <MicOff size={18} /> : <Mic size={18} />}
                        </button>
                        <button onClick={handleSubmitInput} disabled={!inputText.trim() || voiceParsing}
                            className={`mr-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95 disabled:opacity-40 ${fieldMode ? 'bg-orange-500 text-black hover:bg-orange-400' : 'bg-emerald-500 text-white hover:bg-emerald-600'}`}>
                            {voiceParsing ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                        </button>
                    </div>

                    {/* Language chips */}
                    <div className="flex gap-2 flex-wrap items-center">
                        {[
                            { code: 'en', label: 'English',  ex: 'I have 50 kg wheat' },
                            { code: 'hi', label: 'हिंदी',   ex: 'मेरे पास 20 किलो आलू है' },
                            { code: 'mr', label: 'मराठी',   ex: 'माझ्याकडे 5 लिटर कीटकनाशक आहे' },
                        ].map(lang => (
                            <button key={lang.code} onClick={() => { i18n.changeLanguage(lang.code); setInputText(lang.ex); }}
                                className={`text-[11px] px-3 py-1 rounded-full border font-medium transition-all ${i18n.language === lang.code
                                    ? (fieldMode ? 'bg-orange-500 text-black border-orange-500' : 'bg-emerald-500 text-white border-emerald-500')
                                    : (fieldMode ? 'border-orange-500/30 text-orange-300 hover:border-orange-500' : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-emerald-300')}`}>
                                {lang.label}
                            </button>
                        ))}
                        <span className={`text-[11px] ${fieldMode ? 'text-orange-400/60' : 'text-slate-400'}`}> {t('inv_tap_language', 'tap to try an example')}</span>
                    </div>

                    {/* Parse error */}
                    <AnimatePresence>
                        {parseError && (
                            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 rounded-xl">
                                <AlertTriangle size={15} />{parseError}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Parsed confirmation card */}
                    <AnimatePresence>
                        {parsedItem && (
                            <motion.div initial={{ opacity: 0, y: -8, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8 }}
                                className={`rounded-2xl border-2 p-4 ${fieldMode ? 'bg-black border-orange-500' : 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-300 dark:border-emerald-700'}`}>
                                <div className="flex items-start justify-between gap-4 flex-wrap">
                                    <div className="space-y-1">
                                        <p className={`text-[11px] font-black uppercase tracking-widest ${fieldMode ? 'text-orange-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                            {t('inv_ai_found', 'AI Found  Confirm to Add')}
                                        </p>
                                        <p className={`text-xl font-black ${fieldMode ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                                            {localizeNumber(parsedItem.quantity, i18n.language)} {parsedItem.unit}  {localizeItemName(parsedItem.item_name, i18n.language)}
                                        </p>
                                        <div className="flex items-center gap-2 flex-wrap mt-1">
                                            <CategoryBadge category={parsedItem.category} />
                                            {parsedItem.location && parsedItem.location !== 'Unknown' && (
                                                <span className={`text-[11px] flex items-center gap-1 ${fieldMode ? 'text-orange-300' : 'text-slate-500'}`}><MapPin size={10} />{parsedItem.location}</span>
                                            )}
                                            {parsedItem.estimated_price_per_unit > 0 && (
                                                <span className={`text-[11px] ${fieldMode ? 'text-orange-300' : 'text-slate-500'}`}>{localizeCurrency(parsedItem.estimated_price_per_unit, i18n.language)}/{parsedItem.unit}</span>
                                            )}
                                            <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${parsedItem.confidence >= 0.85 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-amber-100 text-amber-700'}`}>
                                                {localizeNumber(Math.round(parsedItem.confidence * 100), i18n.language)}% {t('inv_confidence', 'confidence')}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 flex-shrink-0">
                                        <button onClick={() => { setParsedItem(null); setInputText(''); }}
                                            className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all ${fieldMode ? 'border-orange-500/40 text-orange-300 hover:bg-orange-500/10' : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                                            {t('inv_cancel', 'Cancel')}
                                        </button>
                                        <button onClick={handleConfirmAdd} disabled={addingItem}
                                            className={`px-5 py-2 rounded-xl text-sm font-bold flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-60 ${fieldMode ? 'bg-orange-500 text-black hover:bg-orange-400' : 'bg-emerald-500 text-white hover:bg-emerald-600'}`}>
                                            {addingItem ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                                            {t('inv_confirm_add', 'Add to Inventory')}
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <SummaryCard icon={DollarSign} label={t('inv_total_value', 'Total Stock Value')} value={`${localizeCurrency(Math.round(stats.totalValue / 1000), i18n.language)}K`} sub={t('inv_all_categories', 'All categories')} accent="bg-emerald-500" fieldMode={fieldMode} />
                    <SummaryCard icon={AlertTriangle} label={t('inv_critical_lows', 'Critical Lows')} value={stats.criticalLows} sub={t('inv_need_reorder', 'Need reorder')} accent={stats.criticalLows > 0 ? 'bg-red-500' : 'bg-slate-400'} fieldMode={fieldMode} />
                    <SummaryCard icon={ShoppingCart} label={t('inv_ready_for_sale', 'Ready for Sale')} value={stats.readyForSale} sub={t('inv_items', 'Items listed')} accent="bg-blue-500" fieldMode={fieldMode} />
                    <SummaryCard icon={Activity} label={t('inv_maintenance', 'Maintenance Alerts')} value={stats.upcomingMaint} sub={t('inv_sensors', 'Low battery sensors')} accent={stats.upcomingMaint > 0 ? 'bg-amber-500' : 'bg-slate-400'} fieldMode={fieldMode} />
                </div>

                {/* Main layout: sidebar + grid */}
                <div className="flex gap-6">

                    {/* Desktop Sidebar */}
                    <aside className="hidden lg:flex flex-col gap-6 w-52 flex-shrink-0">
                        <div className="space-y-1">
                            <p className={`text-[10px] font-black uppercase tracking-widest mb-3 ${fieldMode ? 'text-orange-400' : 'text-slate-400'}`}>{t('inv_categories', 'Categories')}</p>
                            {CATEGORIES.map(cat => {
                                const Icon = cat.icon;
                                const count = cat.key === 'all' ? inventory.length : inventory.filter(i => (i.category || 'produce') === cat.key).length;
                                return (
                                    <button key={cat.key} onClick={() => setActiveCategory(cat.key)}
                                        className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all text-left ${
                                            activeCategory === cat.key
                                                ? (fieldMode ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40' : `${cat.bg} ${cat.color}`)
                                                : (fieldMode ? 'text-orange-300/60 hover:text-orange-300 hover:bg-orange-500/10' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800')
                                        }`}>
                                        <Icon size={15} />
                                        <span className="flex-1">{t(cat.label, cat.key)}</span>
                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${fieldMode ? 'bg-orange-500/20 text-orange-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>{localizeNumber(count, i18n.language)}</span>
                                    </button>
                                );
                            })}
                        </div>
                        {locations.length > 0 && (
                            <div className="space-y-2">
                                <p className={`text-[10px] font-black uppercase tracking-widest ${fieldMode ? 'text-orange-400' : 'text-slate-400'}`}>{t('inv_location', 'Storage Location')}</p>
                                <select value={locationFilter} onChange={e => setLocationFilter(e.target.value)}
                                    className={`w-full text-sm px-3 py-2 rounded-xl border outline-none ${fieldMode ? 'bg-black border-orange-500/40 text-orange-300' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200'}`}>
                                    <option value="all">{t('inv_all_locations', 'All Locations')}</option>
                                    {locations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                                </select>
                            </div>
                        )}
                        <button onClick={() => navigate('/add-batch')}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold w-full transition-all ${fieldMode ? 'bg-orange-500 text-black hover:bg-orange-400' : 'bg-emerald-500 text-white hover:bg-emerald-600'}`}>
                            <Plus size={15} />{t('inv_add_batch', 'Register Batch')}
                        </button>
                    </aside>

                    {/* Inventory content */}
                    <div className="flex-1 min-w-0 space-y-4">

                        {/* Mobile category chips */}
                        <div className="flex lg:hidden items-center gap-2 overflow-x-auto pb-1">
                            {CATEGORIES.map(cat => {
                                const Icon = cat.icon;
                                return (
                                    <button key={cat.key} onClick={() => setActiveCategory(cat.key)}
                                        className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${activeCategory === cat.key ? (fieldMode ? 'bg-orange-500 text-black' : `${cat.bg} ${cat.color}`) : (fieldMode ? 'border border-orange-500/30 text-orange-300' : 'border border-slate-200 dark:border-slate-700 text-slate-500')}`}>
                                        <Icon size={12} />{t(cat.label, cat.key)}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Search bar */}
                        <div className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border ${fieldMode ? 'bg-black border-orange-500/40' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700'}`}>
                            <Search size={15} className={fieldMode ? 'text-orange-400' : 'text-slate-400'} />
                            <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                                placeholder={t('inv_search_placeholder', 'Search by name or batch ID...')}
                                className={`flex-1 text-sm bg-transparent outline-none ${fieldMode ? 'text-white placeholder-orange-400/50' : 'placeholder-slate-400 text-slate-900 dark:text-white'}`} />
                            {searchTerm && <button onClick={() => setSearchTerm('')}><X size={14} className={fieldMode ? 'text-orange-400' : 'text-slate-400'} /></button>}
                        </div>

                        {loading && (
                            <div className="flex justify-center items-center py-16">
                                <Loader2 size={32} className={`animate-spin ${fieldMode ? 'text-orange-500' : 'text-emerald-500'}`} />
                            </div>
                        )}

                        {!loading && filtered.length === 0 && (
                            <div className={`text-center py-20 rounded-2xl border-2 border-dashed ${fieldMode ? 'border-orange-500/30 text-orange-300' : 'border-slate-200 dark:border-slate-700 text-slate-400'}`}>
                                <Package size={40} className="mx-auto mb-3 opacity-40" />
                                <p className="font-bold">{t('inv_empty_title', 'No items found')}</p>
                                <p className="text-sm mt-1">{t('inv_empty_sub', 'Use the input bar above or Register Batch to add inventory.')}</p>
                            </div>
                        )}

                        {!loading && filtered.length > 0 && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                                <AnimatePresence mode="popLayout">
                                    {filtered.map((item, idx) => {
                                        const category = item.category || 'produce';
                                        const cat = CATEGORIES.find(c => c.key === category) || CATEGORIES[1];
                                        const Icon = cat.icon;
                                        const nameRaw = item.item_name || item.crop_name || 'Unknown';
                        const name = localizeItemName(nameRaw, i18n.language);
                                        const qty = parseFloat(item.quantity || 0);
                                        const unit = item.unit || 'qtl';
                                        const price = parseFloat(item.price_per_quintal || 0);
                                        const pct = getStockPct(item);
                                        const level = getStockLevel(pct);
                                        const lvlColor = LEVEL_COLORS[level];
                                        return (
                                            <motion.div key={item.id || item.batch_id || idx} layout
                                                initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.2, delay: idx * 0.03 }}
                                                className={`relative rounded-2xl border p-4 flex flex-col gap-3 transition-all ${fieldMode ? 'bg-black border-orange-500/30 hover:border-orange-500' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700/50 hover:border-emerald-300 dark:hover:border-emerald-700'}`}>
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1 min-w-0">
                                                        <CategoryBadge category={category} />
                                                        <p className={`text-lg font-black mt-1.5 truncate leading-tight ${fieldMode ? 'text-white' : 'text-slate-900 dark:text-white'}`}>{name}</p>
                                                        {item.variety && <p className={`text-xs ${fieldMode ? 'text-orange-300/60' : 'text-slate-400'}`}>{item.variety}</p>}
                                                    </div>
                                                    <div className="relative flex-shrink-0">
                                                        <button onClick={() => toggleMenu(item.batch_id)}
                                                            className={`p-1.5 rounded-lg ${fieldMode ? 'text-orange-400 hover:bg-orange-500/10' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                                                            <MoreVertical size={16} />
                                                        </button>
                                                        <AnimatePresence>
                                                            {openMenu === item.batch_id && (
                                                                <motion.div initial={{ opacity: 0, scale: 0.9, y: -4 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }}
                                                                    className={`absolute right-0 top-8 w-44 rounded-xl border shadow-xl z-20 overflow-hidden ${fieldMode ? 'bg-black border-orange-500/50' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700'}`}>
                                                                    {category === 'produce' && item.status !== 'ready_for_sale' && (
                                                                        <button onClick={() => { handleMarkForSale(item.batch_id); toggleMenu(null); }}
                                                                            className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm ${fieldMode ? 'text-orange-300 hover:bg-orange-500/10' : 'text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'}`}>
                                                                            <ShoppingCart size={13} />{t('inv_mark_for_sale', 'Mark for Sale')}
                                                                        </button>
                                                                    )}
                                                                    {category === 'produce' && (
                                                                        <button onClick={() => { setQrBatch(item); toggleMenu(null); }}
                                                                            className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm ${fieldMode ? 'text-orange-300 hover:bg-orange-500/10' : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                                                                            <QrCode size={13} />{t('inv_view_qr', 'View QR / Blockchain')}
                                                                        </button>
                                                                    )}
                                                                    <button onClick={() => { navigate(`/product-transparency/${item.batch_id}`); toggleMenu(null); }}
                                                                        className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm ${fieldMode ? 'text-orange-300 hover:bg-orange-500/10' : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                                                                        <Eye size={13} />{t('inv_view_details', 'View Details')}
                                                                    </button>
                                                                </motion.div>
                                                            )}
                                                        </AnimatePresence>
                                                    </div>
                                                </div>
                                                <div className={`grid grid-cols-2 gap-2 text-sm rounded-xl p-3 ${fieldMode ? 'bg-orange-500/5 border border-orange-500/20' : 'bg-slate-50 dark:bg-slate-800/50'}`}>
                                                    <div>
                                                        <p className={`text-[10px] font-bold uppercase tracking-wider mb-0.5 ${fieldMode ? 'text-orange-400/70' : 'text-slate-400'}`}>{t('inv_quantity', 'Quantity')}</p>
                                                        <p className={`font-black text-base ${fieldMode ? 'text-white' : 'text-slate-900 dark:text-white'}`}>{localizeNumber(qty, i18n.language)} <span className="text-xs font-normal opacity-60">{unit}</span></p>
                                                    </div>
                                                    <div>
                                                        <p className={`text-[10px] font-bold uppercase tracking-wider mb-0.5 ${fieldMode ? 'text-orange-400/70' : 'text-slate-400'}`}>{t('inv_price', 'Price')}</p>
                                                        <p className={`font-black text-base ${fieldMode ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                                                            {price > 0 ? localizeCurrency(price, i18n.language) : '—'}
                                                            {price > 0 && <span className="text-xs font-normal opacity-60">/{unit}</span>}
                                                        </p>
                                                    </div>
                                                    {item.location && (
                                                        <div className="col-span-2">
                                                            <p className={`text-[10px] font-bold uppercase tracking-wider mb-0.5 ${fieldMode ? 'text-orange-400/70' : 'text-slate-400'}`}>{t('inv_location', 'Location')}</p>
                                                            <p className={`text-xs flex items-center gap-1 ${fieldMode ? 'text-orange-300' : 'text-slate-600 dark:text-slate-300'}`}><MapPin size={10} />{item.location}</p>
                                                        </div>
                                                    )}
                                                </div>
                                                <StockBar quantity={qty} originalQty={parseFloat(item.original_quantity || item.available_quantity || qty)} />
                                                <div className="flex items-center justify-between gap-2">
                                                    <span className={`text-[10px] px-2 py-1 rounded-full font-bold uppercase tracking-wide ${lvlColor.badge}`}>
                                                        {item.status ? t(`inv_status_${item.status}`, item.status.replace('_', ' ')) : t(`inv_stock_${level}`, level)}
                                                    </span>
                                                    <span className={`text-[9px] font-mono truncate max-w-[100px] ${fieldMode ? 'text-orange-400/50' : 'text-slate-300 dark:text-slate-600'}`}>{item.batch_id}</span>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </AnimatePresence>
                            </div>
                        )}
                    </div>
                </div>

                {/* Sensor Health Module */}
                <div className={`rounded-2xl border ${fieldMode ? 'border-orange-500/40' : 'border-slate-200 dark:border-slate-700'}`}>
                    <button onClick={() => setSensorOpen(o => !o)}
                        className={`w-full flex items-center justify-between p-5 rounded-2xl ${fieldMode ? 'bg-black text-orange-400' : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200'}`}>
                        <span className="flex items-center gap-3 font-bold">
                            <Activity size={18} className={fieldMode ? 'text-orange-500' : 'text-emerald-500'} />
                            {t('inv_sensor_health', 'IoT Sensor Health')}
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${MOCK_SENSORS.some(s => s.battery <= 15) ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'}`}>
                                {t('inv_sensors_online', '{{online}}/{{total}} online', { online: MOCK_SENSORS.filter(s => s.status === 'online').length, total: MOCK_SENSORS.length })}
                            </span>
                        </span>
                        {sensorOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                    <AnimatePresence>
                        {sensorOpen && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                <div className={`px-5 pb-5 grid grid-cols-1 sm:grid-cols-3 gap-4 ${fieldMode ? 'bg-black' : 'bg-white dark:bg-slate-900'} rounded-b-2xl`}>
                                    {MOCK_SENSORS.map(sensor => <SensorCard key={sensor.id} sensor={sensor} fieldMode={fieldMode} />)}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

            </div>

            {/* QR Modal */}
            <AnimatePresence>
                {qrBatch && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                        onClick={() => setQrBatch(null)}>
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                            onClick={e => e.stopPropagation()}
                            className="bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-sm shadow-2xl border border-slate-200 dark:border-slate-700 space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="font-black text-lg text-slate-900 dark:text-white">{t('inv_blockchain_qr', 'Blockchain QR')}</h3>
                                <button onClick={() => setQrBatch(null)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"><X size={18} /></button>
                            </div>
                            <p className="text-sm text-slate-500 dark:text-slate-400 font-semibold">{qrBatch.item_name || qrBatch.crop_name}  <span className="font-mono text-xs">{qrBatch.batch_id}</span></p>
                            <div className="flex justify-center bg-white rounded-2xl p-4 border border-slate-100">
                                <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${SCANNABLE_BASE}/product-transparency/${qrBatch.batch_id}`} alt="QR Code" className="w-48 h-48" />
                            </div>
                            <button onClick={() => handleCopyQr(qrBatch.batch_id)}
                                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm bg-emerald-500 text-white hover:bg-emerald-600 transition-colors">
                                {qrCopied ? <Check size={15} /> : <Copy size={15} />}
                                {qrCopied ? t('inv_copied', 'Copied!') : t('inv_copy_link', 'Copy Trust Link')}
                            </button>
                            <button onClick={() => navigate(`/product-transparency/${qrBatch.batch_id}`)}
                                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                                <ExternalLink size={14} />{t('inv_view_passport', 'View Trust Passport')}
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {openMenu && <div className="fixed inset-0 z-10" onClick={() => setOpenMenu(null)} />}
        </div>
    );
};

export default FarmerInventory;
