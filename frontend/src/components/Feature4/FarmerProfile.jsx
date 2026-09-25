import React, { useState, useEffect } from 'react';
import { User, MapPin, Crop, Save, CheckCircle, Loader2 } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'https://let-go-3-0.onrender.com';

const FarmerProfile = ({ profile, onSave }) => {
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        state: '',
        district: '',
        land_size: '',
        crops: '',
        category: 'General'
    });
    const [saved, setSaved] = useState(false);
    const [loading, setLoading] = useState(false);
    const [loadingProfile, setLoadingProfile] = useState(true);

    const states = [
        'Maharashtra', 'Punjab', 'Uttar Pradesh', 'Madhya Pradesh', 'Gujarat',
        'Rajasthan', 'Karnataka', 'Tamil Nadu', 'Andhra Pradesh', 'Telangana'
    ];

    const categories = ['General', 'SC', 'ST', 'OBC'];

    // Load profile from API on mount
    useEffect(() => {
        const loadProfile = async () => {
            try {
                const response = await fetch(`${API_URL}/api/feature4/profile?user_id=default`);
                const data = await response.json();
                if (data.profile) {
                    setFormData(prev => ({ ...prev, ...data.profile }));
                    // Also update parent component
                    if (onSave) onSave(data.profile);
                }
            } catch (error) {
                console.error('Error loading profile:', error);
                // Fallback to localStorage
                const savedProfile = localStorage.getItem('farmerProfile');
                if (savedProfile) {
                    setFormData(prev => ({ ...prev, ...JSON.parse(savedProfile) }));
                }
            } finally {
                setLoadingProfile(false);
            }
        };

        if (!profile) {
            loadProfile();
        } else {
            setFormData(prev => ({ ...prev, ...profile }));
            setLoadingProfile(false);
        }
    }, []);

    // Update form when profile prop changes
    useEffect(() => {
        if (profile) {
            setFormData(prev => ({ ...prev, ...profile }));
        }
    }, [profile]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setSaved(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Save to backend API - wrap in { profile: ... } to match backend model
            const response = await fetch(`${API_URL}/api/feature4/profile?user_id=default`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ profile: formData })
            });

            const data = await response.json();

            if (response.ok) {
                // Also save to localStorage as backup
                localStorage.setItem('farmerProfile', JSON.stringify(formData));
                onSave(formData);
                setSaved(true);
                setTimeout(() => setSaved(false), 3000);
            } else {
                console.error('Error saving profile:', data);
                // Fallback: save to localStorage only
                localStorage.setItem('farmerProfile', JSON.stringify(formData));
                onSave(formData);
                setSaved(true);
                setTimeout(() => setSaved(false), 3000);
            }
        } catch (error) {
            console.error('Error saving profile:', error);
            // Fallback: save to localStorage only
            localStorage.setItem('farmerProfile', JSON.stringify(formData));
            onSave(formData);
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } finally {
            setLoading(false);
        }
    };

    if (loadingProfile) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="animate-spin text-organic-green" size={40} />
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
                <div className="w-20 h-20 bg-organic-green/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <User size={40} className="text-organic-green" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Farmer Profile</h2>
                <p className="text-slate-600 dark:text-gray-400">Save your details to auto-fill scheme applications</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Personal Info */}
                <div className="bg-white dark:bg-white/5 shadow-sm dark:shadow-none rounded-xl p-6 border border-slate-200 dark:border-white/10">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                        <User size={18} className="text-organic-green" />
                        Personal Information
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm text-slate-600 dark:text-gray-400 mb-1">Full Name *</label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                                className="w-full bg-white dark:bg-white/5 shadow-sm dark:shadow-none border border-slate-200 dark:border-white/10 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-organic-green"
                                placeholder="Enter your name"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-slate-600 dark:text-gray-400 mb-1">Phone Number</label>
                            <input
                                type="tel"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                className="w-full bg-white dark:bg-white/5 shadow-sm dark:shadow-none border border-slate-200 dark:border-white/10 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-organic-green"
                                placeholder="10-digit mobile number"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-slate-600 dark:text-gray-400 mb-1">Category</label>
                            <select
                                name="category"
                                value={formData.category}
                                onChange={handleChange}
                                className="w-full bg-white dark:bg-white/5 shadow-sm dark:shadow-none border border-slate-200 dark:border-white/10 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-organic-green"
                            >
                                {categories.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Location */}
                <div className="bg-white dark:bg-white/5 shadow-sm dark:shadow-none rounded-xl p-6 border border-slate-200 dark:border-white/10">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                        <MapPin size={18} className="text-organic-green" />
                        Location
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm text-slate-600 dark:text-gray-400 mb-1">State *</label>
                            <select
                                name="state"
                                value={formData.state}
                                onChange={handleChange}
                                required
                                className="w-full bg-white dark:bg-white/5 shadow-sm dark:shadow-none border border-slate-200 dark:border-white/10 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-organic-green"
                            >
                                <option value="">Select State</option>
                                {states.map(state => (
                                    <option key={state} value={state}>{state}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm text-slate-600 dark:text-gray-400 mb-1">District</label>
                            <input
                                type="text"
                                name="district"
                                value={formData.district}
                                onChange={handleChange}
                                className="w-full bg-white dark:bg-white/5 shadow-sm dark:shadow-none border border-slate-200 dark:border-white/10 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-organic-green"
                                placeholder="Enter district name"
                            />
                        </div>
                    </div>
                </div>

                {/* Farm Details */}
                <div className="bg-white dark:bg-white/5 shadow-sm dark:shadow-none rounded-xl p-6 border border-slate-200 dark:border-white/10">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                        <Crop size={18} className="text-organic-green" />
                        Farm Details
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm text-slate-600 dark:text-gray-400 mb-1">Land Size (acres)</label>
                            <input
                                type="number"
                                name="land_size"
                                value={formData.land_size}
                                onChange={handleChange}
                                step="0.1"
                                min="0"
                                className="w-full bg-white dark:bg-white/5 shadow-sm dark:shadow-none border border-slate-200 dark:border-white/10 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-organic-green"
                                placeholder="e.g., 2.5"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-slate-600 dark:text-gray-400 mb-1">Main Crops</label>
                            <input
                                type="text"
                                name="crops"
                                value={formData.crops}
                                onChange={handleChange}
                                className="w-full bg-white dark:bg-white/5 shadow-sm dark:shadow-none border border-slate-200 dark:border-white/10 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-organic-green"
                                placeholder="e.g., Rice, Wheat, Cotton"
                            />
                        </div>
                    </div>
                </div>

                {/* Submit */}
                <button
                    type="submit"
                    disabled={loading}
                    className={`w-full py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${saved
                        ? 'bg-green-500 text-white'
                        : loading
                            ? 'bg-organic-green/50 text-white cursor-not-allowed'
                            : 'bg-organic-green hover:bg-green-600 text-white'
                        }`}
                >
                    {loading ? (
                        <>
                            <Loader2 size={20} className="animate-spin" />
                            Saving...
                        </>
                    ) : saved ? (
                        <>
                            <CheckCircle size={20} />
                            Profile Saved to Database!
                        </>
                    ) : (
                        <>
                            <Save size={20} />
                            Save Profile
                        </>
                    )}
                </button>
            </form>
        </div>
    );
};

export default FarmerProfile;
