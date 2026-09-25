import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Camera, MapPin, Upload, CheckCircle, AlertOctagon } from 'lucide-react';
import { getApiUrl } from '../config/api';
import GooeyNavbar from '../components/layout/GooeyNavbar';

const InspectorDashboard = () => {
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState('list'); // list | form
    const [selectedJob, setSelectedJob] = useState(null);

    // Form Stats
    const [locationVerified, setLocationVerified] = useState(false);
    const [photos, setPhotos] = useState([]);
    const [lossEstimate, setLossEstimate] = useState(0);
    const [remarks, setRemarks] = useState('');

    // Mock ID for current logged in inspector
    const inspectorId = "officer-001"; 

    useEffect(() => {
        fetchJobs();
    }, []);

    const fetchJobs = async () => {
        try {
            const res = await axios.get(`${getApiUrl('inspections/assignments')}?inspector_id=${inspectorId}`);
            setAssignments(res.data);
        } catch (error) {
            console.error("Error loading jobs", error);
        } finally {
            setLoading(false);
        }
    };

    const handleStartInspection = (job) => {
        setSelectedJob(job);
        setView('form');
        // Reset form
        setLocationVerified(false);
        setPhotos([]);
        setLossEstimate(0);
        setRemarks('');
    };

    const verifyLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(() => {
                setLocationVerified(true);
            }, () => alert("Could not verify location. Please enable GPS."));
        }
    };

    const handlePhotoUpload = (e) => {
        // In real app, upload to cloud storage here
        // For now, mock URLs
        const newPhotos = Array.from(e.target.files).map(f => URL.createObjectURL(f));
        setPhotos([...photos, ...newPhotos]);
    };

    const handleSubmitReport = async (e) => {
        e.preventDefault();
        try {
            await axios.post(getApiUrl('inspections/submit-report'), {
                claim_id: selectedJob.id,
                inspector_id: inspectorId,
                visited_at: new Date().toISOString(),
                geo_photos: ["https://placehold.co/600x400/png?text=Farm+Photo+1", "https://placehold.co/600x400/png?text=GeoTag"], // Mocked as we didn't implement upload
                loss_estimate: parseFloat(lossEstimate),
                remarks: remarks
            });
            alert("Report Submitted Successfully!");
            setView('list');
            fetchJobs();
        } catch (error) {
            console.error("Submission failed", error);
            alert("Failed to submit report");
        }
    };

    const [docRequests, setDocRequests] = useState([
        {
            id: "req-001",
            farmer_name: "Dhruv Save",
            scheme: "Major Irrigation - Drip System",
            document_type: "7/12 Extract",
            doc_url: "https://placehold.co/400x600/png?text=Land+Record+Document",
            status: "pending_admin",
            land_coords: [[19.0760, 72.8777], [19.0770, 72.8777], [19.0770, 72.8787], [19.0760, 72.8787]]
        }
    ]);

    const handleApproveDoc = (id) => {
        setDocRequests(prev => prev.map(req => 
            req.id === id ? { ...req, status: 'approved' } : req
        ));
        alert("Land Mapping Confirmed! Hash ID generated: 0x" + Math.random().toString(16).slice(2, 10));
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-950 pb-20">
            <GooeyNavbar />
            
            <div className="pt-24 px-4 max-w-5xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
                        Official Administration Panel
                    </h1>
                    <div className="flex gap-2">
                         <button onClick={() => setView('list')} className={`px-4 py-2 rounded-lg text-sm font-bold ${view === 'list' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-gray-400'}`}>Assignments</button>
                         <button onClick={() => setView('documents')} className={`px-4 py-2 rounded-lg text-sm font-bold ${view === 'documents' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-gray-400'}`}>Land Docs</button>
                    </div>
                </div>

                {view === 'list' && (
                    <div className="space-y-4">
                        {loading && <p>Loading assignments...</p>}
                        {assignments.map(job => (
                            <div key={job.id} className="bg-white dark:bg-slate-900 p-5 rounded-xl shadow-sm border border-gray-200 dark:border-slate-800">
                                <div className="flex justify-between mb-2">
                                    <span className="font-mono text-xs text-slate-500 dark:text-gray-500">{job.reference_no}</span>
                                    <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                                        {job.inspection_status}
                                    </span>
                                </div>
                                <h3 className="font-bold text-lg dark:text-gray-200">{job.farmer_profiles?.name || 'Unknown Farmer'}</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 flex items-center">
                                    <MapPin size={14} className="mr-1"/> {job.farmer_profiles?.district || 'District N/A'}
                                </p>
                                
                                {job.inspection_status === 'scheduled' || job.inspection_status === 'pending' ? (
                                    <button 
                                        onClick={() => handleStartInspection(job)}
                                        className="w-full py-3 bg-green-600 text-white rounded-lg font-bold shadow-lg hover:bg-green-700 transition"
                                    >
                                        Start Site Visit
                                    </button>
                                ) : (
                                    <div className="p-3 bg-gray-100 dark:bg-slate-800 rounded text-center text-sm text-slate-500 dark:text-gray-500">
                                        Report Submitted
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {view === 'documents' && (
                    <div className="space-y-4">
                         {docRequests.map(req => (
                             <div key={req.id} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl">
                                  <div className="flex justify-between items-start mb-4">
                                       <div>
                                            <h3 className="text-lg font-bold dark:text-white">{req.farmer_name}</h3>
                                            <p className="text-sm text-gray-400">{req.scheme}</p>
                                       </div>
                                       <span className={`px-3 py-1 rounded-full text-xs font-bold ${req.status === 'approved' ? 'bg-green-500/10 text-green-400' : 'bg-amber-500/10 text-amber-400'}`}>
                                            {req.status === 'approved' ? 'MAPPED' : 'PENDING APPROVAL'}
                                       </span>
                                  </div>
                                  
                                  <div className="grid grid-cols-2 gap-6 mb-6">
                                       <div className="border border-slate-700 rounded-xl overflow-hidden aspect-[3/4]">
                                            <img src={req.doc_url} className="w-full h-full object-cover" alt="Land Doc" />
                                       </div>
                                       <div className="space-y-4">
                                            <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700">
                                                 <label className="text-[10px] uppercase font-bold text-gray-500">Document Type</label>
                                                 <p className="font-bold dark:text-white">{req.document_type}</p>
                                            </div>
                                            <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700">
                                                 <label className="text-[10px] uppercase font-bold text-gray-500">GPS Coordinates Collected</label>
                                                 <p className="text-sm font-mono dark:text-blue-400">Verified by Inspector Report #OFF-8822</p>
                                            </div>
                                            {req.status === 'approved' ? (
                                                <div className="p-4 bg-green-500/20 rounded-xl border border-green-500/50">
                                                     <p className="text-sm font-bold text-green-400">Land Mapped Successfully</p>
                                                     <p className="text-xs text-green-500/70 mt-1">Hash: {Math.random().toString(16).slice(2, 10)}</p>
                                                </div>
                                            ) : (
                                                <button 
                                                    onClick={() => handleApproveDoc(req.id)}
                                                    className="w-full py-4 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold shadow-lg shadow-green-500/20 transition-all"
                                                >
                                                    Approve & Map Land Realtime
                                                </button>
                                            )}
                                       </div>
                                  </div>
                             </div>
                         ))}
                    </div>
                )}

                {view === 'form' && (
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-slate-800">
                        <button onClick={() => setView('list')} className="text-sm text-slate-500 dark:text-gray-500 mb-4">&larr; Back to List</button>
                        
                        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                            <h3 className="font-bold text-blue-800 dark:text-blue-300">Target Farm</h3>
                            <p className="text-sm dark:text-gray-300">Farming ID: {selectedJob.reference_no}</p>
                            <p className="text-sm dark:text-gray-300">Name: {selectedJob.farmer_profiles?.name}</p>
                        </div>

                        <form onSubmit={handleSubmitReport} className="space-y-6">
                            {/* 1. Location Verification */}
                            <div className="border p-4 rounded-lg dark:border-slate-700">
                                <label className="block text-sm font-bold mb-2 dark:text-white">1. Verify GPS Location</label>
                                {locationVerified ? (
                                    <div className="flex items-center text-green-600 font-bold">
                                        <CheckCircle className="mr-2" /> Location Verified Matches Farm Coords
                                    </div>
                                ) : (
                                    <button 
                                        type="button" 
                                        onClick={verifyLocation}
                                        className="flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-slate-700 rounded-lg text-sm font-bold hover:bg-gray-300"
                                    >
                                        <MapPin size={16} /> Check In at Location
                                    </button>
                                )}
                            </div>

                            {/* 2. Photos */}
                            <div className="border p-4 rounded-lg dark:border-slate-700">
                                <label className="block text-sm font-bold mb-2 dark:text-white">2. Geo-Tagged Photos</label>
                                <div className="grid grid-cols-2 gap-2 mb-3">
                                    {photos.map((src, i) => (
                                        <img key={i} src={src} className="w-full h-24 object-cover rounded" alt="Evidence" />
                                    ))}
                                    <label className="border-2 border-dashed border-gray-300 dark:border-slate-600 rounded flex flex-col items-center justify-center h-24 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800">
                                        <Camera className="text-slate-600 dark:text-gray-400" />
                                        <span className="text-xs text-slate-500 dark:text-gray-500">Add Photo</span>
                                        <input type="file" multiple accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                                    </label>
                                </div>
                            </div>

                            {/* 3. Loss Assessment */}
                            <div className="border p-4 rounded-lg dark:border-slate-700">
                                <label className="block text-sm font-bold mb-2 dark:text-white">3. Loss Assessment (%)</label>
                                <input 
                                    type="number" 
                                    min="0" max="100" 
                                    className="w-full text-3xl font-bold p-2 border-b-2 border-green-500 focus:outline-none dark:bg-transparent dark:text-white"
                                    value={lossEstimate}
                                    onChange={e => setLossEstimate(e.target.value)}
                                />
                                <div className="mt-4">
                                    <label className="block text-sm font-bold mb-2 dark:text-white">Field Remarks</label>
                                    <textarea 
                                        className="w-full p-3 border rounded-lg dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                                        rows="4"
                                        placeholder="Describe crop condition, pest evidence, etc..."
                                        value={remarks}
                                        onChange={e => setRemarks(e.target.value)}
                                    ></textarea>
                                </div>
                            </div>

                            <button 
                                type="submit" 
                                disabled={!locationVerified}
                                className={`w-full py-4 text-white font-bold rounded-xl shadow-lg transition-transform hover:scale-[1.02]
                                    ${!locationVerified ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600'}`}
                            >
                                Submit Official Report
                            </button>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
};

export default InspectorDashboard;
