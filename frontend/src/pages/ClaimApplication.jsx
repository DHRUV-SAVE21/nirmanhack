import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Leaf, Upload, Send, Check, AlertCircle, FileText, Camera, MapPin, IndianRupee, TrendingDown, UserCircle } from 'lucide-react';
import { getApiUrl } from '../config/api';

const ClaimApplication = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // NDVI data passed from crop health analysis
    const ndviData = location.state?.ndviData || null;

    const [profile, setProfile] = useState(null);
    const [profileComplete, setProfileComplete] = useState(false);
    const [claimData, setClaimData] = useState({
        scheme_name: 'PM Fasal Bima Yojana',
        claim_type: 'crop_loss',
        crop_name: '',
        land_size: '',
        ndvi_value: ndviData?.ndvi || null,
        crop_loss_percentage: ndviData?.lossPercentage || null,
        claim_amount: '',
        additional_details: ''
    });

    const [documents, setDocuments] = useState({
        crop_photos: [],
        land_doc: null,
        aadhaar_doc: null,
        bank_passbook: null
    });

    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [referenceNumber, setReferenceNumber] = useState('');


    // Helper to convert base64 to File
    const dataURLtoFile = (dataurl, filename) => {
        try {
            let arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1],
                bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
            while (n--) {
                u8arr[n] = bstr.charCodeAt(n);
            }
            return new File([u8arr], filename, { type: mime });
        } catch (e) {
            console.error("Error converting image:", e);
            return null;
        }
    }

    useEffect(() => {
        loadProfile();
        calculateNDVILoss();

        // Auto-load satellite image as proof if available
        if (ndviData?.image) {
            const file = dataURLtoFile(ndviData.image, 'satellite_analysis_proof.png');
            if (file) {
                setDocuments(prev => ({
                    ...prev,
                    crop_photos: [file]
                }));
            }
        }
    }, [ndviData]); // Depend on ndviData to run this check

    useEffect(() => {
        // Auto-calculate claim amount based on loss percentage
        if (claimData.crop_loss_percentage && claimData.land_size) {
            const avgCropValuePerAcre = 50000;
            const totalValue = avgCropValuePerAcre * parseFloat(claimData.land_size);
            const lossAmount = (totalValue * parseFloat(claimData.crop_loss_percentage)) / 100;
            setClaimData(prev => ({
                ...prev,
                claim_amount: Math.round(lossAmount).toString()
            }));
        }
    }, [claimData.crop_loss_percentage, claimData.land_size]);

    const loadProfile = async () => {
        try {
            setLoading(true);
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const userId = user.user_id || user.id || 'default';
            console.log("Fetching profile for UserID:", userId);

            const response = await fetch(getApiUrl(`api/feature4/profile?user_id=${userId}`));
            const data = await response.json();
            console.log("Profile Data Received:", data);

            if (data.profile) {
                setProfile(data.profile);

                // Check completion status from DB flag or essential fields
                const isComplete = data.profile.profile_completed === true || (
                    data.profile.full_name &&
                    data.profile.mobile_number
                );

                setProfileComplete(!!isComplete);

                setClaimData(prev => ({
                    ...prev,
                    land_size: data.profile.land_size || '',
                    crop_loss_percentage: data.profile.crop_loss_percentage || prev.crop_loss_percentage
                }));
            } else {
                console.warn("No farmer profile found.");
            }
        } catch (error) {
            console.error('Error loading profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const calculateNDVILoss = async () => {
        if (!ndviData) {
            // Only calculate mock if no real data passed
            const mockNDVI = 0.40 + Math.random() * 0.25;
            const lossPercentage = mockNDVI < 0.5 ? (0.5 - mockNDVI) * 200 : Math.random() * 15;
            // setClaimData logic for mock...
        }
    };

    const handleInputChange = (field, value) => {
        setClaimData(prev => ({ ...prev, [field]: value }));
    };

    const handleFileUpload = (docType, event) => {
        const files = event.target.files;
        if (docType === 'crop_photos') {
            setDocuments(prev => ({
                ...prev,
                crop_photos: [...prev.crop_photos, ...Array.from(files)]
            }));
        } else {
            setDocuments(prev => ({ ...prev, [docType]: files[0] }));
        }
    };

    const fileToBase64 = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });
    };

    const submitClaim = async () => {
        // Validation
        if (!claimData.crop_name) {
            alert('Please enter crop name');
            return;
        }
        if (!claimData.land_size) {
            alert('Please enter land size');
            return;
        }
        if (documents.crop_photos.length === 0) {
            alert('Please upload at least one crop photo showing damage');
            return;
        }

        setSubmitting(true);
        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const userId = user.user_id || user.id || 'default';

            // Convert docs to Base64
            const docUrls = {};

            // Process Crop Photos
            for (let i = 0; i < documents.crop_photos.length; i++) {
                const file = documents.crop_photos[i];
                const b64 = await fileToBase64(file);
                docUrls[`crop_photo_${i + 1}`] = b64;
            }

            // Process other docs
            if (documents.land_doc) {
                docUrls['land_document'] = await fileToBase64(documents.land_doc);
            }
            if (documents.aadhaar_doc) {
                docUrls['aadhaar_card'] = await fileToBase64(documents.aadhaar_doc);
            }
            if (documents.bank_passbook) {
                docUrls['bank_passbook'] = await fileToBase64(documents.bank_passbook);
            }

            // Prepare claim application data
            const applicationData = {
                user_id: userId,
                farmer_name: profile?.full_name || profile?.name || 'Unknown',
                father_husband_name: profile?.father_husband_name || '',
                farmer_phone: profile?.mobile_number || profile?.phone || '',
                aadhaar_number: profile?.aadhaar_number || '',
                scheme_name: claimData.scheme_name,
                claim_type: claimData.claim_type,
                crop_name: claimData.crop_name,
                land_size: parseFloat(claimData.land_size),
                ndvi_value: parseFloat(claimData.ndvi_value),
                crop_loss_percentage: parseFloat(claimData.crop_loss_percentage),
                claim_amount: parseFloat(claimData.claim_amount),
                application_details: {
                    additional_details: claimData.additional_details,
                    submitted_at: new Date().toISOString(),
                    submitted_from: 'Claim Application Portal',
                    ndvi_analysis_date: new Date().toISOString()
                },
                loss_details: {
                    ndvi_value: parseFloat(claimData.ndvi_value),
                    assessment_method: 'Satellite NDVI Analysis',
                    crop_condition: claimData.crop_loss_percentage > 50 ? 'Critical' :
                        claimData.crop_loss_percentage > 30 ? 'Severe' : 'Moderate'
                },
                document_urls: docUrls
            };

            // Call backend API to create claim
            const response = await fetch(getApiUrl('api/feature2/claims/create'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(applicationData)
            });

            if (response.ok) {
                const result = await response.json();
                setReferenceNumber(result.reference_no || 'CLM-2026-' + Date.now().toString().slice(-5));
                setSubmitted(true);
            } else {
                alert('Failed to submit claim. Please try again.');
            }
        } catch (error) {
            console.error('Error submitting claim:', error);
            alert('Error submitting claim. Please check your connection.');
        } finally {
            setSubmitting(false);
        }
    };

    const getLossColor = (lossPercentage) => {
        if (!lossPercentage) return 'text-slate-400';
        const loss = parseFloat(lossPercentage);
        if (loss < 20) return 'text-green-400';
        if (loss < 50) return 'text-yellow-400';
        return 'text-red-400';
    };

    const getLossSeverity = (lossPercentage) => {
        if (!lossPercentage) return 'Unknown';
        const loss = parseFloat(lossPercentage);
        if (loss < 20) return 'Minor Loss';
        if (loss < 40) return 'Moderate Loss';
        if (loss < 60) return 'Severe Loss';
        return 'Critical Loss';
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
                <div className="text-slate-900 dark:text-white text-xl">Loading profile...</div>
            </div>
        );
    }

    if (submitted) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-6">
                <div className="max-w-2xl w-full bg-white dark:bg-slate-900 border border-emerald-500/30 rounded-2xl p-8 text-center">
                    <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Check className="text-emerald-400" size={40} />
                    </div>
                    <h2 className="text-3xl font-bold text-emerald-400 mb-4">Claim Submitted Successfully!</h2>
                    <p className="text-slate-700 dark:text-slate-300 mb-6">Your crop loss claim has been submitted for review</p>

                    <div className="bg-slate-800 rounded-lg p-6 mb-6">
                        <div className="text-sm text-slate-600 dark:text-slate-400 mb-2">Reference Number</div>
                        <div className="text-2xl font-mono font-bold text-emerald-400">{referenceNumber}</div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-slate-800 rounded-lg p-4">
                            <div className="text-xs text-slate-600 dark:text-slate-400 mb-1">Crop Loss</div>
                            <div className={`text-xl font-bold ${getLossColor(claimData.crop_loss_percentage)}`}>
                                {claimData.crop_loss_percentage}%
                            </div>
                        </div>
                        <div className="bg-slate-800 rounded-lg p-4">
                            <div className="text-xs text-slate-600 dark:text-slate-400 mb-1">Claim Amount</div>
                            <div className="text-xl font-bold text-emerald-400">
                                ₹{parseFloat(claimData.claim_amount).toLocaleString('en-IN')}
                            </div>
                        </div>
                    </div>

                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-6">
                        <div className="flex items-start gap-3 text-left">
                            <AlertCircle className="text-blue-400 mt-0.5" size={20} />
                            <div className="text-sm text-blue-300">
                                <p className="font-medium mb-1">What's Next?</p>
                                <ul className="list-disc list-inside space-y-1 text-blue-200">
                                    <li>Admin will review your claim within 48 hours</li>
                                    <li>You'll receive updates via SMS/Email</li>
                                    <li>Track your claim status in "My Claims" section</li>
                                    <li>Payment will be processed after approval</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="flex-1 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-slate-900 dark:text-white rounded-lg font-medium transition-colors"
                        >
                            Back to Dashboard
                        </button>
                        <button
                            onClick={() => window.location.reload()}
                            className="flex-1 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-slate-900 dark:text-white rounded-lg font-medium transition-colors"
                        >
                            Submit Another Claim
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="bg-gradient-to-r from-emerald-600 to-green-600 rounded-2xl p-6 mb-6 text-white shadow-2xl">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                                <FileText size={24} />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold">Apply for Crop Loss Claim</h1>
                                <p className="text-emerald-100">Based on NDVI Satellite Analysis</p>
                            </div>
                        </div>

                        {/* Profile Icon */}
                        <button
                            onClick={() => navigate('/profile')}
                            className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors border border-white/30"
                            title="Complete Your Profile"
                        >
                            <UserCircle size={24} />
                            <div className="text-left">
                                <div className="text-xs text-emerald-100">Your Profile</div>
                                <div className="text-sm font-bold">{profileComplete ? '✓ Complete' : '⚠ Incomplete'}</div>
                            </div>
                        </button>
                    </div>

                    {/* Profile Completion Warning */}
                    {!profileComplete && (
                        <div className="bg-yellow-500/20 border border-yellow-500/40 rounded-lg p-3 mb-4 flex items-center gap-2">
                            <AlertCircle className="text-yellow-300" size={20} />
                            <div className="text-sm text-yellow-100">
                                <span className="font-semibold">Profile Incomplete!</span> Please complete your profile with Aadhaar, Bank details to submit claims.
                                <button
                                    onClick={() => navigate('/profile')}
                                    className="ml-2 underline font-medium hover:text-white"
                                >
                                    Complete Now →
                                </button>
                            </div>
                        </div>
                    )}

                    {/* NDVI Analysis Card */}
                    <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 border border-white/30">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <div className="flex items-center gap-2 text-sm text-emerald-100 mb-1">
                                    <Leaf size={16} />
                                    NDVI Value
                                </div>
                                <div className="text-2xl font-bold">{claimData.ndvi_value || 'Calculating...'}</div>
                            </div>
                            <div>
                                <div className="flex items-center gap-2 text-sm text-emerald-100 mb-1">
                                    <TrendingDown size={16} />
                                    Crop Loss Detected
                                </div>
                                <div className={`text-2xl font-bold ${getLossColor(claimData.crop_loss_percentage)}`}>
                                    {claimData.crop_loss_percentage || 'Calculating...'}%
                                </div>
                            </div>
                            <div>
                                <div className="text-sm text-emerald-100 mb-1">Loss Severity</div>
                                <div className="text-xl font-semibold">
                                    {getLossSeverity(claimData.crop_loss_percentage)}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Farmer Details (Auto-filled) */}
                <div className="bg-white dark:bg-slate-900 border border-slate-800 rounded-xl p-6 mb-6">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                        <Check className="text-emerald-400" size={20} />
                        Farmer Details (Auto-filled from Profile)
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <div className="text-xs text-slate-600 dark:text-slate-400 mb-1">Full Name</div>
                            <div className="text-sm text-slate-900 dark:text-white font-medium">{profile?.full_name || profile?.name || 'N/A'}</div>
                        </div>
                        <div>
                            <div className="text-xs text-slate-600 dark:text-slate-400 mb-1">Father/Husband</div>
                            <div className="text-sm text-slate-900 dark:text-white">{profile?.father_husband_name || 'N/A'}</div>
                        </div>
                        <div>
                            <div className="text-xs text-slate-600 dark:text-slate-400 mb-1">Mobile</div>
                            <div className="text-sm text-slate-900 dark:text-white">{profile?.mobile_number || profile?.phone || 'N/A'}</div>
                        </div>
                        <div>
                            <div className="text-xs text-slate-600 dark:text-slate-400 mb-1">Aadhaar</div>
                            <div className="text-sm text-slate-900 dark:text-white font-mono">{profile?.aadhaar_number || 'N/A'}</div>
                        </div>
                        <div>
                            <div className="text-xs text-slate-600 dark:text-slate-400 mb-1">Email</div>
                            <div className="text-sm text-slate-900 dark:text-white">{profile?.email || 'N/A'}</div>
                        </div>
                        <div>
                            <div className="text-xs text-slate-600 dark:text-slate-400 mb-1">State</div>
                            <div className="text-sm text-slate-900 dark:text-white">{profile?.state || 'N/A'}</div>
                        </div>
                        <div className="md:col-span-3">
                            <div className="text-xs text-slate-600 dark:text-slate-400 mb-1">Permanent Address</div>
                            <div className="text-sm text-slate-900 dark:text-white">
                                {[
                                    profile?.address_line1,
                                    profile?.address_line2,
                                    profile?.village,
                                    profile?.district,
                                    profile?.state,
                                    profile?.pincode
                                ].filter(Boolean).join(', ') || 'N/A'}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Claim Details Form */}
                <div className="bg-white dark:bg-slate-900 border border-slate-800 rounded-xl p-6 mb-6">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Claim Details</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Scheme Name <span className="text-red-400">*</span>
                            </label>
                            <select
                                value={claimData.scheme_name}
                                onChange={(e) => handleInputChange('scheme_name', e.target.value)}
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            >
                                <option value="PM Fasal Bima Yojana">PM Fasal Bima Yojana</option>
                                <option value="Restructured Weather Based Crop Insurance">RWBCIS</option>
                                <option value="State Crop Insurance">State Crop Insurance</option>
                                <option value="Other">Other Insurance Scheme</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Crop Name <span className="text-red-400">*</span>
                            </label>
                            <input
                                type="text"
                                value={claimData.crop_name}
                                onChange={(e) => handleInputChange('crop_name', e.target.value)}
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                placeholder="e.g., Wheat, Rice, Cotton"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Land Size (acres) <span className="text-red-400">*</span>
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                value={claimData.land_size}
                                onChange={(e) => handleInputChange('land_size', e.target.value)}
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                placeholder="Enter land size"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Estimated Claim Amount (₹)
                                <span className="block text-xs text-slate-500 font-normal mt-1">
                                    Based on ₹50,000/acre × Land Size × Loss %
                                </span>
                            </label>
                            <div className="w-full bg-slate-800 border border-emerald-500/50 rounded-lg px-4 py-2 text-emerald-400 font-bold text-lg flex items-center gap-2">
                                <IndianRupee size={20} />
                                {claimData.claim_amount ? parseFloat(claimData.claim_amount).toLocaleString('en-IN') : '0'}
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Additional Details</label>
                        <textarea
                            value={claimData.additional_details}
                            onChange={(e) => handleInputChange('additional_details', e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 h-24"
                            placeholder="Describe the crop damage, weather conditions, or any other relevant information..."
                        />
                    </div>
                </div>

                {/* Document Upload */}
                <div className="bg-white dark:bg-slate-900 border border-slate-800 rounded-xl p-6 mb-6">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                        <Upload size={20} />
                        Upload Supporting Documents
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-slate-800 rounded-lg p-4">
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                <Camera className="inline mr-1" size={16} />
                                Crop Damage Photos <span className="text-red-400">*</span>
                            </label>
                            <input
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={(e) => handleFileUpload('crop_photos', e)}
                                className="w-full text-sm text-slate-600 dark:text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-emerald-600 file:text-white file:cursor-pointer hover:file:bg-emerald-700"
                            />
                            {documents.crop_photos.length > 0 && (
                                <div className="mt-2 text-xs text-emerald-400">
                                    ✓ {documents.crop_photos.length} photo(s) selected
                                </div>
                            )}
                        </div>

                        <div className="bg-slate-800 rounded-lg p-4">
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Land Document</label>
                            <input
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png"
                                onChange={(e) => handleFileUpload('land_doc', e)}
                                className="w-full text-sm text-slate-600 dark:text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-blue-600 file:text-white file:cursor-pointer hover:file:bg-blue-700"
                            />
                            {documents.land_doc && (
                                <div className="mt-2 text-xs text-blue-400">✓ {documents.land_doc.name}</div>
                            )}
                        </div>

                        <div className="bg-slate-800 rounded-lg p-4">
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Aadhaar Card</label>
                            <input
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png"
                                onChange={(e) => handleFileUpload('aadhaar_doc', e)}
                                className="w-full text-sm text-slate-600 dark:text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-purple-600 file:text-white file:cursor-pointer hover:file:bg-purple-700"
                            />
                            {documents.aadhaar_doc && (
                                <div className="mt-2 text-xs text-purple-400">✓ {documents.aadhaar_doc.name}</div>
                            )}
                        </div>

                        <div className="bg-slate-800 rounded-lg p-4">
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Bank Passbook</label>
                            <input
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png"
                                onChange={(e) => handleFileUpload('bank_passbook', e)}
                                className="w-full text-sm text-slate-600 dark:text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-orange-600 file:text-white file:cursor-pointer hover:file:bg-orange-700"
                            />
                            {documents.bank_passbook && (
                                <div className="mt-2 text-xs text-orange-400">✓ {documents.bank_passbook.name}</div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Submit Button */}
                <div className="flex gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-slate-900 dark:text-white rounded-lg font-medium transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={submitClaim}
                        disabled={submitting}
                        className="flex-1 px-6 py-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-slate-900 dark:text-white rounded-lg font-bold text-lg transition-colors flex items-center justify-center gap-2"
                    >
                        {submitting ? (
                            <>
                                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                                <span>Submitting Claim...</span>
                            </>
                        ) : (
                            <>
                                <Send size={20} />
                                <span>Submit Claim Application</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ClaimApplication;
