import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  ArrowLeft, FileText, MapPin, User, Calendar, CheckCircle, AlertTriangle 
} from 'lucide-react';
import { getApiUrl } from '../../config/api';

const ClaimDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [claim, setClaim] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchClaim = async () => {
            try {
                // Ideally: axios.get(getApiUrl(`admin/claims/${id}`))
                // Fallback: Using inspections endpoint to verify if it has inspection data
                const res = await axios.get(getApiUrl('inspections/assignments'));
                const found = res.data.find(c => c.id === id);
                if (found) {
                  setClaim(found);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchClaim();
    }, [id]);

    if (loading) return <div className="p-10 text-center">Loading Claim Details...</div>;
    if (!claim) return <div className="p-10 text-center">Claim not found or access denied.</div>;

    const inspection = claim.inspection_report || {};

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <button 
                onClick={() => navigate(-1)} 
                className="flex items-center text-slate-500 dark:text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
            >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Claims
            </button>

            <header className="flex justify-between items-start">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                            Claim #{claim.reference_no}
                        </h1>
                        <span className={`px-3 py-1 rounded-full text-sm font-bold capitalize 
                            ${claim.status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                            {claim.status}
                        </span>
                    </div>
                    <p className="text-slate-500 dark:text-gray-500 dark:text-gray-400 flex items-center gap-2">
                        <Calendar size={16} /> Submitted on {new Date(claim.created_at).toLocaleDateString()}
                    </p>
                </div>
                
                <div className="flex gap-3">
                    {claim.inspection_status === 'report_submitted' && (
                        <a 
                            href={`${getApiUrl(`inspections/generate-pdf/${claim.id}`)}`} 
                            target="_blank" 
                            rel="noreferrer"
                            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-blue-900/20 transition-all hover:scale-105"
                        >
                            <FileText size={20} />
                            Generate Official PDF
                        </a>
                    )}
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Info */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Farmer Details */}
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2 dark:text-white">
                            <User size={20} className="text-green-500" /> Farmer Profile
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs text-slate-500 dark:text-gray-500 uppercase font-bold">Name</label>
                                <p className="font-medium dark:text-gray-200">{claim.farmer_profiles?.name || 'N/A'}</p>
                            </div>
                            <div>
                                <label className="text-xs text-slate-500 dark:text-gray-500 uppercase font-bold">District</label>
                                <p className="font-medium dark:text-gray-200">{claim.farmer_profiles?.district || 'N/A'}</p>
                            </div>
                            <div>
                                <label className="text-xs text-slate-500 dark:text-gray-500 uppercase font-bold">Phone</label>
                                <p className="font-medium dark:text-gray-200">{claim.farmer_phone || 'N/A'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Inspection Report */}
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2 dark:text-white">
                            <MapPin size={20} className="text-blue-500" /> Field Inspection Report
                        </h3>
                        
                        {claim.inspection_status === 'report_submitted' ? (
                            <div className="space-y-4">
                                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-xl border border-green-100 dark:border-green-900/30 flex items-start gap-3">
                                    <CheckCircle className="text-green-600 dark:text-green-400 mt-1" size={20} />
                                    <div>
                                        <h4 className="font-bold text-green-800 dark:text-green-300">Verified On-Site</h4>
                                        <p className="text-sm text-green-700 dark:text-green-400">
                                            Inspector visited on {new Date(inspection.visited_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="p-4 bg-gray-50 dark:bg-slate-800 rounded-xl">
                                        <span className="block text-sm text-slate-500 dark:text-gray-500 mb-1">Loss Estimate</span>
                                        <span className="text-3xl font-bold text-red-500">{inspection.loss_estimate}%</span>
                                    </div>
                                    <div className="p-4 bg-gray-50 dark:bg-slate-800 rounded-xl">
                                        <span className="block text-sm text-slate-500 dark:text-gray-500 mb-1">Inspector</span>
                                        <span className="text-lg font-bold dark:text-white">{inspection.inspector_id}</span>
                                    </div>
                                </div>
                                
                                <div>
                                    <h4 className="font-bold mb-2 text-sm uppercase text-slate-500 dark:text-gray-500">Remarks</h4>
                                    <p className="p-4 bg-gray-50 dark:bg-slate-800 rounded-xl text-gray-700 dark:text-gray-300 italic">
                                        "{inspection.remarks}"
                                    </p>
                                </div>

                                {inspection.geo_photos && (
                                    <div className="grid grid-cols-3 gap-2">
                                        {inspection.geo_photos.map((photo, i) => (
                                            <img key={i} src={photo} alt="Evidence" className="w-full h-24 object-cover rounded-lg" />
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-slate-500 dark:text-gray-500 bg-gray-50 dark:bg-slate-800/50 rounded-xl border border-dashed dark:border-slate-700">
                                <AlertTriangle className="mx-auto mb-2 text-yellow-500" />
                                <p>Inspection Pending or Not Assigned</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar Info */}
                <div className="space-y-6">
                     <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800">
                        <h3 className="text-sm font-bold uppercase text-slate-500 dark:text-gray-500 mb-4">Claim Parameters</h3>
                        <div className="space-y-3">
                             <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">Crop</span>
                                <span className="font-medium dark:text-white">{claim.crop_name || 'N/A'}</span>
                             </div>
                             <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">Land Size</span>
                                <span className="font-medium dark:text-white">{claim.land_size} {claim.land_unit}</span>
                             </div>
                             <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">NDVI Value</span>
                                <span className="font-medium dark:text-white">{claim.ndvi_value}</span>
                             </div>
                        </div>
                     </div>
                </div>
            </div>
        </div>
    );
};

export default ClaimDetail;
