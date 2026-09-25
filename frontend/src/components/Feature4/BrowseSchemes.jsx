import React, { useState, useEffect } from 'react';
import { Search, Filter, Loader2, AlertCircle } from 'lucide-react';
import SchemeCard from './SchemeCard';
import apiClient from '../../config/api';

const BrowseSchemes = ({ profile, onApply }) => {
    const [schemes, setSchemes] = useState([]);
    const [filteredSchemes, setFilteredSchemes] = useState([]);
    const [states, setStates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedState, setSelectedState] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');

    useEffect(() => {
        fetchSchemes();
    }, []);

    useEffect(() => {
        filterSchemes();
    }, [schemes, searchQuery, selectedState, selectedCategory]);

    const fetchSchemes = async () => {
        try {
            setLoading(true);
            setError(null);

            // 1. Fetch States
            try {
                const statesRes = await apiClient.get('/api/subsidies/states');
                if (statesRes.data?.success) {
                    setStates(statesRes.data.data);
                }
            } catch (e) {
                console.warn("Failed to fetch states from API", e);
            }

            // 2. Fetch Schemes
            const schemeBody = {
                 state: profile?.state || null,
                 equipment_type: null
            };

            console.log("Fetching schemes with body:", schemeBody);
            const response = await apiClient.post('/api/subsidies', schemeBody);

            if (response.data?.success && response.data?.data) {
                const subsidyData = response.data.data;
                const central = subsidyData.central_subsidies || [];
                const state = subsidyData.state_subsidies || [];
                
                const allSchemes = [...central, ...state];
                console.log(`Successfully fetched ${allSchemes.length} schemes from backend.`);
                
                if (allSchemes.length === 0) {
                     console.warn("API returned empty schemes list.");
                }

                // Map and ensure consistent category
                const processedSchemes = allSchemes.map(s => ({
                    ...s,
                    category: s.category || (s.state ? "State Scheme" : "Central Scheme")
                }));

                setSchemes(processedSchemes);
            } else {
                throw new Error("Invalid response format from server");
            }
        } catch (err) {
            console.error("Critical error fetching schemes from database:", err);
            setError(`Connection Error: ${err.message || "Failed to reach backend"}`);
            setSchemes([]); // No mock data fallback to avoid confusion
        } finally {
            setLoading(false);
        }
    };

    const filterSchemes = () => {
        let filtered = [...schemes];

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(s =>
                s.scheme_name.toLowerCase().includes(query) ||
                s.description.toLowerCase().includes(query)
            );
        }

        if (selectedState) {
            filtered = filtered.filter(s =>
                s.state === selectedState || s.category === 'Central Scheme'
            );
        }

        if (selectedCategory) {
            filtered = filtered.filter(s => s.category === selectedCategory);
        }

        setFilteredSchemes(filtered);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="animate-spin text-organic-green" size={40} />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-slate-600 dark:text-gray-400">
                <AlertCircle size={40} className="text-red-400 mb-4" />
                <p>{error}</p>
                <button
                    onClick={fetchSchemes}
                    className="mt-4 px-4 py-2 bg-organic-green rounded-lg text-white"
                >
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Filters */}
            <div className="flex flex-wrap gap-4">
                {/* Search */}
                <div className="flex-1 min-w-[200px] relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 dark:text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search schemes..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-white dark:bg-white/5 shadow-sm dark:shadow-none border border-slate-200 dark:border-white/10 rounded-lg pl-10 pr-4 py-2 text-slate-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-organic-green"
                    />
                </div>

                {/* State Filter */}
                <select
                    value={selectedState}
                    onChange={(e) => setSelectedState(e.target.value)}
                    className="bg-white dark:bg-white/5 shadow-sm dark:shadow-none border border-slate-200 dark:border-white/10 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-organic-green"
                >
                    <option value="">All States</option>
                    {states.map(state => (
                        <option key={state} value={state}>{state}</option>
                    ))}
                </select>

                {/* Category Filter */}
                <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="bg-white dark:bg-white/5 shadow-sm dark:shadow-none border border-slate-200 dark:border-white/10 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-organic-green"
                >
                    <option value="">All Categories</option>
                    <option value="Central Scheme">Central Schemes</option>
                    <option value="State Scheme">State Schemes</option>
                </select>
            </div>

            {/* Results Count */}
            <div className="text-sm text-slate-600 dark:text-gray-400">
                Showing {filteredSchemes.length} of {schemes.length} schemes
            </div>

            {/* Schemes Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredSchemes.map((scheme, idx) => (
                    <SchemeCard key={idx} scheme={scheme} onApply={onApply} />
                ))}
            </div>

            {filteredSchemes.length === 0 && (
                <div className="text-center text-slate-600 dark:text-gray-400 py-12">
                    No schemes found matching your criteria.
                </div>
            )}
        </div>
    );
};

export default BrowseSchemes;
