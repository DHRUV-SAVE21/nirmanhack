import React, { useState, useEffect } from 'react';
import { Search, Filter, CheckCircle, XCircle, Clock, Eye, FileText, Download, AlertCircle, Leaf } from 'lucide-react';
import { getApiUrl } from '../../config/api';

const Claims = () => {
    const [claims, setClaims] = useState([]);
    const [filteredClaims, setFilteredClaims] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('submitted');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedClaim, setSelectedClaim] = useState(null);
    const [stats, setStats] = useState({ total: 0, submitted: 0, under_review: 0, approved: 0 });

    useEffect(() => {
        fetchClaims();
    }, []);

    useEffect(() => {
        filterClaims();
    }, [claims, statusFilter, searchQuery]);

    const fetchClaims = async () => {
        try {
            setLoading(true);
            const response = await fetch(getApiUrl('api/feature2/claims?limit=500'));
            const data = await response.json();

            if (data.claims) {
                setClaims(data.claims);
                calculateStats(data.claims);
            }
        } catch (error) {
            console.error('Error fetching claims:', error);
        } finally {
            setLoading(false);
        }
    };

    const calculateStats = (claimsData) => {
        const newStats = { total: claimsData.length, submitted: 0, under_review: 0, approved: 0 };
        claimsData.forEach(c => {
            if (c.status === 'submitted') newStats.submitted++;
            if (c.status === 'under_review') newStats.under_review++;
            if (c.status === 'approved') newStats.approved++;
        });
        setStats(newStats);
    };

    const filterClaims = () => {
        let filtered = [...claims];

        if (statusFilter !== 'All') {
            filtered = filtered.filter(claim => claim.status === statusFilter);
        }

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(claim =>
                claim.scheme_name?.toLowerCase().includes(query) ||
                claim.farmer_name?.toLowerCase().includes(query) ||
                claim.reference_no?.toLowerCase().includes(query) ||
                claim.aadhaar_number?.includes(query)
            );
        }

        setFilteredClaims(filtered);
    };

    const updateClaimStatus = async (claimId, newStatus) => {
        try {
            const response = await fetch(
                getApiUrl(`api/feature2/claims/${claimId}/status`),
                {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: newStatus })
                }
            );

            if (response.ok) {
                setClaims(prev => {
                    const updated = prev.map(claim =>
                        claim.id === claimId ? { ...claim, status: newStatus } : claim
                    );
                    calculateStats(updated); // Re-calc stats
                    return updated;
                });
                alert(`Claim ${newStatus} successfully!`);
            } else {
                alert('Failed to update claim status');
            }
        } catch (error) {
            console.error('Error updating claim status:', error);
            alert('Error updating claim status');
        }
    };

    const statusColors = {
        submitted: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
        under_review: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
        approved: 'bg-green-500/20 text-green-400 border-green-500/30',
        rejected: 'bg-red-500/20 text-red-400 border-red-500/30',
        completed: 'bg-purple-500/20 text-purple-400 border-purple-500/30'
    };

    const getLossColor = (lossPercentage) => {
        if (!lossPercentage) return 'text-slate-400';
        if (lossPercentage < 20) return 'text-green-400';
        if (lossPercentage < 50) return 'text-yellow-400';
        return 'text-red-400';
    };

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Crop Loss Claims</h1>
                <p className="text-slate-600 dark:text-slate-400">Review and manage farmer insurance/subsidy claims</p>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-900 border border-slate-800 rounded-xl p-4">
                    <div className="text-slate-600 dark:text-slate-400 text-sm mb-1">Total Claims</div>
                    <div className="text-2xl font-bold text-slate-900 dark:text-white">{stats.total}</div>
                </div>
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                    <div className="text-blue-400 text-sm mb-1">Pending Review</div>
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
                        placeholder="Search by farmer name, scheme, reference, or Aadhaar..."
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
                    <option value="submitted">Submitted</option>
                    <option value="under_review">Under Review</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                    <option value="completed">Completed</option>
                </select>
            </div>

            {/* Claims Table */}
            {loading ? (
                <div className="text-center py-12 text-slate-600 dark:text-slate-400">Loading claims...</div>
            ) : filteredClaims.length === 0 ? (
                <div className="text-center py-12 text-slate-600 dark:text-slate-400">No claims found</div>
            ) : (
                <div className="bg-white dark:bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-800 border-b border-slate-700">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">Reference</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">Farmer Details</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">Scheme</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">
                                        <div className="flex items-center gap-1">
                                            <Leaf size={14} />
                                            NDVI Loss %
                                        </div>
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">Claim Amount</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">Status</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">Date</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800">
                                {filteredClaims.map((claim) => (
                                    <tr key={claim.id} className="hover:bg-slate-800/50 transition-colors">
                                        <td className="px-4 py-3">
                                            <div className="text-sm font-mono text-emerald-400">{claim.reference_no}</div>
                                            {claim.aadhaar_number && (
                                                <div className="text-xs text-slate-500 mt-0.5">Aadhaar: {claim.aadhaar_number}</div>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="text-sm text-slate-900 dark:text-white font-medium">{claim.farmer_name || 'N/A'}</div>
                                            <div className="text-xs text-slate-600 dark:text-slate-400">{claim.farmer_phone || 'No phone'}</div>
                                            {claim.father_husband_name && (
                                                <div className="text-xs text-slate-500">S/o: {claim.father_husband_name}</div>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="text-sm text-slate-900 dark:text-white">{claim.scheme_name}</div>
                                            {claim.land_size && (
                                                <div className="text-xs text-slate-600 dark:text-slate-400">{claim.land_size} acres</div>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            {claim.crop_loss_percentage ? (
                                                <div className={`text-sm font-bold ${getLossColor(claim.crop_loss_percentage)}`}>
                                                    {claim.crop_loss_percentage}%
                                                </div>
                                            ) : (
                                                <div className="text-xs text-slate-500">Not calculated</div>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            {claim.claim_amount ? (
                                                <div className="text-sm text-emerald-400 font-semibold">
                                                    ₹{claim.claim_amount.toLocaleString('en-IN')}
                                                </div>
                                            ) : (
                                                <div className="text-xs text-slate-500">TBD</div>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${statusColors[claim.status] || 'bg-slate-700 text-slate-300'}`}>
                                                {claim.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
                                            {new Date(claim.created_at).toLocaleDateString('en-IN')}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => setSelectedClaim(claim)}
                                                    className="px-3 py-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded text-xs font-medium transition-colors"
                                                >
                                                    <Eye size={14} className="inline mr-1" />
                                                    View
                                                </button>
                                                {claim.status === 'submitted' && (
                                                    <button
                                                        onClick={() => updateClaimStatus(claim.id, 'under_review')}
                                                        className="px-3 py-1 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 rounded text-xs font-medium transition-colors"
                                                    >
                                                        Review
                                                    </button>
                                                )}
                                                {claim.status === 'under_review' && (
                                                    <>
                                                        <button
                                                            onClick={() => updateClaimStatus(claim.id, 'approved')}
                                                            className="px-3 py-1 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded text-xs font-medium transition-colors"
                                                        >
                                                            <CheckCircle size={14} className="inline mr-1" />
                                                            Approve
                                                        </button>
                                                        <button
                                                            onClick={() => updateClaimStatus(claim.id, 'rejected')}
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

            {/* Claim Details Modal */}
            {selectedClaim && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-white dark:bg-slate-900 border border-slate-700 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-slate-700 flex items-center justify-between sticky top-0 bg-white dark:bg-slate-900 z-10">
                            <div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                    <FileText size={24} className="text-emerald-400" />
                                    Claim Details
                                </h3>
                                <p className="text-sm text-slate-600 dark:text-slate-400 font-mono mt-1">{selectedClaim.reference_no}</p>
                            </div>
                            <button
                                onClick={() => setSelectedClaim(null)}
                                className="text-slate-600 dark:text-slate-400 hover:text-white"
                            >
                                <XCircle size={24} />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Status & NDVI Loss */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="bg-slate-800 rounded-lg p-4">
                                    <div className="text-sm text-slate-600 dark:text-slate-400 mb-2">Status</div>
                                    <span className={`px-3 py-1.5 rounded-lg text-sm font-medium border ${statusColors[selectedClaim.status]}`}>
                                        {selectedClaim.status}
                                    </span>
                                </div>
                                <div className="bg-slate-800 rounded-lg p-4">
                                    <div className="text-sm text-slate-600 dark:text-slate-400 mb-2 flex items-center gap-1">
                                        <Leaf size={14} />
                                        NDVI Crop Loss
                                    </div>
                                    {selectedClaim.crop_loss_percentage ? (
                                        <div className={`text-2xl font-bold ${getLossColor(selectedClaim.crop_loss_percentage)}`}>
                                            {selectedClaim.crop_loss_percentage}%
                                        </div>
                                    ) : (
                                        <div className="text-slate-500">Not calculated</div>
                                    )}
                                </div>
                                <div className="bg-slate-800 rounded-lg p-4">
                                    <div className="text-sm text-slate-600 dark:text-slate-400 mb-2">Claim Amount</div>
                                    {selectedClaim.claim_amount ? (
                                        <div className="text-2xl font-bold text-emerald-400">
                                            ₹{selectedClaim.claim_amount.toLocaleString('en-IN')}
                                        </div>
                                    ) : (
                                        <div className="text-slate-500">To be calculated</div>
                                    )}
                                </div>
                            </div>

                            {/* Farmer Details */}
                            <div>
                                <div className="text-sm text-slate-600 dark:text-slate-400 mb-3 font-semibold">Farmer Information</div>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                    <div className="bg-slate-800 rounded-lg p-3">
                                        <div className="text-xs text-slate-500">Full Name</div>
                                        <div className="text-sm text-slate-900 dark:text-white mt-1 font-medium">{selectedClaim.farmer_name || 'N/A'}</div>
                                    </div>
                                    <div className="bg-slate-800 rounded-lg p-3">
                                        <div className="text-xs text-slate-500">Father/Husband Name</div>
                                        <div className="text-sm text-slate-900 dark:text-white mt-1">{selectedClaim.father_husband_name || 'N/A'}</div>
                                    </div>
                                    <div className="bg-slate-800 rounded-lg p-3">
                                        <div className="text-xs text-slate-500">Mobile Number</div>
                                        <div className="text-sm text-slate-900 dark:text-white mt-1">{selectedClaim.farmer_phone || 'N/A'}</div>
                                    </div>
                                    <div className="bg-slate-800 rounded-lg p-3">
                                        <div className="text-xs text-slate-500">Aadhaar Number</div>
                                        <div className="text-sm text-slate-900 dark:text-white mt-1 font-mono">{selectedClaim.aadhaar_number || 'N/A'}</div>
                                    </div>
                                    <div className="bg-slate-800 rounded-lg p-3">
                                        <div className="text-xs text-slate-500">Land Size</div>
                                        <div className="text-sm text-slate-900 dark:text-white mt-1">{selectedClaim.land_size ? `${selectedClaim.land_size} acres` : 'N/A'}</div>
                                    </div>
                                    <div className="bg-slate-800 rounded-lg p-3">
                                        <div className="text-xs text-slate-500">Scheme Name</div>
                                        <div className="text-sm text-slate-900 dark:text-white mt-1">{selectedClaim.scheme_name}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Application Details */}
                            {selectedClaim.application_details && (
                                <div>
                                    <div className="text-sm text-slate-600 dark:text-slate-400 mb-3 font-semibold">Additional Details</div>
                                    <div className="bg-slate-800 rounded-lg p-4">
                                        <pre className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                                            {JSON.stringify(selectedClaim.application_details, null, 2)}
                                        </pre>
                                    </div>
                                </div>
                            )}

                            {/* Uploaded Documents */}
                            {selectedClaim.document_urls && (
                                <div>
                                    <div className="text-sm text-slate-600 dark:text-slate-400 mb-3 font-semibold">Uploaded Documents</div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {Object.entries(selectedClaim.document_urls).map(([docName, url]) => (
                                            <div key={docName} className="bg-slate-800 rounded-lg p-4">
                                                <div className="flex items-center justify-between mb-3">
                                                    <div className="flex items-center gap-3">
                                                        <FileText className="text-blue-400" size={20} />
                                                        <div>
                                                            <div className="text-sm text-slate-900 dark:text-white capitalize">{docName.replace(/_/g, ' ')}</div>
                                                        </div>
                                                    </div>
                                                    <a
                                                        href={url}
                                                        download={`${docName}.${url.startsWith('data:image/png') ? 'png' : 'jpg'}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="px-3 py-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded text-xs font-medium transition-colors"
                                                    >
                                                        <Download size={14} className="inline mr-1" />
                                                        Save
                                                    </a>
                                                </div>

                                                {/* Inline Image Preview */}
                                                {typeof url === 'string' && url.startsWith('data:image') ? (
                                                    <div className="mt-2 rounded-lg overflow-hidden border border-slate-700 bg-black/50">
                                                        <img
                                                            src={url}
                                                            alt={docName}
                                                            className="w-full h-auto object-contain max-h-64 mx-auto"
                                                        />
                                                    </div>
                                                ) : typeof url === 'string' && url.startsWith('data:application/pdf') ? (
                                                    <div className="mt-2 h-48 bg-slate-700 rounded flex items-center justify-center text-slate-600 dark:text-slate-400 text-xs">
                                                        PDF Preview Not Available (Click Save)
                                                    </div>
                                                ) : (
                                                    <div className="mt-2 text-xs text-slate-500 italic">
                                                        No preview available
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex gap-3 pt-4 border-t border-slate-700">
                                {selectedClaim.status === 'submitted' && (
                                    <button
                                        onClick={() => {
                                            updateClaimStatus(selectedClaim.id, 'under_review');
                                            setSelectedClaim(null);
                                        }}
                                        className="flex-1 px-4 py-3 bg-yellow-500 hover:bg-yellow-600 text-slate-900 dark:text-white rounded-lg font-medium transition-colors"
                                    >
                                        <Clock size={18} className="inline mr-2" />
                                        Move to Review
                                    </button>
                                )}
                                {selectedClaim.status === 'under_review' && (
                                    <>
                                        <button
                                            onClick={() => {
                                                updateClaimStatus(selectedClaim.id, 'approved');
                                                setSelectedClaim(null);
                                            }}
                                            className="flex-1 px-4 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors"
                                        >
                                            <CheckCircle size={18} className="inline mr-2" />
                                            Approve Claim
                                        </button>
                                        <button
                                            onClick={() => {
                                                updateClaimStatus(selectedClaim.id, 'rejected');
                                                setSelectedClaim(null);
                                            }}
                                            className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors"
                                        >
                                            <XCircle size={18} className="inline mr-2" />
                                            Reject Claim
                                        </button>
                                    </>
                                )}
                                {selectedClaim.status === 'approved' && (
                                    <>
                                        <a
                                            href={getApiUrl(`api/feature2/claims/${selectedClaim.id}/certificate`)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center text-center"
                                        >
                                            <FileText size={18} className="inline mr-2" />
                                            Download Certificate
                                        </a>
                                        <button
                                            onClick={() => {
                                                updateClaimStatus(selectedClaim.id, 'completed');
                                                setSelectedClaim(null);
                                            }}
                                            className="flex-1 px-4 py-3 bg-purple-500 hover:bg-purple-600 text-slate-900 dark:text-white rounded-lg font-medium transition-colors"
                                        >
                                            Mark Completed
                                        </button>
                                    </>
                                )}
                                {selectedClaim.status === 'completed' && (
                                    <a
                                        href={getApiUrl(`api/feature2/claims/${selectedClaim.id}/certificate`)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center text-center"
                                    >
                                        <FileText size={18} className="inline mr-2" />
                                        Download Certificate (Archived)
                                    </a>
                                )}
                            </div>

                            {/* Admin Notes Section */}
                            {selectedClaim.admin_notes && (
                                <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
                                    <div className="flex items-start gap-3">
                                        <AlertCircle className="text-amber-400 mt-0.5" size={20} />
                                        <div>
                                            <div className="text-sm font-semibold text-amber-400 mb-1">Admin Notes</div>
                                            <div className="text-sm text-amber-200">{selectedClaim.admin_notes}</div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Claims;
