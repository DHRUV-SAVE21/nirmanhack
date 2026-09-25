import React, { useState, useEffect } from 'react';
import { User, Phone, MapPin, CreditCard, Upload, Save, Check, AlertCircle, Leaf, FileText } from 'lucide-react';
import { getApiUrl } from '../../config/api';

const CompleteFarmerProfile = ({ userId, onProfileComplete }) => {
    const [profile, setProfile] = useState({
        // Personal Details
        full_name: '',
        father_husband_name: '',
        date_of_birth: '',
        gender: '',

        // Contact
        mobile_number: '',
        alternate_mobile: '',
        email: '',

        // Identity
        aadhaar_number: '',
        pan_number: '',
        voter_id: '',

        // Address
        address_line1: '',
        address_line2: '',
        village: '',
        district: '',
        state: '',
        pincode: '',

        // Farm Details
        land_size: '',
        land_unit: 'acres',
        survey_number: '',
        land_ownership: 'Owned',

        // Bank Details
        bank_name: '',
        account_number: '',
        ifsc_code: '',
        branch_name: '',

        // Category
        category: 'General',
        farmer_type: 'Small',
        annual_income: '',

        // NDVI & Loss (auto-calculated)
        crop_loss_percentage: null,
        last_ndvi_value: null
    });

    const [documents, setDocuments] = useState({
        aadhaar_doc: null,
        land_doc: null,
        bank_passbook: null,
        photo: null
    });

    const [activeTab, setActiveTab] = useState('personal');
    const [loading, setLoading] = useState(false);
    const [savedSuccessfully, setSavedSuccessfully] = useState(false);

    useEffect(() => {
        loadProfile();
        calculateNDVILoss();
    }, [userId]);

    const loadProfile = async () => {
        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const userIdToUse = userId || user.user_id || user.id;

            const response = await fetch(getApiUrl(`api/feature4/profile?user_id=${userIdToUse}`));
            const data = await response.json();

            if (data.profile) {
                setProfile(prev => ({ ...prev, ...data.profile }));
            }
        } catch (error) {
            console.error('Error loading profile:', error);
        }
    };

    const calculateNDVILoss = async () => {
        // Simulated NDVI calculation - in production, call satellite API
        try {
            // Mock NDVI calculation based on recent crop health data
            const mockNDVI = 0.45 + Math.random() * 0.3; // 0.45-0.75 range
            const lossPercentage = mockNDVI < 0.5 ? (0.5 - mockNDVI) * 200 : 0;

            setProfile(prev => ({
                ...prev,
                last_ndvi_value: mockNDVI.toFixed(3),
                crop_loss_percentage: lossPercentage.toFixed(2)
            }));
        } catch (error) {
            console.error('Error calculating NDVI:', error);
        }
    };

    const handleInputChange = (field, value) => {
        setProfile(prev => ({ ...prev, [field]: value }));
    };

    const handleFileUpload = (docType, event) => {
        const file = event.target.files[0];
        if (file) {
            setDocuments(prev => ({ ...prev, [docType]: file }));
        }
    };

    const saveProfile = async () => {
        setLoading(true);
        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const userIdToUse = userId || user.user_id || user.id || 'default';

            // Save profile data - wrap in { profile: ... } to match backend model
            const response = await fetch(getApiUrl('api/feature4/profile'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    profile: {
                        user_id: userIdToUse,
                        ...profile,
                        profile_completed: true
                    }
                })
            });

            if (response.ok) {
                setSavedSuccessfully(true);
                setTimeout(() => setSavedSuccessfully(false), 3000);

                if (onProfileComplete) {
                    onProfileComplete(profile);
                }
            }
        } catch (error) {
            console.error('Error saving profile:', error);
            alert('Failed to save profile. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const tabs = [
        { id: 'personal', label: 'Personal Details', icon: User },
        { id: 'contact', label: 'Contact & Address', icon: Phone },
        { id: 'farm', label: 'Farm Details', icon: Leaf },
        { id: 'identity', label: 'Identity & Bank', icon: CreditCard },
        { id: 'documents', label: 'Documents', icon: FileText }
    ];

    const indianStates = [
        'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
        'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
        'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
        'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
        'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal'
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="bg-gradient-to-r from-emerald-600 to-green-600 rounded-2xl p-6 mb-6 text-white shadow-2xl">
                    <h1 className="text-3xl font-bold mb-2">Complete Farmer Profile</h1>
                    <p className="text-emerald-100">Fill your details for auto-filled scheme applications</p>

                    {/* NDVI Loss Display */}
                    {profile.crop_loss_percentage && (
                        <div className="mt-4 bg-white/20 backdrop-blur-sm rounded-lg p-4 border border-white/30">
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="text-sm text-emerald-100">NDVI-Based Crop Loss Analysis</div>
                                    <div className="text-2xl font-bold">
                                        {profile.crop_loss_percentage}% Loss Detected
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm text-emerald-100">NDVI Value</div>
                                    <div className="text-xl font-semibold">{profile.last_ndvi_value}</div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Tabs */}
                <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden shadow-xl">
                    <div className="flex border-b border-slate-700 overflow-x-auto">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex-1 flex items-center justify-center gap-2 py-4 px-4 text-sm font-medium transition-all whitespace-nowrap ${activeTab === tab.id
                                        ? 'bg-emerald-600 text-white border-b-2 border-emerald-400'
                                        : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                                        }`}
                                >
                                    <Icon size={18} />
                                    <span className="hidden sm:inline">{tab.label}</span>
                                </button>
                            );
                        })}
                    </div>

                    <div className="p-6">
                        {/* Personal Details Tab */}
                        {activeTab === 'personal' && (
                            <div className="space-y-4">
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Personal Information</h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                            Full Name <span className="text-red-400">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={profile.full_name}
                                            onChange={(e) => handleInputChange('full_name', e.target.value)}
                                            className="w-full bg-white dark:bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                            placeholder="Enter your full name"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                            Father/Husband Name <span className="text-red-400">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={profile.father_husband_name}
                                            onChange={(e) => handleInputChange('father_husband_name', e.target.value)}
                                            className="w-full bg-white dark:bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                            placeholder="Father's or Husband's name"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Date of Birth</label>
                                        <input
                                            type="date"
                                            value={profile.date_of_birth}
                                            onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
                                            className="w-full bg-white dark:bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Gender</label>
                                        <select
                                            value={profile.gender}
                                            onChange={(e) => handleInputChange('gender', e.target.value)}
                                            className="w-full bg-white dark:bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                        >
                                            <option value="">Select</option>
                                            <option value="Male">Male</option>
                                            <option value="Female">Female</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Category</label>
                                        <select
                                            value={profile.category}
                                            onChange={(e) => handleInputChange('category', e.target.value)}
                                            className="w-full bg-white dark:bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                        >
                                            <option value="General">General</option>
                                            <option value="SC">SC</option>
                                            <option value="ST">ST</option>
                                            <option value="OBC">OBC</option>
                                            <option value="EWS">EWS</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Farmer Type</label>
                                        <select
                                            value={profile.farmer_type}
                                            onChange={(e) => handleInputChange('farmer_type', e.target.value)}
                                            className="w-full bg-white dark:bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                        >
                                            <option value="Marginal">Marginal (&lt;1 ha)</option>
                                            <option value="Small">Small (1-2 ha)</option>
                                            <option value="Medium">Medium (2-10 ha)</option>
                                            <option value="Large">Large (&gt;10 ha)</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Contact & Address Tab */}
                        {activeTab === 'contact' && (
                            <div className="space-y-4">
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Contact & Address</h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                            Mobile Number <span className="text-red-400">*</span>
                                        </label>
                                        <input
                                            type="tel"
                                            value={profile.mobile_number}
                                            onChange={(e) => handleInputChange('mobile_number', e.target.value)}
                                            className="w-full bg-white dark:bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                            placeholder="10-digit mobile number"
                                            maxLength={10}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Alternate Mobile</label>
                                        <input
                                            type="tel"
                                            value={profile.alternate_mobile}
                                            onChange={(e) => handleInputChange('alternate_mobile', e.target.value)}
                                            className="w-full bg-white dark:bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                            placeholder="Alternate contact"
                                            maxLength={10}
                                        />
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Email</label>
                                        <input
                                            type="email"
                                            value={profile.email}
                                            onChange={(e) => handleInputChange('email', e.target.value)}
                                            className="w-full bg-white dark:bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                            placeholder="your.email@example.com"
                                        />
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Address Line 1</label>
                                        <input
                                            type="text"
                                            value={profile.address_line1}
                                            onChange={(e) => handleInputChange('address_line1', e.target.value)}
                                            className="w-full bg-white dark:bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                            placeholder="House No., Street"
                                        />
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Address Line 2</label>
                                        <input
                                            type="text"
                                            value={profile.address_line2}
                                            onChange={(e) => handleInputChange('address_line2', e.target.value)}
                                            className="w-full bg-white dark:bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                            placeholder="Locality, Landmark"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Village/Town</label>
                                        <input
                                            type="text"
                                            value={profile.village}
                                            onChange={(e) => handleInputChange('village', e.target.value)}
                                            className="w-full bg-white dark:bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">District</label>
                                        <input
                                            type="text"
                                            value={profile.district}
                                            onChange={(e) => handleInputChange('district', e.target.value)}
                                            className="w-full bg-white dark:bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                            State <span className="text-red-400">*</span>
                                        </label>
                                        <select
                                            value={profile.state}
                                            onChange={(e) => handleInputChange('state', e.target.value)}
                                            className="w-full bg-white dark:bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                        >
                                            <option value="">Select State</option>
                                            {indianStates.map(state => (
                                                <option key={state} value={state}>{state}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Pincode</label>
                                        <input
                                            type="text"
                                            value={profile.pincode}
                                            onChange={(e) => handleInputChange('pincode', e.target.value)}
                                            className="w-full bg-white dark:bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                            placeholder="6-digit pincode"
                                            maxLength={6}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Farm Details Tab */}
                        {activeTab === 'farm' && (
                            <div className="space-y-4">
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Farm Information</h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Land Size</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={profile.land_size}
                                                onChange={(e) => handleInputChange('land_size', e.target.value)}
                                                className="flex-1 bg-white dark:bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                                placeholder="Land size"
                                            />
                                            <select
                                                value={profile.land_unit}
                                                onChange={(e) => handleInputChange('land_unit', e.target.value)}
                                                className="w-24 bg-white dark:bg-slate-900 border border-slate-700 rounded-lg px-2 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                            >
                                                <option value="acres">Acres</option>
                                                <option value="hectares">Hectares</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Survey Number</label>
                                        <input
                                            type="text"
                                            value={profile.survey_number}
                                            onChange={(e) => handleInputChange('survey_number', e.target.value)}
                                            className="w-full bg-white dark:bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                            placeholder="Survey/Khasra number"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Land Ownership</label>
                                        <select
                                            value={profile.land_ownership}
                                            onChange={(e) => handleInputChange('land_ownership', e.target.value)}
                                            className="w-full bg-white dark:bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                        >
                                            <option value="Owned">Owned</option>
                                            <option value="Leased">Leased</option>
                                            <option value="Shared">Shared</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Annual Income (₹)</label>
                                        <input
                                            type="number"
                                            value={profile.annual_income}
                                            onChange={(e) => handleInputChange('annual_income', e.target.value)}
                                            className="w-full bg-white dark:bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                            placeholder="Annual farming income"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Identity & Bank Tab */}
                        {activeTab === 'identity' && (
                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Identity Documents</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                                Aadhaar Number <span className="text-red-400">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={profile.aadhaar_number}
                                                onChange={(e) => handleInputChange('aadhaar_number', e.target.value)}
                                                className="w-full bg-white dark:bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                                placeholder="12-digit Aadhaar"
                                                maxLength={12}
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">PAN Number</label>
                                            <input
                                                type="text"
                                                value={profile.pan_number}
                                                onChange={(e) => handleInputChange('pan_number', e.target.value.toUpperCase())}
                                                className="w-full bg-white dark:bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                                placeholder="PAN Card Number"
                                                maxLength={10}
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Voter ID</label>
                                            <input
                                                type="text"
                                                value={profile.voter_id}
                                                onChange={(e) => handleInputChange('voter_id', e.target.value.toUpperCase())}
                                                className="w-full bg-white dark:bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                                placeholder="Voter ID Number"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Bank Account Details</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Bank Name</label>
                                            <input
                                                type="text"
                                                value={profile.bank_name}
                                                onChange={(e) => handleInputChange('bank_name', e.target.value)}
                                                className="w-full bg-white dark:bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                                placeholder="e.g., State Bank of India"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Account Number</label>
                                            <input
                                                type="text"
                                                value={profile.account_number}
                                                onChange={(e) => handleInputChange('account_number', e.target.value)}
                                                className="w-full bg-white dark:bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                                placeholder="Bank account number"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">IFSC Code</label>
                                            <input
                                                type="text"
                                                value={profile.ifsc_code}
                                                onChange={(e) => handleInputChange('ifsc_code', e.target.value.toUpperCase())}
                                                className="w-full bg-white dark:bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                                placeholder="IFSC Code"
                                                maxLength={11}
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Branch Name</label>
                                            <input
                                                type="text"
                                                value={profile.branch_name}
                                                onChange={(e) => handleInputChange('branch_name', e.target.value)}
                                                className="w-full bg-white dark:bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                                placeholder="Branch name"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Documents Tab */}
                        {activeTab === 'documents' && (
                            <div className="space-y-4">
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Upload Documents</h3>
                                <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">Upload supporting documents for verification</p>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {[
                                        { key: 'aadhaar_doc', label: 'Aadhaar Card', required: true },
                                        { key: 'land_doc', label: 'Land Document (7/12, Patta)', required: true },
                                        { key: 'bank_passbook', label: 'Bank Passbook', required: false },
                                        { key: 'photo', label: 'Passport Photo', required: false }
                                    ].map((doc) => (
                                        <div key={doc.key} className="bg-white dark:bg-slate-900 border border-slate-700 rounded-lg p-4">
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                                {doc.label} {doc.required && <span className="text-red-400">*</span>}
                                            </label>
                                            <div className="flex items-center gap-3">
                                                <label className="flex-1 cursor-pointer">
                                                    <div className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-slate-900 dark:text-white transition-colors">
                                                        <Upload size={18} />
                                                        <span className="text-sm">Choose File</span>
                                                    </div>
                                                    <input
                                                        type="file"
                                                        accept=".pdf,.jpg,.jpeg,.png"
                                                        onChange={(e) => handleFileUpload(doc.key, e)}
                                                        className="hidden"
                                                    />
                                                </label>
                                                {documents[doc.key] && (
                                                    <div className="flex items-center gap-2 text-emerald-400 text-sm">
                                                        <Check size={16} />
                                                        <span className="truncate max-w-[150px]">{documents[doc.key].name}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mt-6">
                                    <div className="flex items-start gap-3">
                                        <AlertCircle className="text-blue-400 mt-0.5" size={20} />
                                        <div className="text-sm text-blue-300">
                                            <p className="font-medium mb-1">Document Guidelines:</p>
                                            <ul className="list-disc list-inside space-y-1 text-blue-200">
                                                <li>Accepted formats: PDF, JPG, JPEG, PNG</li>
                                                <li>Maximum file size: 5MB per document</li>
                                                <li>Documents must be clear and readable</li>
                                                <li>Aadhaar and Land documents are mandatory for claims</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Save Button */}
                        <div className="mt-8 flex items-center justify-between pt-6 border-t border-slate-700">
                            <div className="text-sm text-slate-600 dark:text-slate-400">
                                {activeTab !== 'documents' && (
                                    <span>* Required fields must be filled</span>
                                )}
                            </div>
                            <button
                                onClick={saveProfile}
                                disabled={loading}
                                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-lg text-slate-900 dark:text-white font-medium transition-colors flex items-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                                        <span>Saving...</span>
                                    </>
                                ) : savedSuccessfully ? (
                                    <>
                                        <Check size={20} />
                                        <span>Saved Successfully!</span>
                                    </>
                                ) : (
                                    <>
                                        <Save size={20} />
                                        <span>Save Profile</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CompleteFarmerProfile;
