import React, { useState, useEffect } from 'react';
import { Search, Filter, CheckCircle, XCircle, Clock, Eye, Download } from 'lucide-react';
import { getApiUrl } from '../../config/api';

const AdminSchemes = () => {
    const [applications, setApplications] = useState([]);
    const [filteredApplications, setFilteredApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedApplication, setSelectedApplication] = useState(null);
    const [stats, setStats] = useState({ total: 0, submitted: 0, under_review: 0, approved: 0 });

    useEffect(() => {
        fetchApplications();
        fetchStatistics();
    }, []);

    useEffect(() => {
        filterApplications();
    }, [applications, statusFilter, searchQuery]);

    const fetchApplications = async () => {
        try {
            setLoading(true);
            const response = await fetch(getApiUrl('api/schemes/applications/all'));
            const data = await response.json();
            // API returns array directly now based on my router implementation
            if (Array.isArray(data)) {
                 setApplications(data);
            } else {
                 setApplications([]);
            }
        } catch (error) {
            console.error('Error fetching applications:', error);
            setApplications([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchStatistics = async () => {
        try {
            const response = await fetch(getApiUrl('api/schemes/applications/statistics'));
            const data = await response.json();
            setStats(data);
        } catch (error) {
            console.error('Error fetching statistics:', error);
        }
    };

    const filterApplications = () => {
        let filtered = [...applications];

        // 10x Dev: Handle the unified 'Pending' filter for Task 1
        if (statusFilter !== 'All') {
            if (statusFilter === 'pending_approval') {
                filtered = filtered.filter(app => app.status === 'submitted' || app.status === 'under_review');
            } else {
                filtered = filtered.filter(app => app.status === statusFilter);
            }
        }

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(app =>
                app.scheme_name?.toLowerCase().includes(query) ||
                app.reference_no?.toLowerCase().includes(query) ||
                app.applicant_name?.toLowerCase().includes(query)
            );
        }

        // 10x Dev: Explicitly sort in frontend as a safety net (Latest first)
        filtered.sort((a, b) => new Date(b.created_at || b.applied_date) - new Date(a.created_at || a.applied_date));

        setFilteredApplications(filtered);
    };

    const updateStatus = async (applicationId, newStatus) => {
        if (!window.confirm(`Are you sure you want to change status to ${newStatus}?`)) return;

        try {
            const response = await fetch(
                getApiUrl(`api/schemes/applications/${applicationId}/status`),
                {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: newStatus })
                }
            );

            if (response.ok) {
                // Update local state
                setApplications(prev =>
                    prev.map(app =>
                        app.id === applicationId ? { ...app, status: newStatus } : app
                    )
                );
                fetchStatistics(); // Refresh stats
                // Close modal if open
                setSelectedApplication(null);
            } else {
                alert('Failed to update status');
            }
        } catch (error) {
            console.error('Error updating status:', error);
            alert('Error updating status');
        }
    };

    const statusColors = {
        submitted: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
        under_review: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
        approved: 'bg-green-500/20 text-green-400 border-green-500/30',
        rejected: 'bg-red-500/20 text-red-400 border-red-500/30',
        completed: 'bg-purple-500/20 text-purple-400 border-purple-500/30'
    };

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Scheme Applications</h1>
                <p className="text-slate-600 dark:text-slate-400">Manage and review farmer scheme applications</p>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-900 border border-slate-800 rounded-xl p-4">
                    <div className="text-slate-600 dark:text-slate-400 text-sm mb-1">Total Applications</div>
                    <div className="text-2xl font-bold text-slate-900 dark:text-white">{stats.total}</div>
                </div>
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                    <div className="text-blue-400 text-sm mb-1">Submitted</div>
                    <div className="text-2xl font-bold text-blue-400">{stats.submitted}</div>
                </div>
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
                    <div className="text-yellow-400 text-sm mb-1">Under Review</div>
                    <div className="text-2xl font-bold text-yellow-400">{stats.under_review}</div>
                </div>
                <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
                    <div className="text-green-400 text-sm mb-1">Approved</div>
                    <div className="text-2xl font-bold text-green-400">{stats.approved}</div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[200px] relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 dark:text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search by scheme, user ID, or reference..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                </div>
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="bg-white dark:bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                    <option value="All">All Status</option>
                    <option value="pending_approval" className="font-bold text-yellow-500">Yet to be Approved (Pending)</option>
                    <option value="approved" className="font-bold text-green-500">Approved Only</option>
                    <option value="submitted">Submitted</option>
                    <option value="under_review">Under Review</option>
                    <option value="rejected">Rejected</option>
                    <option value="completed">Completed</option>
                </select>
            </div>

            {/* Applications Table */}
            {loading ? (
                <div className="text-center py-12 text-slate-600 dark:text-slate-400">Loading applications...</div>
            ) : filteredApplications.length === 0 ? (
                <div className="text-center py-12 text-slate-600 dark:text-slate-400">No applications found</div>
            ) : (
                <div className="bg-white dark:bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-800 border-b border-slate-700">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">Reference</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">Farmer Name</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">Phone</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">Scheme Name</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">Status</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">Applied Date</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800">
                                {filteredApplications.map((app) => (
                                    <tr key={app.id} className="hover:bg-slate-800/50 transition-colors">
                                        <td className="px-4 py-3 text-sm font-mono text-emerald-400">{app.reference_no}</td>
                                        <td className="px-4 py-3 text-sm text-slate-900 dark:text-white">{app.farmer_name || 'N/A'}</td>
                                        <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-300">{app.farmer_phone || 'N/A'}</td>
                                        <td className="px-4 py-3 text-sm text-slate-900 dark:text-white">{app.scheme_name}</td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${statusColors[app.status] || 'bg-slate-700 text-slate-300'}`}>
                                                {app.status}
                                            </span>
                                        </td>
                                         <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400 whitespace-nowrap">
                                            {/* 10x Dev: Formatted for Task 2 (Display Timestamp with time) */}
                                            <div className="flex flex-col">
                                                <span className="font-bold text-slate-900 dark:text-white">
                                                    {new Date(app.created_at || app.applied_date).toLocaleDateString('en-IN', {
                                                        day: '2-digit',
                                                        month: 'short',
                                                        year: 'numeric'
                                                    })}
                                                </span>
                                                <span className="text-[10px] text-slate-500 uppercase tracking-tighter">
                                                    {new Date(app.created_at || app.applied_date).toLocaleTimeString('en-IN', {
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                        hour12: true
                                                    })}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => setSelectedApplication(app)}
                                                    className="px-3 py-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded text-xs font-medium transition-colors"
                                                >
                                                    <Eye size={14} className="inline mr-1" />
                                                    View
                                                </button>
                                                {app.status === 'submitted' && (
                                                    <button
                                                        onClick={() => updateStatus(app.id, 'under_review')}
                                                        className="px-3 py-1 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 rounded text-xs font-medium transition-colors"
                                                    >
                                                        Review
                                                    </button>
                                                )}
                                                {app.status === 'under_review' && (
                                                    <>
                                                        <button
                                                            onClick={() => updateStatus(app.id, 'approved')}
                                                            className="px-3 py-1 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded text-xs font-medium transition-colors"
                                                        >
                                                            <CheckCircle size={14} className="inline mr-1" />
                                                            Approve
                                                        </button>
                                                        <button
                                                            onClick={() => updateStatus(app.id, 'rejected')}
                                                            className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded text-xs font-medium transition-colors"
                                                        >
                                                            <XCircle size={14} className="inline mr-1" />
                                                            Reject
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Application Details Modal */}
            {selectedApplication && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-slate-700 flex items-center justify-between">
                            <div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white">{selectedApplication.scheme_name}</h3>
                                <p className="text-sm text-slate-600 dark:text-slate-400 font-mono">{selectedApplication.reference_no}</p>
                            </div>
                            <button
                                onClick={() => setSelectedApplication(null)}
                                className="text-slate-600 dark:text-slate-400 hover:text-white"
                            >
                                <XCircle size={24} />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Status */}
                            <div>
                                <div className="text-sm text-slate-600 dark:text-slate-400 mb-2">Status</div>
                                <span className={`px-3 py-1.5 rounded-lg text-sm font-medium border ${statusColors[selectedApplication.status]}`}>
                                    {selectedApplication.status}
                                </span>
                            </div>

                            {/* Applicant Details */}
                            {selectedApplication.application_details?.applicant_details && (
                                <div>
                                    <div className="text-sm text-slate-600 dark:text-slate-400 mb-3">Applicant Details</div>
                                    <div className="grid grid-cols-2 gap-3">
                                        {Object.entries(selectedApplication.application_details.applicant_details).map(([key, value]) => (
                                            <div key={key} className="bg-slate-800 rounded-lg p-3">
                                                <div className="text-xs text-slate-500 capitalize">{key.replace('_', ' ')}</div>
                                                <div className="text-sm text-slate-900 dark:text-white mt-1">{value || 'N/A'}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Verification Documents (Base64 from Profile) */}
                            {selectedApplication.farmer_docs && (
                                <div>
                                    <div className="text-sm text-slate-600 dark:text-slate-400 mb-3 font-semibold text-emerald-400">Farmer Verification Documents</div>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {selectedApplication.farmer_docs.photo && (
                                            <div className="space-y-1">
                                                <div className="text-[10px] text-slate-500 uppercase">Passport Photo</div>
                                                <div className="h-28 rounded-lg overflow-hidden border border-slate-700 bg-black shadow-lg shadow-emerald-500/10">
                                                    <img src={selectedApplication.farmer_docs.photo} className="w-full h-full object-cover" alt="Farmer Photo" onClick={() => window.open(selectedApplication.farmer_docs.photo)}/>
                                                </div>
                                            </div>
                                        )}
                                        {selectedApplication.farmer_docs.aadhaar && (
                                            <div className="space-y-1">
                                                <div className="text-[10px] text-slate-500 uppercase">Aadhaar Card</div>
                                                <div className="h-28 rounded-lg overflow-hidden border border-slate-700 bg-black shadow-lg shadow-emerald-500/10 hover:border-emerald-500 transition-colors">
                                                    <img src={selectedApplication.farmer_docs.aadhaar} className="w-full h-full object-cover cursor-zoom-in" alt="Aadhaar" onClick={() => window.open(selectedApplication.farmer_docs.aadhaar)}/>
                                                </div>
                                            </div>
                                        )}
                                        {selectedApplication.farmer_docs.land && (
                                            <div className="space-y-1">
                                                <div className="text-[10px] text-slate-500 uppercase">Land Records</div>
                                                <div className="h-28 rounded-lg overflow-hidden border border-slate-700 bg-black shadow-lg shadow-emerald-500/10 hover:border-emerald-500 transition-colors">
                                                    <img src={selectedApplication.farmer_docs.land} className="w-full h-full object-cover cursor-zoom-in" alt="Land Record" onClick={() => window.open(selectedApplication.farmer_docs.land)}/>
                                                </div>
                                            </div>
                                        )}
                                        {selectedApplication.farmer_docs.bank && (
                                            <div className="space-y-1">
                                                <div className="text-[10px] text-slate-500 uppercase">Bank Passbook</div>
                                                <div className="h-28 rounded-lg overflow-hidden border border-slate-700 bg-black shadow-lg shadow-emerald-500/10 hover:border-emerald-500 transition-colors">
                                                    <img src={selectedApplication.farmer_docs.bank} className="w-full h-full object-cover cursor-zoom-in" alt="Bank" onClick={() => window.open(selectedApplication.farmer_docs.bank)}/>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    {(!selectedApplication.farmer_docs.aadhaar && !selectedApplication.farmer_docs.land) && (
                                        <div className="text-xs text-red-400 bg-red-400/5 p-2 rounded border border-red-500/10 mt-2">
                                            ⚠️ Farmer profile is missing essential identity documents.
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Scheme Details */}

                            {/* Action Buttons */}
                            <div className="flex gap-3 pt-4 border-t border-slate-700">
                                {selectedApplication.status === 'submitted' && (
                                    <button
                                        onClick={() => {
                                            updateStatus(selectedApplication.id, 'under_review');
                                            setSelectedApplication(null);
                                        }}
                                        className="flex-1 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-slate-900 dark:text-white rounded-lg font-medium transition-colors"
                                    >
                                        Move to Review
                                    </button>
                                )}
                                {selectedApplication.status === 'under_review' && (
                                    <>
                                        <button
                                            onClick={() => {
                                                updateStatus(selectedApplication.id, 'approved');
                                                setSelectedApplication(null);
                                            }}
                                            className="flex-1 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors"
                                        >
                                            Approve
                                        </button>
                                        <button
                                            onClick={() => {
                                                updateStatus(selectedApplication.id, 'rejected');
                                                setSelectedApplication(null);
                                            }}
                                            className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors"
                                        >
                                            Reject
                                        </button>
                                    </>
                                )}
                                {selectedApplication.status === 'approved' && (
                                    <button
                                        onClick={() => {
                                            updateStatus(selectedApplication.id, 'completed');
                                            setSelectedApplication(null);
                                        }}
                                        className="flex-1 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-slate-900 dark:text-white rounded-lg font-medium transition-colors"
                                    >
                                        Mark as Completed
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminSchemes;
