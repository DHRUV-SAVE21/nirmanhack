import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Sprout, Droplets, Wind, Thermometer, FlaskConical, Send, Loader2, TrendingUp, AlertTriangle, CheckCircle2, Calendar, CloudRain, MapPin, X, Info, RefreshCw } from 'lucide-react';
import { getApiUrl } from '../../../config/api';
import { fetchMarketPrices, getCropPrice } from '../../../services/marketService';

const InputField = ({ label, name, value, onChange, icon: Icon, min, max, unit, step, type = "number" }) => (
    <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-slate-600 dark:text-gray-400 pl-1">{label} {unit && `(${unit})`}</label>
        <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Icon className="h-4 w-4 text-organic-green group-focus-within:text-white transition-colors" />
            </div>
            <input
                type={type}
                name={name}
                value={value}
                onChange={onChange}
                min={min}
                max={max}
                step={step}
                className="w-full bg-white dark:bg-white/5 shadow-sm dark:shadow-none border border-slate-200 dark:border-white/10 rounded-xl py-3 pl-10 pr-4 text-slate-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-organic-green/50 focus:border-organic-green transition-all"
                placeholder={type === "number" ? "0" : ""}
            />
        </div>
    </div>
);

const SelectField = ({ label, name, value, onChange, options, icon: Icon }) => (
    <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-slate-600 dark:text-gray-400 pl-1">{label}</label>
        <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Icon className="h-4 w-4 text-organic-green group-focus-within:text-white transition-colors" />
            </div>
            <select
                name={name}
                value={value}
                onChange={onChange}
                className="w-full bg-white dark:bg-white/5 shadow-sm dark:shadow-none border border-slate-200 dark:border-white/10 rounded-xl py-3 pl-10 pr-4 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-organic-green/50 focus:border-organic-green transition-all appearance-none cursor-pointer"
            >
                {options.map(opt => (
                    <option key={opt} value={opt} className="bg-white dark:bg-gray-900 shadow-md dark:shadow-none text-slate-900 dark:text-white">{opt}</option>
                ))}
            </select>
        </div>
    </div>
);

const CropDetailModal = ({ crop, onClose, detectedState = 'Maharashtra' }) => {
    const { t } = useTranslation();
    const [livePrice, setLivePrice] = useState(null);
    const [loadingPrice, setLoadingPrice] = useState(false);

    useEffect(() => {
        const getLivePrice = async () => {
            if (!crop || !crop.crop_name) return;
            setLoadingPrice(true);
            try {
                // Use the real detected state instead of hardcoded Maharashtra
                const marketData = await fetchMarketPrices(detectedState);
                const priceData = getCropPrice(marketData, crop.crop_name);

                if (priceData && priceData.price) {
                    const pricePerTonne = parseFloat(priceData.price) * 10;
                    setLivePrice({
                        price: pricePerTonne,
                        market: priceData.market,
                        date: priceData.date
                    });
                }
            } catch (err) {
                console.error("Failed to fetch live price", err);
            } finally {
                setLoadingPrice(false);
            }
        };

        getLivePrice();
    }, [crop, detectedState]);

    if (!crop) return null;

    // Use live price if available, else fallback to model's estimate
    const displayPrice = livePrice ? livePrice.price : (crop.market_price || 0);
    const displayRevenue = livePrice ? (crop.predicted_yield * livePrice.price) : (crop.expected_revenue || 0);
    const isLive = !!livePrice;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white dark:bg-gray-900 shadow-md dark:shadow-none border border-slate-200 dark:border-white/10 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl"
            >
                <div className="relative h-32 bg-organic-green/20 flex items-center justify-center">
                    <Sprout size={48} className="text-organic-green" />
                    <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 rounded-full transition-colors text-slate-900 dark:text-white">
                        <X size={20} />
                    </button>
                    <div className="absolute bottom-4 left-6">
                        <h2 className="text-3xl font-bold text-slate-900 dark:text-white capitalize">{crop.crop_name}</h2>
                        <span className="text-sm text-organic-green font-medium bg-black/40 px-2 py-0.5 rounded-full">
                            {t('rank')} #{crop.rank} {t('top_recommendation').split(' ')[1]}
                        </span>
                    </div>
                </div>

                <div className="p-6 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-white dark:bg-white/5 shadow-sm dark:shadow-none rounded-xl border border-slate-200 dark:border-white/5">
                            <div className="text-slate-600 dark:text-gray-400 text-xs uppercase tracking-wider mb-1">{t('yield_potential')}</div>
                            <div className="text-2xl font-bold text-slate-900 dark:text-white">{crop.predicted_yield.toFixed(1)} <span className="text-sm font-normal text-slate-600 dark:text-gray-400">t/ha</span></div>
                            <div className="text-xs text-organic-green mt-1 flex items-center gap-1">
                                <TrendingUp size={12} /> {crop.yield_comparison_pct.toFixed(0)}% {t('avg_yield')}
                            </div>
                        </div>
                        <div className="p-4 bg-white dark:bg-white/5 shadow-sm dark:shadow-none rounded-xl border border-slate-200 dark:border-white/5">
                            <div className="text-slate-600 dark:text-gray-400 text-xs uppercase tracking-wider mb-1">{t('risk_assessment')}</div>
                            <div className={`text-2xl font-bold ${crop.predicted_risk_score < 0.5 ? 'text-green-400' : 'text-red-400'}`}>
                                {crop.risk_level}
                            </div>
                            <div className="text-xs text-slate-500 dark:text-gray-500 mt-1">Score: {crop.predicted_risk_score.toFixed(2)}</div>
                        </div>
                    </div>

                    <div className="p-4 bg-white dark:bg-white/5 shadow-sm dark:shadow-none rounded-xl border border-slate-200 dark:border-white/5 flex justify-between items-center relative overflow-hidden">
                        {/* Live Indicator */}
                        {isLive && (
                            <div className="absolute top-0 right-0 bg-organic-green/20 text-organic-green text-[10px] uppercase font-bold px-2 py-1 rounded-bl-lg flex items-center gap-1">
                                <RefreshCw size={10} className="animate-spin-slow" /> Live Market Data
                            </div>
                        )}

                        <div>
                            <div className="text-slate-600 dark:text-gray-400 text-xs uppercase tracking-wider mb-1 flex items-center gap-1">
                                Market Price {loadingPrice && <Loader2 size={10} className="animate-spin" />}
                            </div>
                            <div className="text-xl font-bold text-slate-900 dark:text-white">
                                ₹ {displayPrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                <span className="text-sm font-normal text-slate-600 dark:text-gray-400">/ tonne</span>
                            </div>
                            {isLive && <div className="text-[10px] text-slate-500 dark:text-gray-500">{livePrice.market} Mandi</div>}

                            {/* Previous Revenue - Added */}
                            <div className="mt-2 pt-2 border-t border-slate-200 dark:border-white/5">
                                <div className="text-slate-500 dark:text-gray-500 text-[10px] uppercase tracking-wider mb-0.5">Previous Crop Revenue</div>
                                <div className="text-sm font-medium text-slate-700 dark:text-gray-300">
                                    ₹ {(crop.previous_revenue || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                    <span className="text-xs font-normal text-slate-500 dark:text-gray-500"> / ha</span>
                                </div>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-slate-600 dark:text-gray-400 text-xs uppercase tracking-wider mb-1">Expected Revenue</div>
                            <div className="text-xl font-bold text-organic-green">
                                ₹ {displayRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                <span className="text-sm font-normal text-slate-600 dark:text-gray-400">/ ha</span>
                            </div>
                            {!isLive && crop.revenue_uplift_pct > 0 && (
                                <div className="text-xs text-green-400 flex items-center justify-end gap-1">
                                    <TrendingUp size={10} /> +{crop.revenue_uplift_pct.toFixed(0)}% vs Last Crop
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="space-y-3">
                        <h3 className="text-sm font-medium text-slate-700 dark:text-gray-300 flex items-center gap-2">
                            <Info size={16} className="text-blue-400" /> {t('agronomic_details')}
                        </h3>
                        <div className="bg-white dark:bg-white/5 shadow-sm dark:shadow-none rounded-xl p-4 space-y-3 text-sm">
                            <div className="flex justify-between items-center border-b border-slate-200 dark:border-white/5 pb-2">
                                <span className="text-slate-600 dark:text-gray-400 flex items-center gap-2"><Droplets size={14} /> {t('water_requirement')}</span>
                                <span className="text-slate-900 dark:text-white font-medium">{crop.water_requirement}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-slate-600 dark:text-gray-400 flex items-center gap-2"><Calendar size={14} /> {t('crop_duration')}</span>
                                <span className="text-slate-900 dark:text-white font-medium">{crop.duration_days.toFixed(0)} Days</span>
                            </div>
                        </div>
                    </div>

                    <button className="w-full bg-organic-green hover:bg-green-600 text-white font-bold py-3 rounded-xl transition-all">
                        {t('view_cultivation_guide')}
                    </button>
                </div>
            </motion.div>
        </div>
    );
}

const CropRecommendation = () => {
    const { t } = useTranslation();
    const [formData, setFormData] = useState({
        soil_n: 0,
        soil_p: 0,
        soil_k: 0,
        soil_moisture: 0,
        humidity: 0,
        ph: 0,
        avg_temperature: 0,
        seasonal_rainfall: 0,
        crop_duration_days: 120,
        soil_type: 'Alluvial',
        lat: 0,
        lon: 0,
        state: '',
        district: ''
    });

    const [loading, setLoading] = useState(false);
    const [weatherLoading, setWeatherLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);
    const [selectedCrop, setSelectedCrop] = useState(null);

    const soilTypes = ['Alluvial', 'Black', 'Clay', 'Laterite', 'Loamy', 'Mountain', 'Red', 'Sandy'];

    // Auto-fetch Sensor Data and Weather on Mount
    useEffect(() => {
        const fetchSensorData = async () => {
            try {
                console.log("Fetching sensor data...");
                const response = await fetch(getApiUrl(`api/hardware/latest?user_id=HARDWARE_DEFAULT`));
                const result = await response.json();

                if (result.status === 'success' && result.data) {
                    console.log("Sensor data fetched:", result.data);
                    const sData = result.data;
                    setFormData(prev => ({
                        ...prev,
                        soil_n: sData.nitrogen !== undefined ? sData.nitrogen : prev.soil_n,
                        soil_p: sData.phosphorus !== undefined ? sData.phosphorus : prev.soil_p,
                        soil_k: sData.potassium !== undefined ? sData.potassium : prev.soil_k,
                        ph: sData.ph !== undefined ? sData.ph : prev.ph,
                        soil_moisture: sData.soil_moisture !== undefined ? sData.soil_moisture : prev.soil_moisture
                    }));
                }
            } catch (err) {
                console.error("Error autofilling form with sensor data:", err);
            }
        };

        // 1. Initial Fetch
        fetchSensorData();
        fetchLocalWeather();

        // 2. Poll Sensor Data (Real-time)
        const intervalId = setInterval(fetchSensorData, 5000);

        return () => clearInterval(intervalId);
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: name === 'soil_type' ? value : parseFloat(value)
        });
    };

    const fetchLocalWeather = async () => {
        setWeatherLoading(true);
        setError(null);
        console.log("Starting location fetch...");

        const processLocation = async (latitude, longitude) => {
            console.log("Processing location:", latitude, longitude);
            try {
                const apiKey = import.meta.env.VITE_OPEN_WEATHER_MAP_API;
                if (!apiKey) {
                    throw new Error("Missing OpenWeatherMap API Key in .env");
                }

                // 1. Reverse Geocoding
                const geoResponse = await fetch(
                    `https://api.openweathermap.org/geo/1.0/reverse?lat=${latitude}&lon=${longitude}&limit=1&appid=${apiKey}`
                );
                const geoData = await geoResponse.json();
                const location = geoData[0] || {};
                const state = location.state || location.country || "Unknown";
                const district = location.name || "Unknown";

                // 2. Weather Data
                const weatherResponse = await fetch(
                    `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&units=metric&appid=${apiKey}`
                );
                const weatherData = await weatherResponse.json();

                const temp = weatherData.main.temp;
                const humidity = weatherData.main.humidity;
                const currentRainRaw = (weatherData.rain && weatherData.rain['1h']) || 0;
                const estimatedSeasonalRain = currentRainRaw > 0 ? currentRainRaw * 24 * 30 : 850;

                setFormData(prev => ({
                    ...prev,
                    lat: latitude,
                    lon: longitude,
                    state: state,
                    district: district,
                    avg_temperature: temp,
                    humidity: humidity,
                    seasonal_rainfall: estimatedSeasonalRain,
                }));
            } catch (err) {
                console.error("Weather processing error:", err);
                setError(`Error: ${err.message}. Please fill manually.`);
            } finally {
                setWeatherLoading(false);
            }
        };

        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => processLocation(position.coords.latitude, position.coords.longitude),
                async (geoErr) => {
                    console.warn("Geolocation failed, trying IP fallback...", geoErr);
                    try {
                        const res = await fetch('http://ip-api.com/json/');
                        const data = await res.json();
                        if (data.lat && data.lon) {
                            processLocation(data.lat, data.lon);
                        } else {
                            throw new Error("Could not detect location via IP");
                        }
                    } catch (ipErr) {
                        setError("Could not detect location. Please enter manually.");
                        setWeatherLoading(false);
                    }
                }
            );
        } else {
            try {
                const res = await fetch('http://ip-api.com/json/');
                const data = await res.json();
                processLocation(data.lat, data.lon);
            } catch {
                setError("Geolocation not supported. Please enter manually.");
                setWeatherLoading(false);
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setResult(null);

        try {
            // Map frontend state to backend expected payload
            const payload = {
                soil_n: formData.soil_n,
                soil_p: formData.soil_p,
                soil_k: formData.soil_k,
                soil_ph: formData.ph,
                soil_moisture: formData.soil_moisture,
                avg_temperature: formData.avg_temperature,
                seasonal_rainfall: formData.seasonal_rainfall,
                humidity: formData.humidity,
                crop_duration_days: formData.crop_duration_days,
                soil_type: formData.soil_type,
                district: formData.district || "Sample",
                state: formData.state || "Sample",
                climate_season: "Kharif",
                previous_crop: "Rice",
                crop_water_requirement: "Medium"
            };

            const response = await fetch(getApiUrl('api/feature4/recommend'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.detail || 'Failed to fetch recommendations');
            }

            const data = await response.json();
            setResult(data.data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div data-tour="crop-recommendation-main" className="pt-24 pb-12 px-6 min-h-screen relative">
            <AnimatePresence>
                {selectedCrop && (
                    <CropDetailModal crop={selectedCrop} onClose={() => setSelectedCrop(null)} />
                )}
            </AnimatePresence>

            <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12">

                {/* Input Section */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="glass-panel p-8 h-fit"
                >
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-organic-green/10 rounded-lg">
                                <Sprout className="w-8 h-8 text-organic-green" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold font-display text-slate-900 dark:text-white">{t('crop_recommendation_title')}</h2>
                                <p className="text-slate-600 dark:text-gray-400 text-sm">{t('powered_by')}</p>
                            </div>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <InputField label={t('state')} name="state" value={formData.state} onChange={handleChange} icon={MapPin} type="text" />
                            <InputField label={t('district')} name="district" value={formData.district} onChange={handleChange} icon={MapPin} type="text" />
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                            <InputField label={t('soil_n', 'Nitrogen')} name="soil_n" value={formData.soil_n} onChange={handleChange} icon={FlaskConical} unit="kg/ha" />
                            <InputField label={t('soil_p', 'Phosphorus')} name="soil_p" value={formData.soil_p} onChange={handleChange} icon={FlaskConical} unit="kg/ha" />
                            <InputField label={t('soil_k', 'Potassium')} name="soil_k" value={formData.soil_k} onChange={handleChange} icon={FlaskConical} unit="kg/ha" />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <InputField label={t('ph_level')} name="ph" value={formData.ph} onChange={handleChange} icon={FlaskConical} unit="0-14" min="0" max="14" step="0.1" />                            <SelectField label={t('soil_type')} name="soil_type" value={formData.soil_type} onChange={handleChange} options={soilTypes} icon={MapPin} />
                        </div>

                        <div className="h-px bg-slate-100 dark:bg-white/10 shadow-sm dark:shadow-none my-2" />

                        <div className="flex justify-between items-end mb-2">
                            <h3 className="text-sm font-semibold text-slate-700 dark:text-gray-300">{t('weather')}</h3>
                            <button
                                type="button"
                                onClick={fetchLocalWeather}
                                disabled={weatherLoading}
                                className="text-xs text-organic-green hover:text-white flex items-center gap-1 transition-colors"
                            >
                                {weatherLoading ? <Loader2 size={12} className="animate-spin" /> : <MapPin size={12} />}
                                {weatherLoading ? t('locating') : t('use_my_location')}
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <InputField label={t('temp')} name="avg_temperature" value={formData.avg_temperature} onChange={handleChange} icon={Thermometer} unit="°C" />
                            <InputField label={t('humidity')} name="humidity" value={formData.humidity} onChange={handleChange} icon={Wind} unit="%" />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <InputField label={t('rainfall')} name="seasonal_rainfall" value={formData.seasonal_rainfall} onChange={handleChange} icon={CloudRain} unit="mm" />
                            <InputField label={t('moisture')} name="soil_moisture" value={formData.soil_moisture} onChange={handleChange} icon={Droplets} unit="%" />
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            <InputField label={t('available_duration')} name="crop_duration_days" value={formData.crop_duration_days} onChange={handleChange} icon={Calendar} unit="days" />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-organic-green hover:bg-green-600 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? <Loader2 className="animate-spin" /> : <Send size={20} />}
                            {loading ? t('analyzing_models') : t('get_predictions')}
                        </button>
                    </form>
                </motion.div>

                {/* Results Section */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-6"
                >
                    {!result && !loading && (
                        <div className="h-full flex flex-col items-center justify-center glass-panel-heavy p-12 text-center text-slate-500 dark:text-gray-500">
                            <Sprout size={64} className="mb-4 opacity-20" />
                            <p>{t('enter_details_prompt')}</p>
                            <div className="mt-8 grid grid-cols-2 gap-4 text-xs text-gray-600">
                                <div className="p-3 bg-white dark:bg-white/5 shadow-sm dark:shadow-none rounded-lg border border-slate-200 dark:border-white/5">
                                    <span className="block mb-1 font-bold text-slate-500 dark:text-gray-500">{t('yield_model')}</span>
                                    {t('yield_model_desc')}
                                </div>
                                <div className="p-3 bg-white dark:bg-white/5 shadow-sm dark:shadow-none rounded-lg border border-slate-200 dark:border-white/5">
                                    <span className="block mb-1 font-bold text-slate-500 dark:text-gray-500">{t('risk_model')}</span>
                                    {t('risk_model_desc')}
                                </div>
                            </div>
                        </div>
                    )}

                    {result && (
                        <>
                            {/* Analysis Header Mock */}
                            <div className="glass-panel p-6 flex flex-wrap gap-4 justify-between items-center text-sm text-slate-700 dark:text-gray-300">
                                <div className="flex items-center gap-2">
                                    <TrendingUp className="text-yellow-500 h-4 w-4" />
                                    <span>{t('top_recommendation')}: <span className="text-slate-900 dark:text-white font-medium">{result[0]?.crop_name}</span></span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <AlertTriangle className={result[0]?.predicted_risk_score < 0.5 ? "text-green-500 h-4 w-4" : "text-red-500 h-4 w-4"} />
                                    <span>{t('risk_profile')}: <span className="text-slate-900 dark:text-white font-medium">{result[0]?.risk_level}</span></span>
                                </div>
                            </div>

                            {/* Recommendations List */}
                            <div className="space-y-4">
                                {result.map((rec, index) => (
                                    <motion.div
                                        key={index}
                                        layoutId={`card-${rec.crop_name}`}
                                        onClick={() => setSelectedCrop(rec)}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        whileHover={{ scale: 1.02 }}
                                        transition={{ delay: index * 0.1 }}
                                        className={`relative p-6 rounded-2xl border cursor-pointer transition-colors group ${index === 0 ? "bg-organic-green/10 border-organic-green/50 hover:bg-organic-green/20" : "glass-panel border-white/5 hover:bg-white/5"}`}
                                    >
                                        {index === 0 && (
                                            <div className="absolute top-4 right-4 bg-organic-green text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                                                <TrendingUp size={12} /> #1 {t('choice')}
                                            </div>
                                        )}

                                        <div className="flex justify-between items-start mb-4">
                                            <h3 className="text-2xl font-bold text-slate-900 dark:text-white capitalize group-hover:text-organic-green transition-colors">{rec.crop_name}<span className="text-sm font-normal text-slate-600 dark:text-gray-400 ml-2">{t('rank')} {rec.rank}</span></h3>
                                            <div className="text-right">
                                                <div className="flex items-center gap-1 text-organic-green font-bold text-lg">
                                                    <Sprout size={16} />
                                                    {rec.predicted_yield.toFixed(2)} <span className="text-xs text-slate-600 dark:text-gray-400 font-normal">{rec.yield_unit}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                                            <div className="p-3 bg-white dark:bg-white/5 shadow-sm dark:shadow-none rounded-lg border border-slate-200 dark:border-white/5">
                                                <div className="text-slate-600 dark:text-gray-400 mb-1">{t('potential_revenue')}</div>
                                                <div className="text-slate-900 dark:text-white font-medium flex items-center gap-2">
                                                    ₹{(rec.expected_revenue || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                                                    <span className="text-xs text-slate-500 dark:text-gray-500">/ ha</span>
                                                </div>
                                                <div className="text-[10px] text-green-400 mt-1">
                                                    {(rec.yield_comparison_pct || 0).toFixed(0)}% {t('avg_yield')}
                                                </div>
                                            </div>
                                            <div className="p-3 bg-white dark:bg-white/5 shadow-sm dark:shadow-none rounded-lg border border-slate-200 dark:border-white/5">
                                                <div className="text-slate-600 dark:text-gray-400 mb-1">{t('value_at_risk')}</div>
                                                <div className={`font-medium flex items-center gap-2 ${rec.predicted_risk_score < 0.5 ? 'text-green-400' : 'text-red-400'}`}>
                                                    ₹{(rec.potential_loss || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                                                </div>
                                                <div className="text-[10px] text-slate-500 dark:text-gray-500 mt-1">
                                                    {t('risk')}: {(rec.predicted_risk_score * 100).toFixed(1)}%
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-gray-500 mt-2">
                                            <span>{t('view_details')}</span>
                                            <Info size={14} />
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </>
                    )}

                    {error && (
                        <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-200 text-center">
                            {error}
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    );
};

export default CropRecommendation;
