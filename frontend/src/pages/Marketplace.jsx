import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    TrendingUp, TrendingDown, Minus, Search, RefreshCw,
    Wheat, Package, AlertTriangle, BarChart3,
    Sun, Moon, Wifi, MapPin, ArrowUpRight, ArrowDownRight,
    X, Loader2, Globe, DollarSign, Activity
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { localizeNumber, localizeCurrency, localizeItemName } from '../utils/localize';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://let-go-3-0.onrender.com';

// ── Frontend fallback prices (mirrors mandi_service.py _FALLBACK_PRICES) ────
const _FALLBACK_BOARD = [
    { commodity: 'Potato',      min_price: 700,  max_price: 1400,  modal_price: 1050, trend: 'down',     unit: 'Quintal' },
    { commodity: 'Onion',       min_price: 600,  max_price: 1800,  modal_price: 1100, trend: 'up',       unit: 'Quintal' },
    { commodity: 'Tomato',      min_price: 500,  max_price: 2500,  modal_price: 1200, trend: 'volatile', unit: 'Quintal' },
    { commodity: 'Wheat',       min_price: 2100, max_price: 2500,  modal_price: 2275, trend: 'stable',   unit: 'Quintal' },
    { commodity: 'Rice',        min_price: 1800, max_price: 2800,  modal_price: 2200, trend: 'stable',   unit: 'Quintal' },
    { commodity: 'Maize',       min_price: 1500, max_price: 2000,  modal_price: 1800, trend: 'up',       unit: 'Quintal' },
    { commodity: 'Soybean',     min_price: 3800, max_price: 4800,  modal_price: 4300, trend: 'stable',   unit: 'Quintal' },
    { commodity: 'Cotton',      min_price: 5500, max_price: 6800,  modal_price: 6200, trend: 'up',       unit: 'Quintal' },
    { commodity: 'Sugarcane',   min_price: 280,  max_price: 340,   modal_price: 315,  trend: 'stable',   unit: 'Tonne'   },
    { commodity: 'Mango',       min_price: 1500, max_price: 5000,  modal_price: 2800, trend: 'up',       unit: 'Quintal' },
    { commodity: 'Banana',      min_price: 800,  max_price: 1500,  modal_price: 1100, trend: 'stable',   unit: 'Quintal' },
    { commodity: 'Chilli',      min_price: 4000, max_price: 8000,  modal_price: 6000, trend: 'up',       unit: 'Quintal' },
    { commodity: 'Garlic',      min_price: 2000, max_price: 8000,  modal_price: 4500, trend: 'volatile', unit: 'Quintal' },
    { commodity: 'Carrot',      min_price: 600,  max_price: 1400,  modal_price: 900,  trend: 'down',     unit: 'Quintal' },
    { commodity: 'Spinach',     min_price: 500,  max_price: 1200,  modal_price: 700,  trend: 'stable',   unit: 'Quintal' },
    { commodity: 'Brinjal',     min_price: 400,  max_price: 1200,  modal_price: 700,  trend: 'stable',   unit: 'Quintal' },
    { commodity: 'Okra',        min_price: 600,  max_price: 1800,  modal_price: 1100, trend: 'up',       unit: 'Quintal' },
    { commodity: 'Cauliflower', min_price: 500,  max_price: 1500,  modal_price: 900,  trend: 'stable',   unit: 'Quintal' },
    { commodity: 'Groundnut',   min_price: 4500, max_price: 6500,  modal_price: 5500, trend: 'stable',   unit: 'Quintal' },
    { commodity: 'Turmeric',    min_price: 7000, max_price: 12000, modal_price: 9500, trend: 'up',       unit: 'Quintal' },
    { commodity: 'Ginger',      min_price: 2000, max_price: 6000,  modal_price: 3500, trend: 'volatile', unit: 'Quintal' },
    { commodity: 'Jowar',       min_price: 2000, max_price: 3000,  modal_price: 2500, trend: 'stable',   unit: 'Quintal' },
    { commodity: 'Bajra',       min_price: 1800, max_price: 2500,  modal_price: 2200, trend: 'stable',   unit: 'Quintal' },
    { commodity: 'Gram',        min_price: 4000, max_price: 5500,  modal_price: 4800, trend: 'stable',   unit: 'Quintal' },
    { commodity: 'Urea Fertilizer', min_price: 260, max_price: 270, modal_price: 267, trend: 'stable',  unit: 'Bag (50kg)' },
    { commodity: 'Dap Fertilizer',  min_price: 1350,max_price: 1400,modal_price: 1375,trend: 'stable',  unit: 'Bag (50kg)' },
    { commodity: 'Seeds',       min_price: 200,  max_price: 1500,  modal_price: 600,  trend: 'stable',   unit: 'kg'      },
].map(r => ({ ...r, state: 'National Average', district: '—', market: '—', variety: '—', arrival_date: 'Current', currency: 'INR', source: 'fallback' }));
/**
 * Client-side: match each inventory item to a board record by commodity name.
 * Used as fallback when the backend enrichment endpoint returns empty inventory.
 */
function enrichClientSide(items, board) {
    const priceMap = {};
    board.forEach(r => { priceMap[r.commodity.toLowerCase()] = r; });

    const findPrice = (name) => {
        const key = name.toLowerCase().trim();
        if (priceMap[key]) return priceMap[key];
        // partial / fuzzy match (first 4 chars)
        for (const [k, v] of Object.entries(priceMap)) {
            if (key.length >= 4 && k.startsWith(key.slice(0, 4))) return v;
            if (k.length >= 4 && key.startsWith(k.slice(0, 4))) return v;
        }
        return null;
    };

    return items.map(item => {
        const cropName = (item.item_name || item.crop_name || '').trim();
        const rec = cropName ? findPrice(cropName) : null;
        if (!rec) return item;
        const farmerPrice = parseFloat(item.price_per_quintal || 0);
        return {
            ...item,
            mandi_modal:  rec.modal_price,
            mandi_min:    rec.min_price,
            mandi_max:    rec.max_price,
            mandi_source: rec.source || 'fallback',
            mandi_trend:  rec.trend  || 'stable',
            price_vs_mandi: (farmerPrice > 0 && rec.modal_price > 0)
                ? Math.round(((farmerPrice - rec.modal_price) / rec.modal_price) * 1000) / 10
                : null,
        };
    });
}
const INDIAN_STATES = [
    'Maharashtra','Punjab','Uttar Pradesh','Madhya Pradesh','Rajasthan',
    'Gujarat','Karnataka','Andhra Pradesh','Haryana','Bihar',
    'West Bengal','Telangana','Odisha','Tamil Nadu','Kerala',
];

const TREND_CFG = {
    up:       { icon: TrendingUp,   color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20',  label: 'mkt_trend_up' },
    down:     { icon: TrendingDown, color: 'text-red-500',     bg: 'bg-red-50 dark:bg-red-900/20',          label: 'mkt_trend_down' },
    stable:   { icon: Minus,        color: 'text-slate-400',   bg: 'bg-slate-50 dark:bg-slate-800',         label: 'mkt_trend_stable' },
    volatile: { icon: Activity,     color: 'text-amber-500',   bg: 'bg-amber-50 dark:bg-amber-900/20',      label: 'mkt_trend_volatile' },
};

const PriceBar = ({ min, max, modal, fieldMode, lang }) => {
    const range = (max || 0) - (min || 0);
    const pct = range > 0 ? Math.round((((modal || 0) - (min || 0)) / range) * 100) : 50;
    return (
        <div className="space-y-1">
            <div className="flex justify-between text-[10px] font-bold opacity-60">
                <span>&#8377;{localizeNumber(min || 0, lang)}</span>
                <span>&#8377;{localizeNumber(max || 0, lang)}</span>
            </div>
            <div className={`relative h-1.5 rounded-full overflow-hidden ${fieldMode ? 'bg-orange-500/20' : 'bg-slate-100 dark:bg-slate-700'}`}>
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                    className={`absolute h-full rounded-full ${fieldMode ? 'bg-orange-500' : 'bg-emerald-500'}`}
                />
                <div className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white border-2 border-emerald-500 shadow"
                    style={{ left: `calc(${pct}% - 4px)` }} />
            </div>
        </div>
    );
};

const TrendBadge = ({ trend, t }) => {
    const cfg = TREND_CFG[trend] || TREND_CFG.stable;
    const Icon = cfg.icon;
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${cfg.bg} ${cfg.color}`}>
            <Icon size={10} />{t(cfg.label, trend)}
        </span>
    );
};

const StatCard = ({ icon: Icon, label, value, sub, accent, fieldMode }) => (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        className={`rounded-2xl p-5 border flex flex-col gap-2 ${fieldMode ? 'bg-black border-orange-500' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700/50'}`}>
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

const InventoryPriceCard = ({ item, fieldMode, t, lang }) => {
    const name     = localizeItemName(item.item_name || item.crop_name || 'Unknown', lang);
    const qty      = parseFloat(item.quantity || 0);
    const unit     = item.unit || 'qtl';
    const modal    = item.mandi_modal;
    const trend    = item.mandi_trend || 'stable';
    const diff     = item.price_vs_mandi;
    const hasPrice = modal != null && modal > 0;
    const estValue = hasPrice ? Math.round(qty * modal / 100) : 0;

    return (
        <motion.div layout initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
            className={`rounded-2xl border p-4 flex flex-col gap-3 transition-all ${fieldMode ? 'bg-black border-orange-500/30 hover:border-orange-500' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700/50 hover:border-emerald-300 dark:hover:border-emerald-700'}`}>

            <div className="flex items-start justify-between gap-2">
                <div>
                    <p className={`text-lg font-black leading-tight ${fieldMode ? 'text-white' : 'text-slate-900 dark:text-white'}`}>{name}</p>
                    <p className={`text-xs mt-0.5 ${fieldMode ? 'text-orange-300/70' : 'text-slate-400'}`}>{localizeNumber(qty, lang)} {unit} {t('mkt_in_stock', 'in stock')}</p>
                </div>
                {item.mandi_source === 'live'
                    ? <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full"><Wifi size={9} /> {t('mkt_live', 'Live')}</span>
                    : <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">{t('mkt_est', 'Est')}</span>
                }
            </div>

            {hasPrice ? (
                <>
                    <div className={`rounded-xl p-3 ${fieldMode ? 'bg-orange-500/5 border border-orange-500/20' : 'bg-slate-50 dark:bg-slate-800/50'}`}>
                        <div className="flex items-end justify-between mb-2">
                            <div>
                                <p className={`text-[10px] font-bold uppercase tracking-wider ${fieldMode ? 'text-orange-400/70' : 'text-slate-400'}`}>{t('mkt_mandi_modal', 'Mandi Modal')}</p>
                                <p className={`text-2xl font-black mt-0.5 ${fieldMode ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                                    &#8377;{localizeNumber(modal, lang)}
                                    <span className={`text-xs font-normal ml-1 ${fieldMode ? 'text-orange-300/60' : 'text-slate-400'}`}>/qtl</span>
                                </p>
                            </div>
                            <TrendBadge trend={trend} t={t} />
                        </div>
                        <PriceBar min={item.mandi_min} max={item.mandi_max} modal={modal} fieldMode={fieldMode} lang={lang} />
                    </div>

                    {estValue > 0 && (
                        <div className={`flex items-center justify-between rounded-xl px-3 py-2 ${fieldMode ? 'bg-orange-500/10' : 'bg-emerald-50 dark:bg-emerald-900/10'}`}>
                            <span className={`text-xs font-bold ${fieldMode ? 'text-orange-300' : 'text-emerald-700 dark:text-emerald-400'}`}>{t('mkt_est_value', 'Estimated value')}</span>
                            <span className={`text-sm font-black ${fieldMode ? 'text-orange-400' : 'text-emerald-600 dark:text-emerald-400'}`}>&#8377;{localizeNumber(estValue, lang)}</span>
                        </div>
                    )}

                    {diff != null && (
                        <div className={`flex items-center gap-1.5 text-xs font-bold ${diff >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                            {diff >= 0 ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                            {diff >= 0 ? t('mkt_above_mandi', 'Above mandi rate') : t('mkt_below_mandi', 'Below mandi rate')} ({localizeNumber(Math.abs(diff), lang)}%)
                        </div>
                    )}
                </>
            ) : (
                <p className={`text-sm py-4 text-center ${fieldMode ? 'text-orange-400/50' : 'text-slate-400'}`}>{t('mkt_no_price', 'No price data available')}</p>
            )}
        </motion.div>
    );
};

const MandiCard = ({ record, fieldMode, t, lang }) => {
    const trend = record.trend || 'stable';
    const name = localizeItemName(record.commodity, lang);
    return (
        <motion.div layout initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
            className={`rounded-2xl border p-4 flex flex-col gap-3 transition-all ${fieldMode ? 'bg-black border-orange-500/30 hover:border-orange-500' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700/50 hover:border-emerald-300 dark:hover:border-emerald-700'}`}>

            <div className="flex items-center justify-between">
                <p className={`text-base font-black ${fieldMode ? 'text-white' : 'text-slate-900 dark:text-white'}`}>{name}</p>
                <TrendBadge trend={trend} t={t} />
            </div>

            <div className={`rounded-xl p-3 space-y-2 ${fieldMode ? 'bg-orange-500/5 border border-orange-500/20' : 'bg-slate-50 dark:bg-slate-800/50'}`}>
                <div className="flex items-end gap-2">
                    <p className={`text-2xl font-black ${fieldMode ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                        &#8377;{localizeNumber(record.modal_price || 0, lang)}
                    </p>
                    <span className={`text-xs pb-1 ${fieldMode ? 'text-orange-300/60' : 'text-slate-400'}`}>/{record.unit || 'Qtl'}</span>
                </div>
                <PriceBar min={record.min_price} max={record.max_price} modal={record.modal_price} fieldMode={fieldMode} lang={lang} />
                <div className="flex justify-between text-[10px] font-bold mt-1">
                    <span className="text-red-500">{t('mkt_min', 'MIN')} &#8377;{localizeNumber(record.min_price || 0, lang)}</span>
                    <span className="text-emerald-500">{t('mkt_max', 'MAX')} &#8377;{localizeNumber(record.max_price || 0, lang)}</span>
                </div>
            </div>

            {record.market && record.market !== '—' && (
                <p className={`text-xs flex items-center gap-1 ${fieldMode ? 'text-orange-300/60' : 'text-slate-400'}`}>
                    <MapPin size={10} />{record.market}{record.district ? `, ${record.district}` : ''}
                </p>
            )}
        </motion.div>
    );
};

const Marketplace = () => {
    const { t, i18n } = useTranslation();
    const lang = i18n.language;
    const navigate = useNavigate();

    const [farmerId] = useState(() => {
        try {
            const u = JSON.parse(localStorage.getItem('user') || '{}');
            return u.id || u.user_id || '70adcaac-b6c7-4b08-bf0a-4012c0cf3191';
        } catch { return '70adcaac-b6c7-4b08-bf0a-4012c0cf3191'; }
    });

    const [loading, setLoading]             = useState(true);
    const [refreshing, setRefreshing]       = useState(false);  // silent bg refresh
    const [inventory, setInventory]         = useState([]);
    const [board, setBoard]                 = useState([]);
    const [selectedState, setSelectedState] = useState('Maharashtra');
    const [tab, setTab]                     = useState('mine');
    const [searchTerm, setSearchTerm]       = useState('');
    const [fieldMode, setFieldMode]         = useState(false);
    const [dataSource, setDataSource]       = useState('');
    const [lastUpdated, setLastUpdated]     = useState(null);

    // Board prices change slowly — cache 30 min. Inventory changes — cache 10 min.
    const BOARD_TTL = 30 * 60 * 1000;
    const INV_TTL   = 10 * 60 * 1000;
    const boardKey  = `mkt_board_${selectedState}`;
    const invKey    = `mkt_inv_${farmerId}_${selectedState}`;

    // ── Persist helpers ──────────────────────────────────────────────────────
    const readCache = (key) => {
        try {
            const raw = localStorage.getItem(key);
            if (!raw) return null;
            return JSON.parse(raw);   // { data, ts }
        } catch { return null; }
    };
    const writeCache = (key, data) => {
        try { localStorage.setItem(key, JSON.stringify({ data, ts: Date.now() })); } catch {}
    };

    // ── Core fetch (no spinner — returns data, does NOT setState) ────────────
    const fetchFresh = useCallback(async () => {
        let inv = [];
        let brd = [];
        let src = 'fallback';

        // Step 1: enriched endpoint
        try {
            const res = await fetch(
                `${API_BASE}/api/mandi/prices-for-farmer/${farmerId}?state=${encodeURIComponent(selectedState)}`,
                { signal: AbortSignal.timeout(30000) }
            );
            if (res.ok) {
                const data = await res.json();
                inv = data.inventory || [];
                brd = (data.board && data.board.length > 0) ? data.board : [];
                src = brd[0]?.source || 'fallback';
            }
        } catch (e) {
            console.warn('Enriched endpoint failed:', e.message);
        }

        // Step 2: fallback — direct inventory list + client-side enrichment
        if (inv.length === 0) {
            try {
                const res2 = await fetch(
                    `${API_BASE}/api/feature6/list/${farmerId}`,
                    { signal: AbortSignal.timeout(30000) }
                );
                if (res2.ok) {
                    const raw2  = await res2.json();
                    const items = Array.isArray(raw2) ? raw2 : (raw2.data || raw2.items || []);
                    const activeBrd = brd.length > 0 ? brd : _FALLBACK_BOARD;
                    inv = enrichClientSide(items, activeBrd);
                }
            } catch (e) {
                console.warn('Direct inventory fetch failed:', e.message);
            }
        }

        // Step 3: use FarmerInventory's own localStorage cache as last resort
        if (inv.length === 0) {
            try {
                const raw3 = localStorage.getItem(`inv_cache_${farmerId}`);
                if (raw3) {
                    const parsed3 = JSON.parse(raw3);
                    const cachedItems = parsed3.data || parsed3;
                    if (Array.isArray(cachedItems) && cachedItems.length > 0) {
                        const activeBrd = brd.length > 0 ? brd : _FALLBACK_BOARD;
                        inv = enrichClientSide(cachedItems, activeBrd);
                        console.log('Marketplace: used FarmerInventory cache, items:', inv.length);
                    }
                }
            } catch (e) {
                console.warn('FarmerInventory cache fallback failed:', e.message);
            }
        }

        if (brd.length === 0) { brd = _FALLBACK_BOARD; src = 'fallback'; }

        return { inv, brd, src };
    }, [farmerId, selectedState]);

    // ── Load: show cache instantly, revalidate in background ────────────────
    const loadData = useCallback(async (force = false) => {
        const cachedBrd = readCache(boardKey);
        const cachedInv = readCache(invKey);
        const now = Date.now();

        // Show cached data immediately — no loading flash
        const boardFresh = cachedBrd && (now - cachedBrd.ts < BOARD_TTL);
        const invFresh   = cachedInv && (now - cachedInv.ts < INV_TTL);

        if (!force && boardFresh && invFresh) {
            // Fully fresh — paint immediately
            setBoard(cachedBrd.data.length > 0 ? cachedBrd.data : _FALLBACK_BOARD);
            setInventory(cachedInv.data);
            setDataSource(cachedBrd.data[0]?.source || 'fallback');
            setLastUpdated(cachedBrd.ts);
            setLoading(false);
            return;
        }

        if (!force && (boardFresh || invFresh)) {
            // Partially stale — paint what we have, then revalidate silently
            if (cachedBrd) { setBoard(cachedBrd.data.length > 0 ? cachedBrd.data : _FALLBACK_BOARD); setDataSource(cachedBrd.data[0]?.source || 'fallback'); }
            if (cachedInv) { setInventory(cachedInv.data); }
            setLoading(false);
            setRefreshing(true);
        } else {
            // Nothing cached — show spinner
            setLoading(true);
        }

        const { inv, brd, src } = await fetchFresh();

        setInventory(inv);
        setBoard(brd);
        setDataSource(src);
        setLastUpdated(Date.now());
        writeCache(boardKey, brd);
        writeCache(invKey, inv);
        setLoading(false);
        setRefreshing(false);
    }, [fetchFresh, boardKey, invKey]);

    useEffect(() => { loadData(); }, [loadData]);

    const produce = useMemo(() =>
        inventory.filter(i => (i.category || 'produce') === 'produce'),
    [inventory]);

    const filteredProduce = useMemo(() => {
        const q = searchTerm.toLowerCase();
        return produce.filter(i => !q || (i.item_name || i.crop_name || '').toLowerCase().includes(q));
    }, [produce, searchTerm]);

    const filteredBoard = useMemo(() => {
        const q = searchTerm.toLowerCase();
        return board.filter(r => !q || (r.commodity || '').toLowerCase().includes(q));
    }, [board, searchTerm]);

    const stats = useMemo(() => {
        const priced   = produce.filter(i => i.mandi_modal != null && i.mandi_modal > 0);
        const totalVal = priced.reduce((acc, i) => acc + (parseFloat(i.quantity || 0) * (i.mandi_modal || 0) / 100), 0);
        const above    = produce.filter(i => (i.price_vs_mandi || 0) > 0).length;
        const avgModal = board.length ? Math.round(board.reduce((a, b) => a + (b.modal_price || 0), 0) / board.length) : 0;
        return { totalVal, above, priced: priced.length, avgModal };
    }, [produce, board]);

    const fm = fieldMode
        ? 'bg-black text-white'
        : 'bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white';

    return (
        <div className={`min-h-screen ${fm} transition-colors duration-500 pt-20 pb-16`}>
            <div className="max-w-7xl mx-auto px-4 md:px-8 space-y-8">

                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <div className={`w-8 h-[2px] ${fieldMode ? 'bg-orange-500' : 'bg-emerald-500'}`} />
                            <span className={`text-[10px] font-black uppercase tracking-[0.35em] ${fieldMode ? 'text-orange-400' : 'text-emerald-500'}`}>
                                {t('mkt_annadata', 'Annadata Smart Market')}
                            </span>
                        </div>
                        <h1 className={`text-4xl md:text-5xl font-black uppercase tracking-tighter leading-none ${fieldMode ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                            {t('mkt_title_1', 'Live')}{' '}
                            <span className={fieldMode ? 'text-orange-500' : 'text-emerald-500'}>{t('mkt_title_2', 'Mandi Prices')}</span>
                        </h1>
                        <p className={`text-sm ${fieldMode ? 'text-orange-300' : 'text-slate-500 dark:text-slate-400'}`}>
                            {t('mkt_subtitle', 'Real-time government mandi rates for your inventory')}
                        </p>
                        {dataSource === 'fallback' && (
                            <p className={`text-xs flex items-center gap-1 ${fieldMode ? 'text-orange-400/70' : 'text-amber-600 dark:text-amber-400'}`}>
                                <AlertTriangle size={11} />
                                {t('mkt_fallback_note', 'Using curated national average prices — live data temporarily unavailable')}
                            </p>
                        )}
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                        <select value={selectedState} onChange={e => setSelectedState(e.target.value)}
                            className={`text-xs font-bold px-3 py-2 rounded-full border outline-none ${fieldMode ? 'bg-black border-orange-500/40 text-orange-300' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'}`}>
                            {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <button onClick={() => setFieldMode(f => !f)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold border transition-all ${fieldMode ? 'bg-orange-500 text-black border-orange-500' : 'border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-orange-400'}`}>
                            {fieldMode ? <Moon size={13} /> : <Sun size={13} />}
                            {fieldMode ? t('inv_field_off', 'Exit Field Mode') : t('inv_field_mode', 'Field Mode')}
                        </button>
                        <button onClick={() => loadData(true)}
                            className={`p-2 rounded-full border transition-all ${fieldMode ? 'border-orange-500 text-orange-400 hover:bg-orange-500/10' : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
                        </button>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard icon={DollarSign} label={t('mkt_stat_value',   'Est. Inventory Value')} value={`${localizeCurrency(Math.round(stats.totalVal / 1000), lang)}K`}                    sub={t('mkt_at_mandi',    'at mandi rates')}               accent="bg-emerald-500" fieldMode={fieldMode} />
                    <StatCard icon={TrendingUp}  label={t('mkt_stat_above',   'Above Mandi Rate')}    value={localizeNumber(stats.above, lang)}                                                       sub={t('mkt_of_crops',   { count: produce.length, defaultValue: `of ${produce.length} crops` })}   accent="bg-blue-500"    fieldMode={fieldMode} />
                    <StatCard icon={Wheat}       label={t('mkt_stat_tracked', 'Crops Tracked')}       value={localizeNumber(stats.priced, lang)}                                                      sub={t('mkt_with_price', 'with live price')}               accent="bg-amber-500"   fieldMode={fieldMode} />
                    <StatCard icon={BarChart3}   label={t('mkt_stat_avg',     'Avg Modal Price')}     value={`${localizeCurrency(stats.avgModal, lang)}`}                 sub={`${t('mkt_per_qtl', 'per quintal')} · ${selectedState}`} accent="bg-violet-500" fieldMode={fieldMode} />
                </div>

                {/* Tabs */}
                <div className="flex gap-1">
                    {[
                        { key: 'mine',  label: 'mkt_tab_mine',  fallback: 'My Crops',    Icon: Package },
                        { key: 'board', label: 'mkt_tab_board', fallback: 'Mandi Board', Icon: Globe },
                    ].map(tabDef => (
                        <button key={tabDef.key} onClick={() => setTab(tabDef.key)}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                                tab === tabDef.key
                                    ? (fieldMode ? 'bg-orange-500 text-black' : 'bg-emerald-500 text-white')
                                    : (fieldMode ? 'text-orange-300 hover:bg-orange-500/10' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800')
                            }`}>
                            <tabDef.Icon size={15} />
                            {t(tabDef.label, tabDef.fallback)}
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${tab === tabDef.key ? 'bg-white/20' : (fieldMode ? 'bg-orange-500/20 text-orange-400' : 'bg-slate-100 dark:bg-slate-700 text-slate-500')}`}>
                                {localizeNumber(tabDef.key === 'mine' ? filteredProduce.length : filteredBoard.length, lang)}
                            </span>
                        </button>
                    ))}
                </div>

                {/* Search */}
                <div className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border ${fieldMode ? 'bg-black border-orange-500/40' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700'}`}>
                    <Search size={15} className={fieldMode ? 'text-orange-400' : 'text-slate-400'} />
                    <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                        placeholder={t('mkt_search_placeholder', 'Search commodity...')}
                        className={`flex-1 text-sm bg-transparent outline-none ${fieldMode ? 'text-white placeholder-orange-400/50' : 'placeholder-slate-400 text-slate-900 dark:text-white'}`} />
                    {searchTerm && (
                        <button onClick={() => setSearchTerm('')}>
                            <X size={14} className={fieldMode ? 'text-orange-400' : 'text-slate-400'} />
                        </button>
                    )}
                </div>

                {/* Content */}
                {loading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 size={32} className={`animate-spin ${fieldMode ? 'text-orange-500' : 'text-emerald-500'}`} />
                    </div>
                ) : (
                    <AnimatePresence mode="wait">
                        {tab === 'mine' ? (
                            <motion.div key="mine" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                {filteredProduce.length === 0 ? (
                                    <div className={`text-center py-20 rounded-2xl border-2 border-dashed ${fieldMode ? 'border-orange-500/30 text-orange-300' : 'border-slate-200 dark:border-slate-700 text-slate-400'}`}>
                                        <Wheat size={40} className="mx-auto mb-3 opacity-40" />
                                        <p className="font-bold">{t('mkt_no_produce', 'No produce in inventory')}</p>
                                        <p className="text-sm mt-1">{t('mkt_add_produce_hint', 'Add produce items in your inventory to see prices here.')}</p>
                                        <button onClick={() => navigate('/inventory')}
                                            className={`mt-4 px-5 py-2 rounded-xl text-sm font-bold ${fieldMode ? 'bg-orange-500 text-black' : 'bg-emerald-500 text-white'}`}>
                                            {t('mkt_go_inventory', 'Go to Inventory')}
                                        </button>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                                        {filteredProduce.map((item, idx) => (
                                            <InventoryPriceCard key={item.id || item.batch_id || idx} item={item} fieldMode={fieldMode} t={t} lang={lang} />
                                        ))}
                                    </div>
                                )}
                            </motion.div>
                        ) : (
                            <motion.div key="board" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                {filteredBoard.length === 0 ? (
                                    <div className={`text-center py-20 rounded-2xl border-2 border-dashed ${fieldMode ? 'border-orange-500/30 text-orange-300' : 'border-slate-200 dark:border-slate-700 text-slate-400'}`}>
                                        <BarChart3 size={40} className="mx-auto mb-3 opacity-40" />
                                        <p className="font-bold">{t('mkt_no_data', 'No price data')}</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                                        {filteredBoard.map((rec, idx) => (
                                            <MandiCard key={`${rec.commodity}_${idx}`} record={rec} fieldMode={fieldMode} t={t} lang={lang} />
                                        ))}
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                )}
            </div>
        </div>
    );
};

export default Marketplace;
