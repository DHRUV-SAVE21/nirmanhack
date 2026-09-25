import React, { useState, useEffect } from 'react';
import { FileText, Clock, CheckCircle, XCircle, AlertCircle, Trash2 } from 'lucide-react';

const MyApplications = ({ applications, onClear }) => {
    const getStatusIcon = (status) => {
        switch (status) {
            case 'approved':
                return <CheckCircle className="text-green-400" size={20} />;
            case 'verified':
                return <CheckCircle className="text-blue-400" size={20} />;
            case 'rejected':
                return <XCircle className="text-red-400" size={20} />;
            case 'pending':
            default:
                return <Clock className="text-yellow-400" size={20} />;
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'approved':
                return 'bg-green-500/10 border-green-500/30 text-green-400';
            case 'verified':
                return 'bg-blue-500/10 border-blue-500/30 text-blue-400';
            case 'rejected':
                return 'bg-red-500/10 border-red-500/30 text-red-400';
            case 'pending':
            default:
                return 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400';
        }
    };

    if (!applications || applications.length === 0) {
        return (
            <div className="text-center py-16">
                <div className="w-20 h-20 bg-white dark:bg-white/5 shadow-sm dark:shadow-none rounded-full flex items-center justify-center mx-auto mb-4">
                    <FileText size={40} className="text-slate-500 dark:text-gray-500" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">No Applications Yet</h3>
                <p className="text-slate-600 dark:text-gray-400 mb-6">
                    Browse schemes and apply to see your applications here.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                    Your Applications ({applications.length})
                </h3>
                <button
                    onClick={onClear}
                    className="text-sm text-red-400 hover:text-red-300 flex items-center gap-1"
                >
                    <Trash2 size={14} />
                    Clear All
                </button>
            </div>

            <div className="space-y-4">
                {applications.map((app, idx) => (
                    <div
                        key={idx}
                        className="bg-white dark:bg-white/5 shadow-sm dark:shadow-none border border-slate-200 dark:border-white/10 rounded-xl p-5 hover:border-white/20 transition-all"
                    >
                        <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                                <h4 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">
                                    {app.schemeName}
                                </h4>
                                <p className="text-sm text-slate-600 dark:text-gray-400">
                                    Applied on: {app.appliedDate}
                                </p>
                            </div>
                            <div className={`px-3 py-1 rounded-full border flex items-center gap-2 ${getStatusColor(app.status)}`}>
                                {getStatusIcon(app.status)}
                                <span className="text-sm font-medium capitalize">{app.status}</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                            <div className="bg-black/20 rounded-lg p-3">
                                <span className="text-slate-500 dark:text-gray-500 block">Applicant</span>
                                <span className="text-slate-900 dark:text-white">{app.applicantName}</span>
                            </div>
                            <div className="bg-black/20 rounded-lg p-3">
                                <span className="text-slate-500 dark:text-gray-500 block">State</span>
                                <span className="text-slate-900 dark:text-white">{app.state}</span>
                            </div>
                            <div className="bg-black/20 rounded-lg p-3">
                                <span className="text-slate-500 dark:text-gray-500 block">Subsidy Amount</span>
                                <span className="text-organic-green font-semibold">{app.subsidyAmount}</span>
                            </div>
                            <div className="bg-black/20 rounded-lg p-3">
                                <span className="text-slate-500 dark:text-gray-500 block">Reference No.</span>
                                <span className="text-slate-900 dark:text-white font-mono">{app.referenceNo}</span>
                            </div>
                        </div>

                        {app.status === 'verified' && (
                            <div className="mt-6 flex flex-col gap-3">
                                <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
                                    <div className="flex items-center gap-3 text-blue-400 mb-2">
                                        <CheckCircle size={18} />
                                        <span className="font-bold">Initial Verification Successful!</span>
                                    </div>
                                    <p className="text-sm text-slate-600 dark:text-gray-300">
                                        Your eligibility has been verified. To complete the process and map your land, please upload your 7/12 Extract or Land Record document.
                                    </p>
                                </div>
                                <button
                                    onClick={() => {
                                        if (window.onProceedToUpload) {
                                            window.onProceedToUpload(app);
                                        } else {
                                            alert("Proceeding to Document Upload for: " + app.referenceNo);
                                        }
                                    }}
                                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-lg"
                                >
                                    Proceed to Final Verification & Mapping
                                </button>
                            </div>
                        )}

                        {app.status === 'pending' && (
                            <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-sm text-yellow-300">
                                <AlertCircle size={14} className="inline mr-2" />
                                Your application is under review. This typically takes 7-14 business days.
                            </div>
                        )}

                        {/* Show AI badge and portal link for AI-submitted applications */}
                        {app.submittedVia === 'AI Assistant' && (
                            <div className="mt-4 flex items-center justify-between">
                                <span className="text-xs px-2 py-1 bg-blue-500/20 text-blue-400 rounded-full">
                                    🤖 Submitted via AI Assistant
                                </span>
                                {app.portalUrl && (
                                    <a
                                        href={app.portalUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sm text-organic-green hover:underline"
                                    >
                                        Track on Portal →
                                    </a>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>
            <div className="text-center text-sm text-slate-500 dark:text-gray-500 mt-6">
                Note: These are demo applications. In production, they would be linked to actual government portals.
            </div>

            <div className="text-center text-sm text-slate-500 dark:text-gray-500 mt-6">
                Note: These are demo applications. In production, they would be linked to actual government portals.
            </div>
        </div>
    );
};

export default MyApplications;
