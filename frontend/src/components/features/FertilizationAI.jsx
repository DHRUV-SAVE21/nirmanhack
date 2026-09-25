import React from 'react';
import { Sprout, TrendingUp, AlertCircle } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';

const data = [
    { name: 'N', value: 80, required: 100 },
    { name: 'P', value: 40, required: 50 },
    { name: 'K', value: 90, required: 80 },
];

const FertilizationAI = () => {
    return (
        <div className="glass-panel p-6">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-yellow-500/20 rounded-lg text-yellow-500">
                    <Sprout size={24} />
                </div>
                <div>
                    <h3 className="text-lg font-bold">Soil Health & NPK</h3>
                    <p className="text-sm text-slate-600 dark:text-gray-400">Last scanned: Today</p>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                {/* Chart */}
                <div className="h-40 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data}>
                            <XAxis dataKey="name" tick={{ fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                            <Bar dataKey="value" fill="#facc15" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* AI Insight */}
                <div className="flex flex-col justify-center space-y-3">
                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                        <div className="flex items-center gap-2 text-red-400 text-xs font-bold mb-1">
                            <AlertCircle size={14} />
                            <span>PHOSPHORUS LOW</span>
                        </div>
                        <p className="text-xs text-slate-700 dark:text-gray-300">
                            Apply 20kg <span className="text-slate-900 dark:text-white font-bold">DAP</span> per acre within 2 days.
                        </p>
                    </div>

                    <button className="w-full py-2 bg-white dark:bg-white/5 shadow-sm dark:shadow-none hover:bg-white/10 border border-slate-200 dark:border-white/10 rounded-lg text-xs font-medium transition-colors">
                        View Schedule
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FertilizationAI;
