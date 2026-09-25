import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Cloud, Sun, CloudRain, CloudSnow, Wind, Droplets, Thermometer, MapPin, CloudSun, Eye, ArrowUp, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const API_KEY = import.meta.env.VITE_OPEN_WEATHER_MAP_API;

const WeatherIcon = ({ condition, size = 36, className = "" }) => {
    const iconMap = {
        'Clear': Sun,
        'Clouds': Cloud,
        'Rain': CloudRain,
        'Snow': CloudSnow,
        'Wind': Wind,
        'Drizzle': CloudRain,
        'Thunderstorm': CloudRain,
        'Mist': Cloud,
        'Fog': Cloud,
        'Haze': CloudSun,
    };
    const Icon = iconMap[condition] || CloudSun;
    return <Icon size={size} className={className} />;
};

const WeatherForecast = () => {
    const { t } = useTranslation();
    const [forecast, setForecast] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [coords, setCoords] = useState(null);
    const [selectedDay, setSelectedDay] = useState(0);
    const [locationName, setLocationName] = useState('');

    useEffect(() => {
        const fetchLocation = async () => {
            if ("geolocation" in navigator) {
                navigator.geolocation.getCurrentPosition(
                    (position) => setCoords({ lat: position.coords.latitude, lon: position.coords.longitude }),
                    async (err) => {
                        console.warn('Geolocation error, trying IP:', err);
                        try {
                            const res = await fetch('http://ip-api.com/json/');
                            const data = await res.json();
                            if (data.lat && data.lon) {
                                setCoords({ lat: data.lat, lon: data.lon });
                            } else {
                                setCoords({ lat: 20.5937, lon: 78.9629 }); // Center of India
                            }
                        } catch {
                            setCoords({ lat: 20.5937, lon: 78.9629 }); // Center of India
                        }
                    },
                    { enableHighAccuracy: true }
                );
            } else {
                try {
                    const res = await fetch('http://ip-api.com/json/');
                    const data = await res.json();
                    setCoords({ lat: data.lat, lon: data.lon });
                } catch {
                    setCoords({ lat: 20.5937, lon: 78.9629 }); // Center of India
                }
            }
        };
        fetchLocation();
    }, []);

    useEffect(() => {
        if (!coords || !API_KEY) return;

        const fetchWeather = async () => {
            setLoading(true);
            try {
                const forecastRes = await fetch(
                    `https://api.openweathermap.org/data/2.5/forecast?lat=${coords.lat}&lon=${coords.lon}&appid=${API_KEY}&units=metric`
                );
                const forecastData = await forecastRes.json();

                if (forecastData.city) {
                    setLocationName(forecastData.city.name);
                }

                // Group by day
                const dailyForecasts = {};
                forecastData.list?.forEach(item => {
                    const date = new Date(item.dt * 1000).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' });
                    if (!dailyForecasts[date]) {
                        dailyForecasts[date] = {
                            date,
                            fullDate: new Date(item.dt * 1000),
                            temps: [],
                            conditions: [],
                            humidity: [],
                            wind: [],
                            items: []
                        };
                    }
                    dailyForecasts[date].temps.push(item.main.temp);
                    dailyForecasts[date].conditions.push(item.weather[0].main);
                    dailyForecasts[date].humidity.push(item.main.humidity);
                    dailyForecasts[date].wind.push(item.wind.speed);
                    dailyForecasts[date].items.push(item);
                });

                const processedForecast = Object.values(dailyForecasts).slice(0, 5).map(day => {
                    const avgTemp = Math.round(day.temps.reduce((a, b) => a + b, 0) / day.temps.length);
                    const maxTemp = Math.round(Math.max(...day.temps));
                    const minTemp = Math.round(Math.min(...day.temps));
                    const mostCommonCondition = day.conditions.sort((a, b) =>
                        day.conditions.filter(v => v === a).length - day.conditions.filter(v => v === b).length
                    ).pop();
                    const avgHumidity = Math.round(day.humidity.reduce((a, b) => a + b, 0) / day.humidity.length);
                    const avgWind = Math.round(day.wind.reduce((a, b) => a + b, 0) / day.wind.length * 10) / 10;

                    return {
                        date: day.date,
                        fullDate: day.fullDate,
                        temp: avgTemp,
                        maxTemp,
                        minTemp,
                        condition: mostCommonCondition,
                        humidity: avgHumidity,
                        wind: avgWind,
                        items: day.items
                    };
                });

                setForecast(processedForecast);
                setLoading(false);
            } catch (err) {
                console.error('Weather fetch error:', err);
                setError('Failed to load weather data');
                setLoading(false);
            }
        };

        fetchWeather();
    }, [coords]);

    const selected = forecast[selectedDay];

    // Farming advisory based on weather
    const getFarmingAdvisory = (condition, temp) => {
        if (condition === 'Rain' || condition === 'Thunderstorm') return '☔ Avoid spraying pesticides today';
        if (condition === 'Clear' && temp > 35) return '🌡️ High heat - irrigate in evening';
        if (condition === 'Clear' && temp > 25) return '☀️ Good day for field operations';
        if (temp < 15) return '❄️ Protect seedlings from cold';
        return '✅ Normal farming conditions';
    };

    if (loading) {
        return (
            <div className="gov-card h-full flex items-center justify-center p-8">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-3 border-organic-green border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm text-slate-500">Loading weather...</p>
                </div>
            </div>
        );
    }

    if (error || !forecast.length) {
        return (
            <div className="gov-card h-full flex items-center justify-center p-8">
                <p className="text-slate-500 dark:text-slate-400 text-center">{error || 'No weather data available'}</p>
            </div>
        );
    }

    return (
        <div className="gov-card h-full flex flex-col overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <MapPin size={16} className="text-organic-green" />
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{locationName || 'Your Location'}</span>
                </div>
                <span className="text-xs text-slate-600 dark:text-slate-400">{t('5_day_forecast') || '5-Day Forecast'}</span>
            </div>

            {/* Today's Highlight */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={selectedDay}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="p-5 bg-gradient-to-br from-organic-green-50 to-white dark:from-slate-800 dark:to-slate-900"
                >
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{selected?.fullDate?.toLocaleDateString('en-IN', { weekday: 'long', month: 'short', day: 'numeric' })}</p>
                            <div className="flex items-baseline gap-1">
                                <span className="text-5xl font-bold text-slate-900 dark:text-white">{selected?.temp}</span>
                                <span className="text-2xl text-slate-600 dark:text-slate-400">°C</span>
                            </div>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                H: {selected?.maxTemp}° L: {selected?.minTemp}°
                            </p>
                        </div>
                        <div className="text-right">
                            <WeatherIcon condition={selected?.condition} size={64} className="text-organic-green-600 dark:text-organic-green-400" />
                            <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mt-1">{selected?.condition}</p>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-3">
                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                            <Droplets size={16} className="text-blue-500" />
                            <span className="text-sm">{selected?.humidity}%</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                            <Wind size={16} className="text-slate-600 dark:text-slate-400" />
                            <span className="text-sm">{selected?.wind} km/h</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                            <Eye size={16} className="text-slate-600 dark:text-slate-400" />
                            <span className="text-sm">Good</span>
                        </div>
                    </div>

                    {/* Farming Advisory */}
                    <div className="mt-4 py-2 px-3 bg-organic-green/10 dark:bg-organic-green/20 rounded-lg text-sm font-medium text-organic-green-700 dark:text-organic-green-400">
                        {getFarmingAdvisory(selected?.condition, selected?.temp)}
                    </div>
                </motion.div>
            </AnimatePresence>

            {/* Day Selector */}
            <div className="flex-1 flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 gap-1 overflow-x-auto no-scrollbar">
                {forecast.map((day, i) => (
                    <button
                        key={i}
                        onClick={() => setSelectedDay(i)}
                        className={`flex-1 min-w-[60px] py-2 px-2 rounded-xl text-center transition-all ${selectedDay === i
                            ? 'bg-white dark:bg-slate-700 shadow-md border border-organic-green'
                            : 'hover:bg-white/50 dark:hover:bg-slate-700/50'
                            }`}
                    >
                        <p className={`text-xs font-medium mb-1 ${selectedDay === i ? 'text-organic-green' : 'text-slate-500'}`}>
                            {i === 0 ? 'Today' : day.date.split(' ')[0]}
                        </p>
                        <WeatherIcon condition={day.condition} size={20} className={selectedDay === i ? 'text-organic-green mx-auto' : 'text-slate-400 mx-auto'} />
                        <p className={`text-sm font-bold mt-1 ${selectedDay === i ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-300'}`}>
                            {day.temp}°
                        </p>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default WeatherForecast;
