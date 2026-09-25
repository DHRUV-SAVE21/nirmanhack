import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const InputField = ({ label, name, value, onChange, placeholder, type = "text" }) => (
    <div className="flex flex-col gap-1">
        <label className="text-slate-600 dark:text-gray-400 text-sm">{label}</label>
        <input
            type={type}
            name={name}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            className="bg-slate-800 border border-slate-700 rounded-lg p-3 text-slate-900 dark:text-white focus:border-blue-500 outline-none"
        />
    </div>
);

const SectionTitle = ({ title, icon }) => (
    <div className="flex items-center gap-2 mb-4 mt-6 pb-2 border-b border-gray-700">
        <span className="text-xl">{icon}</span>
        <h3 className="text-lg font-bold text-gray-200">{title}</h3>
    </div>
);

const InsuranceForm = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        farmer_name: "", guardian_name: "", mobile: "", aadhaar: "", address: "",
        account_holder: "", bank_name: "", branch_name: "", account_number: "", ifsc: "",
        survey_no: "", village: "", crop_name: "", sowing_date: "", area_insured: "", loss_date: "", loss_cause: "Drought", loss_percentage: ""
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleDownloadPDF = async () => {
        setLoading(true);
        const apiUrl = import.meta.env.VITE_API_BASE_URL || 'https://let-go-3-0.onrender.com';
        try {
            const response = await axios.post(`${apiUrl}/api/feature2/claim/generate-pdf`, formData, {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Claim_Form_${formData.aadhaar.slice(-4) || 'Draft'}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error(error);
            alert("Failed to generate PDF. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = () => {
        alert("This feature is remaining");
        // In a real flow: Submit to backend DB
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white p-4 lg:p-10 font-sans">
            <div className="max-w-4xl mx-auto bg-white dark:bg-slate-900 rounded-3xl border border-gray-800 shadow-2xl overflow-hidden">

                {/* HEADER */}
                <div className="bg-gradient-to-r from-yellow-600 to-amber-700 p-6 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <span>📜</span> Crop Insurance Claim
                        </h1>
                        <p className="text-yellow-100/80 text-sm mt-1">Pradhan Mantri Fasal Bima Yojana (PMFBY)</p>
                    </div>
                    <button onClick={() => navigate(-1)} className="bg-black/20 hover:bg-black/40 px-4 py-2 rounded-lg text-sm transition-all">
                        ← Back to Monitor
                    </button>
                </div>

                {/* FORM BODY */}
                <div className="p-8">
                    <p className="text-slate-600 dark:text-gray-400 mb-6 text-sm">Please fill the details below to generate your claim application. All fields are required for processing.</p>

                    {/* 1. Personal Details */}
                    <SectionTitle title="Farmer Identity Details" icon="👤" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <InputField label="Farmer Full Name" name="farmer_name" placeholder="As per Aadhaar" value={formData.farmer_name} onChange={handleChange} />
                        <InputField label="Father/Husband Name" name="guardian_name" placeholder="Name" value={formData.guardian_name} onChange={handleChange} />
                        <InputField label="Mobile Number" name="mobile" placeholder="10-digit number" value={formData.mobile} onChange={handleChange} />
                        <InputField label="Aadhaar Number" name="aadhaar" placeholder="12-digit UID" value={formData.aadhaar} onChange={handleChange} />
                        <div className="md:col-span-2">
                            <InputField label="Permanent Address" name="address" placeholder="Village, Post, Dist, State" value={formData.address} onChange={handleChange} />
                        </div>
                    </div>

                    {/* 2. Bank Details */}
                    <SectionTitle title="Bank Account (For DBT)" icon="🏦" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <InputField label="Bank Name" name="bank_name" placeholder="e.g. SBI" value={formData.bank_name} onChange={handleChange} />
                        <InputField label="Branch Name" name="branch_name" placeholder="Branch" value={formData.branch_name} onChange={handleChange} />
                        <InputField label="Account Number" name="account_number" placeholder="Account No." value={formData.account_number} onChange={handleChange} />
                        <InputField label="IFSC Code" name="ifsc" placeholder="IFSC" value={formData.ifsc} onChange={handleChange} />
                        <div className="md:col-span-2">
                            <InputField label="Account Holder Name" name="account_holder" placeholder="Should match Farmer Name" value={formData.account_holder} onChange={handleChange} />
                        </div>
                    </div>

                    {/* 3. Crop Details */}
                    <SectionTitle title="Crop Loss Details" icon="🌾" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <InputField label="Survey / Khasra No" name="survey_no" placeholder="Land Record No." value={formData.survey_no} onChange={handleChange} />
                        <InputField label="Village / Tehsil" name="village" placeholder="Location" value={formData.village} onChange={handleChange} />
                        <InputField label="Crop Name" name="crop_name" placeholder="e.g. Wheat, Rice" value={formData.crop_name} onChange={handleChange} />
                        <InputField label="Estimated Loss %" name="loss_percentage" type="number" placeholder="e.g. 50" value={formData.loss_percentage} onChange={handleChange} />
                        <InputField label="Date of Loss" name="loss_date" type="date" value={formData.loss_date} onChange={handleChange} />
                        <div className="flex flex-col gap-1">
                            <label className="text-slate-600 dark:text-gray-400 text-sm">Cause of Loss</label>
                            <select name="loss_cause" value={formData.loss_cause} onChange={handleChange} className="bg-slate-800 border border-slate-700 rounded-lg p-3 text-slate-900 dark:text-white focus:border-blue-500 outline-none">
                                <option>Drought</option>
                                <option>Flood / Inundation</option>
                                <option>Pest Attack</option>
                                <option>Cyclone / Storm</option>
                                <option>Hailstorm</option>
                            </select>
                        </div>
                    </div>

                    {/* Files Section (Visual Only) */}
                    <SectionTitle title="Required Documents" icon="📎" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-600 dark:text-gray-400">
                        <div className="border border-dashed border-gray-600 rounded-lg p-4 flex items-center justify-between hover:bg-slate-800/50 transition">
                            <span>Aadhaar Card</span>
                            <span className="bg-slate-700 px-2 py-1 rounded text-xs text-slate-900 dark:text-white">Upload</span>
                        </div>
                        <div className="border border-dashed border-gray-600 rounded-lg p-4 flex items-center justify-between hover:bg-slate-800/50 transition">
                            <span>Land Record (RoR)</span>
                            <span className="bg-slate-700 px-2 py-1 rounded text-xs text-slate-900 dark:text-white">Upload</span>
                        </div>
                        <div className="border border-dashed border-gray-600 rounded-lg p-4 flex items-center justify-between hover:bg-slate-800/50 transition">
                            <span>Bank Passbook</span>
                            <span className="bg-slate-700 px-2 py-1 rounded text-xs text-slate-900 dark:text-white">Upload</span>
                        </div>
                        <div className="border border-dashed border-gray-600 rounded-lg p-4 flex items-center justify-between hover:bg-slate-800/50 transition">
                            <span>Loss Photo Evidence</span>
                            <span className="bg-slate-700 px-2 py-1 rounded text-xs text-slate-900 dark:text-white">Upload</span>
                        </div>
                    </div>
                </div>

                {/* FOOTER ACTIONS */}
                <div className="bg-slate-800/50 p-6 border-t border-gray-800 flex flex-col sm:flex-row justify-end gap-4">
                    <button
                        onClick={handleDownloadPDF}
                        disabled={loading}
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-900/20 active:scale-95 disabled:opacity-50"
                    >
                        {loading ? "Generating..." : "📄 Generate Application PDF"}
                    </button>

                    <button
                        onClick={handleSubmit}
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-green-900/20 active:scale-95"
                    >
                        🚀 Submit Claim
                    </button>
                </div>

            </div>
        </div>
    );
};

export default InsuranceForm;
