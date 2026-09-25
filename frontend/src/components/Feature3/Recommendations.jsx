import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, TrendingUp, Droplets, Thermometer, Wind, Sprout, CloudRain, Activity } from 'lucide-react';

const Recommendations = ({ userId = "HARDWARE_DEFAULT" }) => {
    const [recommendations, setRecommendations] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchRecommendations = async () => {
        try {
            const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
            const response = await fetch(`${apiBase}/api/feature3/recommendations?user_id=${userId}`);
            
            if (!response.ok) {
                throw new Error('Failed to fetch recommendations');
            }
            
            const data = await response.json();
            setRecommendations(data);
            setError(null);
        } catch (err) {
            console.error('Error fetching recommendations:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRecommendations();
        // Refresh every 30 seconds
        const interval = setInterval(fetchRecommendations, 30000);
        return () => clearInterval(interval);
    }, [userId]);

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'High': return 'bg-red-500/10 border-red-500 text-red-600';
            case 'Medium': return 'bg-yellow-500/10 border-yellow-500 text-yellow-600';
            case 'Low': return 'bg-green-500/10 border-green-500 text-green-600';
            default: return 'bg-gray-500/10 border-gray-500 text-gray-600';
        }
    };

    const getHealthColor = (score) => {
        if (score >= 80) return 'text-green-500';
        if (score >= 60) return 'text-yellow-500';
        if (score >= 40) return 'text-orange-500';
        return 'text-red-500';
    };

    const getCategoryIcon = (category) => {
        switch (category) {
            case 'Irrigation': return <Droplets className="w-5 h-5" />;
            case 'Climate Control': return <Thermometer className="w-5 h-5" />;
            case 'Disease Prevention': return <AlertCircle className="w-5 h-5" />;
            case 'Fertilization': return <Sprout className="w-5 h-5" />;
            case 'Weather Planning': return <CloudRain className="w-5 h-5" />;
            default: return <Activity className="w-5 h-5" />;
        }
    };

    if (loading) {
        return (
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-lg border border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-lg border border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-3 text-red-500">
                    <AlertCircle className="w-6 h-6" />
                    <div>
                        <h3 className="font-bold">Error Loading Recommendations</h3>
                        <p className="text-sm text-slate-500">{error}</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!recommendations) return null;

    return (
        <div className="space-y-6">
            {/* Health Score Card */}
            <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl p-6 shadow-lg text-white">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold mb-2">Farm Health Score</h2>
                        <p className="text-blue-100">Based on current sensor data</p>
                    </div>
                    <div className="text-center">
                        <div className={`text-6xl font-black ${getHealthColor(recommendations.health_score)}`}>
                            {recommendations.health_score}
                        </div>
                        <div className="text-sm font-medium mt-2 bg-white/20 px-3 py-1 rounded-full">
                            {recommendations.health_status}
                        </div>
                    </div>
                </div>
            </div>

            {/* Sensor Summary */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-2 text-blue-500 mb-2">
                        <Droplets className="w-4 h-4" />
                        <span className="text-xs font-medium">Moisture</span>
                    </div>
                    <div className="text-2xl font-bold text-slate-900 dark:text-white">
                        {recommendations.sensor_summary.soil_moisture}%
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-2 text-red-500 mb-2">
                        <Thermometer className="w-4 h-4" />
                        <span className="text-xs font-medium">Temp</span>
                    </div>
                    <div className="text-2xl font-bold text-slate-900 dark:text-white">
                        {recommendations.sensor_summary.temperature}°C
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-2 text-cyan-500 mb-2">
                        <Wind className="w-4 h-4" />
                        <span className="text-xs font-medium">Humidity</span>
                    </div>
                    <div className="text-2xl font-bold text-slate-900 dark:text-white">
                        {recommendations.sensor_summary.humidity}%
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-2 text-green-500 mb-2">
                        <Sprout className="w-4 h-4" />
                        <span className="text-xs font-medium">NPK</span>
                    </div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white">
                        {recommendations.sensor_summary.npk_status}
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-2 text-purple-500 mb-2">
                        <CloudRain className="w-4 h-4" />
                        <span className="text-xs font-medium">Rain</span>
                    </div>
                    <div className="text-2xl font-bold text-slate-900 dark:text-white">
                        {recommendations.sensor_summary.rain_forecast}mm
                    </div>
                </div>
            </div>

            {/* Priority Actions */}
            {recommendations.priority_actions.length > 0 && (
                <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-500 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                        <AlertCircle className="w-5 h-5 text-red-500" />
                        <h3 className="font-bold text-red-700 dark:text-red-400">Priority Actions Required</h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {recommendations.priority_actions.map((action, idx) => (
                            <span key={idx} className="px-3 py-1 bg-red-500 text-white text-sm font-medium rounded-full capitalize">
                                {action}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Recommendations List */}
            <div className="space-y-4">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <TrendingUp className="w-6 h-6 text-blue-500" />
                    AI Recommendations
                </h3>

                {recommendations.recommendations.map((rec, idx) => (
                    <div
                        key={idx}
                        className={`border-2 rounded-xl p-5 ${getPriorityColor(rec.priority)} transition-all hover:shadow-lg`}
                    >
                        <div className="flex items-start gap-4">
                            <div className="text-3xl">{rec.icon}</div>
                            <div className="flex-1">
                                <div className="flex items-center justify-between mb-2">
                                    <h4 className="font-bold text-lg text-slate-900 dark:text-white">
                                        {rec.title}
                                    </h4>
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${getPriorityColor(rec.priority)}`}>
                                        {rec.priority} Priority
                                    </span>
                                </div>

                                <p className="text-slate-600 dark:text-slate-300 mb-3">
                                    {rec.description}
                                </p>

                                <div className="grid md:grid-cols-2 gap-3">
                                    <div className="bg-white/50 dark:bg-slate-800/50 rounded-lg p-3">
                                        <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                                            Recommended Action
                                        </div>
                                        <div className="text-sm font-bold text-slate-900 dark:text-white">
                                            {rec.action}
                                        </div>
                                    </div>

                                    <div className="bg-white/50 dark:bg-slate-800/50 rounded-lg p-3">
                                        <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                                            Expected Impact
                                        </div>
                                        <div className="text-sm font-bold text-slate-900 dark:text-white">
                                            {rec.impact}
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-3 flex items-center gap-2">
                                    {getCategoryIcon(rec.category)}
                                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                        {rec.category}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Last Updated */}
            <div className="text-center text-xs text-slate-500 dark:text-slate-400">
                Last updated: {new Date(recommendations.timestamp).toLocaleString()}
            </div>
        </div>
    );
};

export default Recommendations;
