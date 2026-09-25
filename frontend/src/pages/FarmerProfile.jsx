import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Phone, MapPin, CreditCard, Upload, Save, Check, AlertCircle, Leaf, FileText, Camera, Loader2, CheckCircle } from 'lucide-react';
import { getApiUrl } from '../config/api';

const FarmerProfile = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('personal');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saveMsg, setSaveMsg] = useState(null); // { type: 'success'|'error', text: '' }
    const [profileData, setProfileData] = useState({
        // Personal Details
        full_name: '',
        father_husband_name: '',
        date_of_birth: '',
        gender: 'Male',

        // Contact Details
        mobile_number: '',
        alternate_mobile: '',
        email: '',

        // Address
        address_line1: '',
        address_line2: '',
        village: '',
        district: '',
        state: '',
        pincode: '',

        // Identity
        aadhaar_number: '',
        pan_number: '',
        voter_id: '',

        // Farm Details
        land_size: '',
        land_unit: 'acres',
        survey_number: '',
        land_ownership: 'Owned',
        crops: '',
        category: 'General',

        // Bank Details
        bank_name: '',
        account_number: '',
        ifsc_code: '',
        branch_name: '',

        // NDVI (Auto-calculated)
        last_ndvi_value: null,
        crop_loss_percentage: null
    });

    const [documents, setDocuments] = useState({
        aadhaar_doc: null,
        land_doc: null,
        bank_passbook: null,
        photo: null
    });

    const [profileStatus, setProfileStatus] = useState({
        completed: false,
        verified: false,
        completion_percentage: 0
    });

    useEffect(() => {
        loadProfile();
    }, []);


    // Automatically recalculate percentage whenever profile data changing
    useEffect(() => {
        const requiredFields = [
            'full_name', 'father_husband_name', 'mobile_number', 'aadhaar_number',
            'state', 'district', 'land_size', 'bank_name', 'account_number', 'ifsc_code'
        ];

        const filledFields = requiredFields.filter(field => {
            const val = profileData[field];
            if (typeof val === 'number') return true;
            return val !== undefined && val !== null && val.toString().trim() !== '';
        });

        const percentage = Math.round((filledFields.length / requiredFields.length) * 100);
        setProfileStatus(prev => ({ ...prev, completion_percentage: percentage }));
    }, [profileData]);

    const loadProfile = async () => {
        try {
            setLoading(true);
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const userId = user.user_id || user.id || user.email || 'default';
            const userEmail = user.email || '';
            console.log(`👤 [RegistryRecall] Loading Profile for Registry Access: ID=${userId}`);

            const response = await fetch(getApiUrl(`api/feature4/profile?user_id=${userId}&email=${userEmail}`));
            const data = await response.json();

            if (data.profile) {
                console.log("💎 [RegistryRecall] Profile restored with documents:", !!data.profile.aadhaar_doc_url);
                const profile = data.profile;
                
                // Consistency mapping
                if (!profile.full_name && profile.name) profile.full_name = profile.name;
                if (!profile.mobile_number && profile.phone) profile.mobile_number = profile.phone;

                setProfileData({
                    ...profileData, // Keep defaults
                    ...profile,
                    user_id: userId
                });

                setProfileStatus({
                    completed: profile.profile_completed || false,
                    verified: profile.verified || false,
                    completion_percentage: 0 // Will be recalculated by useEffect
                });
            } else {
                console.warn("❓ [FarmerProfile] No profile found in DB for:", userId);
            }
        } catch (error) {
            console.error('❌ [FarmerProfile] Error loading profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (field, value) => {
        setProfileData(prev => ({ ...prev, [field]: value }));
    };

    const toBase64 = (file) => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });

    const handleFileUpload = async (docType, event) => {
        const file = event.target.files[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            setSaveMsg({ type: 'error', text: '⚠️ File too large (>5MB). Base64 storage might be slow.' });
            return;
        }

        try {
            setSaving(true);
            setSaveMsg({ type: 'success', text: `📸 Processing ${docType.replace('_', ' ')}...` });
            
            const base64 = await toBase64(file);
            setDocuments(prev => ({ ...prev, [docType]: file }));
            
            // Map frontend docType to database column name
            const docMap = {
                'aadhaar_doc': 'aadhaar_doc_url',
                'land_doc': 'land_doc_url',
                'bank_passbook': 'bank_passbook_url',
                'photo': 'photo_url'
            };
            
            const columnName = docMap[docType];
            if (columnName) {
                // 1. Update local state for immediate UI feedback (thumbnails)
                setProfileData(prev => ({ ...prev, [columnName]: base64 }));
                console.log(`✅ [FarmerProfile] Local state updated with ${docType} Base64.`);

                // 2. CRITICAL: AUTO-SAVE TO DB IMMEDIATELY to prevent data loss
                const user = JSON.parse(localStorage.getItem('user') || '{}');
                const userId = user.user_id || user.id || user.email || 'default';
                
                // ATOMIC DOCUMENT VAULT COMMIT
                // Instead of a full profile save, we commit ONLY this document column
                // This mirrors the the high-integrity Land Document storage pattern
                console.log(`🔒 [RegistryVault] Committing ${docType} to secure storage...`);
                
                const response = await fetch(getApiUrl('api/feature4/profile/document'), {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        user_id: userId,
                        column_name: columnName,
                        base64_data: base64
                    })
                });

                if (response.ok) {
                    const result = await response.json();
                    
                    // Update Local State Functionally to avoid race conditions
                    setProfileData(prev => ({
                        ...prev,
                        [columnName]: result.document_url || base64
                    }));

                    setSaveMsg({ type: 'success', text: `✅ ${docType.replace('_', ' ')} Locked & Verified in Registry!` });
                } else {
                    throw new Error("Atomic Registry Sync Failed");
                }
            }
        } catch (error) {
            console.error(`❌ Registry Vault Error:`, error);
            setSaveMsg({ type: 'error', text: `❌ Document storage failed. Large payload rejected by DB.` });
        } finally {
            setSaving(false);
            setTimeout(() => setSaveMsg(null), 3500);
        }
    };

    const handleFinalize = async () => {
        setSaving(true);
        setSaveMsg(null);
        try {
            setSaveMsg({ type: 'success', text: '🔒 Committing final profile data and documents to registry...' });
            
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const userId = user.user_id || user.id || user.email || 'default';

            const profileToSave = {
                ...profileData,
                user_id: userId,
                profile_completed: true, // Mark as 100% complete on finalization
                updated_at: new Date().toISOString()
            };

            console.log("📤 [FarmerProfile] FINALIZING profile with keys:", Object.keys(profileToSave));

            const response = await fetch(getApiUrl('api/feature4/profile'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ profile: profileToSave })
            });

            if (response.ok) {
                const result = await response.json();
                
                // Cache in localStorage for immediate access by other modules
                localStorage.setItem('farmerProfile', JSON.stringify(profileToSave));
                
                // CRITICAL: Update the main 'user' session object so greetings & location update
                const userObj = JSON.parse(localStorage.getItem('user') || '{}');
                const updatedUser = { 
                    ...userObj, 
                    full_name: profileToSave.full_name,
                    village: profileToSave.village,
                    district: profileToSave.district
                };
                localStorage.setItem('user', JSON.stringify(updatedUser));
                
                setSaveMsg({ type: 'success', text: '🏆 Profile Permanent Registry Confirmed! Loading Dashboard...' });
                
                // Recalculate status and set a 100% flag
                setProfileStatus({ completed: true, completion_percentage: 100, verified: true });

                setTimeout(() => {
                    setSaveMsg(null);
                    window.location.reload(); 
                }, 2000);
                setProfileStatus(prev => ({
                    ...prev,
                    completed: profileStatus.completion_percentage >= 80
                }));
            } else {
                const err = await response.json().catch(() => ({}));
                setSaveMsg({ type: 'error', text: `❌ Failed to save: ${err.detail || response.statusText}` });
            }
        } catch (error) {
            console.error('Error saving profile:', error);
            setSaveMsg({ type: 'error', text: '❌ Network error. Check if backend is running.' });
        } finally {
            setSaving(false);
            // Auto-clear message after 5 seconds
            setTimeout(() => setSaveMsg(null), 5000);
        }
    };

    const tabs = [
        { id: 'personal', label: 'Personal', icon: User },
        { id: 'contact', label: 'Contact & Address', icon: MapPin },
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

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                    <div className="text-white text-xl">Loading profile...</div>
                </div>
            </div>
        );
    }

    return (
        <div data-tour="profile-main" className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="bg-gradient-to-r from-emerald-600 to-green-600 rounded-2xl p-6 mb-6 text-white shadow-2xl">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold mb-2">Complete Your Farmer Profile</h1>
                            <p className="text-emerald-100">Fill your details once, use everywhere (Claims, Schemes, Marketplace)</p>
                        </div>
                        <div className="text-center">
                            <div className="text-5xl font-bold mb-2">{profileStatus.completion_percentage}%</div>
                            <div className="text-sm text-emerald-100">Complete</div>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-4 bg-white/20 rounded-full h-3 overflow-hidden">
                        <div
                            className="bg-white h-full transition-all duration-500"
                            style={{ width: `${profileStatus.completion_percentage}%` }}
                        />
                    </div>

                    {profileStatus.completed && (
                        <div className="mt-3 flex items-center gap-2 text-sm bg-white/20 rounded-lg px-4 py-2 w-fit">
                            <Check size={16} />
                            <span>Profile Complete - Ready for Claims!</span>
                        </div>
                    )}

                    {/* Save status message */}
                    {saveMsg && (
                        <div className={`mt-3 px-4 py-2 rounded-lg text-sm font-medium w-fit ${saveMsg.type === 'success' ? 'bg-white/20 text-white' : 'bg-red-500/30 text-red-100'}`}>
                            {saveMsg.text}
                        </div>
                    )}
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                    {tabs.map(tab => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`px-4 py-3 rounded-lg font-medium transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === tab.id
                                    ? 'bg-emerald-600 text-white shadow-lg'
                                    : 'bg-slate-900 text-slate-400 hover:bg-slate-800 border border-slate-700'
                                    }`}
                            >
                                <Icon size={18} />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                {/* Form Content */}
                <div className="bg-white dark:bg-slate-900 border border-slate-800 rounded-xl p-6">
                    {/* Personal Details */}
                    {activeTab === 'personal' && (
                        <div className="space-y-4">
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Personal Details</h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        Full Name <span className="text-red-400">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={profileData.full_name}
                                        onChange={(e) => handleInputChange('full_name', e.target.value)}
                                        className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium"
                                        placeholder="As per Aadhaar"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        Father/Husband Name <span className="text-red-400">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={profileData.father_husband_name}
                                        onChange={(e) => handleInputChange('father_husband_name', e.target.value)}
                                        className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium"
                                        placeholder="S/o or D/o"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Date of Birth</label>
                                    <input
                                        type="date"
                                        value={profileData.date_of_birth}
                                        onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
                                        className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Gender</label>
                                    <select
                                        value={profileData.gender}
                                        onChange={(e) => handleInputChange('gender', e.target.value)}
                                        className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium"
                                    >
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Category</label>
                                    <select
                                        value={profileData.category}
                                        onChange={(e) => handleInputChange('category', e.target.value)}
                                        className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium"
                                    >
                                        <option value="General">General</option>
                                        <option value="OBC">OBC</option>
                                        <option value="SC">SC</option>
                                        <option value="ST">ST</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Contact & Address */}
                    {activeTab === 'contact' && (
                        <div className="space-y-4">
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Contact & Address Details</h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        Mobile Number <span className="text-red-400">*</span>
                                    </label>
                                    <input
                                        type="tel"
                                        value={profileData.mobile_number}
                                        onChange={(e) => handleInputChange('mobile_number', e.target.value)}
                                        className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium"
                                        placeholder="10-digit number"
                                        maxLength="10"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Alternate Mobile</label>
                                    <input
                                        type="tel"
                                        value={profileData.alternate_mobile}
                                        onChange={(e) => handleInputChange('alternate_mobile', e.target.value)}
                                        className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium"
                                        placeholder="Optional"
                                        maxLength="10"
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Email</label>
                                    <input
                                        type="email"
                                        value={profileData.email}
                                        onChange={(e) => handleInputChange('email', e.target.value)}
                                        className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium"
                                        placeholder="Optional"
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Address Line 1</label>
                                    <input
                                        type="text"
                                        value={profileData.address_line1}
                                        onChange={(e) => handleInputChange('address_line1', e.target.value)}
                                        className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium"
                                        placeholder="House No., Street"
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Address Line 2</label>
                                    <input
                                        type="text"
                                        value={profileData.address_line2}
                                        onChange={(e) => handleInputChange('address_line2', e.target.value)}
                                        className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium"
                                        placeholder="Landmark"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Village/Town</label>
                                    <input
                                        type="text"
                                        value={profileData.village}
                                        onChange={(e) => handleInputChange('village', e.target.value)}
                                        className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        District <span className="text-red-400">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={profileData.district}
                                        onChange={(e) => handleInputChange('district', e.target.value)}
                                        className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        State <span className="text-red-400">*</span>
                                    </label>
                                    <select
                                        value={profileData.state}
                                        onChange={(e) => handleInputChange('state', e.target.value)}
                                        className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium"
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
                                        value={profileData.pincode}
                                        onChange={(e) => handleInputChange('pincode', e.target.value)}
                                        className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium"
                                        maxLength="6"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Farm Details */}
                    {activeTab === 'farm' && (
                        <div className="space-y-4">
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Farm Details</h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        Land Size <span className="text-red-400">*</span>
                                    </label>
                                    <div className="flex gap-2">
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={profileData.land_size}
                                            onChange={(e) => handleInputChange('land_size', e.target.value)}
                                            className="flex-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium"
                                        />
                                        <select
                                            value={profileData.land_unit}
                                            onChange={(e) => handleInputChange('land_unit', e.target.value)}
                                            className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium"
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
                                        value={profileData.survey_number}
                                        onChange={(e) => handleInputChange('survey_number', e.target.value)}
                                        className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Land Ownership</label>
                                    <select
                                        value={profileData.land_ownership}
                                        onChange={(e) => handleInputChange('land_ownership', e.target.value)}
                                        className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium"
                                    >
                                        <option value="Owned">Owned</option>
                                        <option value="Leased">Leased</option>
                                        <option value="Shared">Shared</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Crops Grown</label>
                                    <input
                                        type="text"
                                        value={profileData.crops}
                                        onChange={(e) => handleInputChange('crops', e.target.value)}
                                        className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium"
                                        placeholder="Wheat, Rice, Cotton"
                                    />
                                </div>

                                {/* NDVI Display */}
                                {profileData.crop_loss_percentage && (
                                    <div className="md:col-span-2 bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/30 rounded-lg p-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <div className="text-sm text-orange-300 mb-1">Latest NDVI Analysis</div>
                                                <div className="text-2xl font-bold text-orange-400">
                                                    {profileData.crop_loss_percentage}% Crop Loss Detected
                                                </div>
                                                <div className="text-xs text-orange-300 mt-1">
                                                    NDVI Value: {profileData.last_ndvi_value}
                                                </div>
                                            </div>
                                            <Leaf size={48} className="text-orange-400" />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Identity & Bank */}
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
                                            value={profileData.aadhaar_number}
                                            onChange={(e) => handleInputChange('aadhaar_number', e.target.value)}
                                            className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium"
                                            placeholder="12-digit Aadhaar"
                                            maxLength="12"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">PAN Number</label>
                                        <input
                                            type="text"
                                            value={profileData.pan_number}
                                            onChange={(e) => handleInputChange('pan_number', e.target.value.toUpperCase())}
                                            className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium"
                                            placeholder="ABCDE1234F"
                                            maxLength="10"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Voter ID</label>
                                        <input
                                            type="text"
                                            value={profileData.voter_id}
                                            onChange={(e) => handleInputChange('voter_id', e.target.value)}
                                            className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Bank Details (For Direct Benefit Transfer)</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                            Bank Name <span className="text-red-400">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={profileData.bank_name}
                                            onChange={(e) => handleInputChange('bank_name', e.target.value)}
                                            className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium"
                                            placeholder="e.g., State Bank of India"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Branch Name</label>
                                        <input
                                            type="text"
                                            value={profileData.branch_name}
                                            onChange={(e) => handleInputChange('branch_name', e.target.value)}
                                            className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                            Account Number <span className="text-red-400">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={profileData.account_number}
                                            onChange={(e) => handleInputChange('account_number', e.target.value)}
                                            className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                            IFSC Code <span className="text-red-400">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={profileData.ifsc_code}
                                            onChange={(e) => handleInputChange('ifsc_code', e.target.value.toUpperCase())}
                                            className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium"
                                            placeholder="SBIN0001234"
                                            maxLength="11"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Documents */}
                    {activeTab === 'documents' && (
                        <div className="space-y-4">
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Upload Documents</h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className={`bg-slate-800 rounded-lg p-4 border-2 border-dashed transition-all relative h-32 flex flex-col justify-center overflow-hidden ${profileData.aadhaar_doc_url ? 'border-emerald-500/50' : 'border-slate-700 hover:border-emerald-500'}`}>
                                    <label className="cursor-pointer block h-full">
                                        <div className="flex items-center gap-3 mb-2">
                                            <Camera className="text-emerald-400" size={24} />
                                            <span className="text-slate-900 dark:text-white font-medium">Aadhaar Card</span>
                                            {profileData.aadhaar_doc_url && <div className="ml-auto bg-emerald-500/10 text-emerald-400 text-[10px] px-2 py-0.5 rounded-full border border-emerald-500/20">Stored & Secured</div>}
                                        </div>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => handleFileUpload('aadhaar_doc', e)}
                                            className="hidden"
                                        />
                                        <div className="text-xs text-slate-600 dark:text-slate-400">
                                            {profileData.aadhaar_doc_url ? '✅ Document Uploaded Successfully' : 'Click to upload (JPG, PNG)'}
                                        </div>
                                        {profileData.aadhaar_doc_url && (
                                            <div className="absolute top-0 right-0 w-24 h-full bg-slate-900 border-l border-slate-700 flex items-center justify-center group">
                                                <img src={profileData.aadhaar_doc_url} className="w-full h-full object-cover opacity-50 group-hover:opacity-80 transition-opacity" />
                                                <CheckCircle className="absolute text-emerald-400 drop-shadow-lg" size={32} />
                                            </div>
                                        )}
                                        {saving && <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-10">
                                            <Loader2 className="animate-spin text-emerald-400" size={32} />
                                        </div>}
                                    </label>
                                </div>

                                <div className={`bg-slate-800 rounded-lg p-4 border-2 border-dashed transition-all relative h-32 flex flex-col justify-center overflow-hidden ${profileData.land_doc_url ? 'border-emerald-500/50' : 'border-slate-700 hover:border-emerald-500'}`}>
                                    <label className="cursor-pointer block h-full">
                                        <div className="flex items-center gap-3 mb-2">
                                            <FileText className="text-emerald-400" size={24} />
                                            <span className="text-slate-900 dark:text-white font-medium">Land Records (7/12)</span>
                                            {profileData.land_doc_url && <div className="ml-auto bg-emerald-500/10 text-emerald-400 text-[10px] px-2 py-0.5 rounded-full border border-emerald-500/20">Stored & Secured</div>}
                                        </div>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => handleFileUpload('land_doc', e)}
                                            className="hidden"
                                        />
                                        <div className="text-xs text-slate-600 dark:text-slate-400">
                                            {profileData.land_doc_url ? '✅ Document Uploaded Successfully' : 'Click to upload (JPG, PNG)'}
                                        </div>
                                        {profileData.land_doc_url && (
                                            <div className="absolute top-0 right-0 w-24 h-full bg-slate-900 border-l border-slate-700 flex items-center justify-center group">
                                                <img src={profileData.land_doc_url} className="w-full h-full object-cover opacity-50 group-hover:opacity-80 transition-opacity" />
                                                <CheckCircle className="absolute text-emerald-400 drop-shadow-lg" size={32} />
                                            </div>
                                        )}
                                        {saving && <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-10">
                                            <Loader2 className="animate-spin text-emerald-400" size={32} />
                                        </div>}
                                    </label>
                                </div>

                                <div className={`bg-slate-800 rounded-lg p-4 border-2 border-dashed transition-all relative h-32 flex flex-col justify-center overflow-hidden ${profileData.bank_passbook_url ? 'border-emerald-500/50' : 'border-slate-700 hover:border-emerald-500'}`}>
                                    <label className="cursor-pointer block h-full">
                                        <div className="flex items-center gap-3 mb-2">
                                            <CreditCard className="text-emerald-400" size={24} />
                                            <span className="text-slate-900 dark:text-white font-medium">Bank Passbook</span>
                                            {profileData.bank_passbook_url && <div className="ml-auto bg-emerald-500/10 text-emerald-400 text-[10px] px-2 py-0.5 rounded-full border border-emerald-500/20">Stored & Secured</div>}
                                        </div>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => handleFileUpload('bank_passbook', e)}
                                            className="hidden"
                                        />
                                        <div className="text-xs text-slate-600 dark:text-slate-400">
                                            {profileData.bank_passbook_url ? '✅ Document Uploaded Successfully' : 'Click to upload (JPG, PNG)'}
                                        </div>
                                        {profileData.bank_passbook_url && (
                                            <div className="absolute top-0 right-0 w-24 h-full bg-slate-900 border-l border-slate-700 flex items-center justify-center group">
                                                <img src={profileData.bank_passbook_url} className="w-full h-full object-cover opacity-50 group-hover:opacity-80 transition-opacity" />
                                                <CheckCircle className="absolute text-emerald-400 drop-shadow-lg" size={32} />
                                            </div>
                                        )}
                                        {saving && <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-10">
                                            <Loader2 className="animate-spin text-emerald-400" size={32} />
                                        </div>}
                                    </label>
                                </div>

                                <div className={`bg-slate-800 rounded-lg p-4 border-2 border-dashed transition-all relative h-32 flex flex-col justify-center overflow-hidden ${profileData.photo_url ? 'border-emerald-500/50' : 'border-slate-700 hover:border-emerald-500'}`}>
                                    <label className="cursor-pointer block h-full">
                                        <div className="flex items-center gap-3 mb-2">
                                            <User className="text-emerald-400" size={24} />
                                            <span className="text-slate-900 dark:text-white font-medium">Passport Photo</span>
                                            {profileData.photo_url && <div className="ml-auto bg-emerald-500/10 text-emerald-400 text-[10px] px-2 py-0.5 rounded-full border border-emerald-500/20">Stored & Secured</div>}
                                        </div>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => handleFileUpload('photo', e)}
                                            className="hidden"
                                        />
                                        <div className="text-xs text-slate-600 dark:text-slate-400">
                                            {profileData.photo_url ? '✅ Document Uploaded Successfully' : 'Click to upload (JPG, PNG)'}
                                        </div>
                                        {profileData.photo_url && (
                                            <div className="absolute top-0 right-0 w-24 h-full bg-slate-900 border-l border-slate-700 flex items-center justify-center group">
                                                <img src={profileData.photo_url} className="w-full h-full object-cover opacity-50 group-hover:opacity-80 transition-opacity" />
                                                <CheckCircle className="absolute text-emerald-400 drop-shadow-lg" size={32} />
                                            </div>
                                        )}
                                        {saving && <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-10">
                                            <Loader2 className="animate-spin text-emerald-400" size={32} />
                                        </div>}
                                    </label>
                                </div>
                            </div>

                            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mt-6">
                                <div className="flex items-start gap-3">
                                    <AlertCircle className="text-blue-400 mt-0.5" size={20} />
                                    <div className="text-sm text-blue-300">
                                        <p className="font-medium mb-1">Document Guidelines:</p>
                                        <ul className="list-disc list-inside space-y-1 text-blue-200 text-xs">
                                            <li>Upload clear, readable copies of documents</li>
                                            <li>Supported formats: JPG, PNG, PDF (max 5MB each)</li>
                                            <li>Ensure all text is visible and not blurred</li>
                                            <li>These documents will be used for claim verification</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="mt-6 flex gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-slate-900 dark:text-white rounded-lg font-medium transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleFinalize}
                        disabled={saving}
                        className="flex-1 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-slate-900 dark:text-white rounded-lg font-bold transition-colors flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
                    >
                        {saving ? (
                            <>
                                <Loader2 className="animate-spin" size={20} />
                                <span>Finalizing...</span>
                            </>
                        ) : (
                            <>
                                <Check size={20} />
                                <span>Finish & Finalize Profile</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FarmerProfile;
