
import React, { useState } from 'react';
import {
    Send,
    Map,
    Smartphone,
    Mail,
    AlertTriangle,
    Info
} from 'lucide-react';
import { getApiUrl } from '../../config/api';

const Broadcast = () => {
    const [message, setMessage] = useState('');
    const [region, setRegion] = useState('All');
    const [type, setType] = useState('General');
    const [loading, setLoading] = useState(false);

    const handleSendBroadcast = async () => {
        if (!message) {
            alert("Please enter a message content");
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(getApiUrl('admin/broadcast'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message,
                    region,
                    type,
                    channels: ['sms']
                })
            });

            const data = await response.json();
            if (response.ok) {
                alert(`Broadcast Sent Successfully!\n\n✅ Sent: ${data.sent}\n❌ Failed: ${data.failed}\nTargets: ${data.total_targets}`);
                setMessage("");
            } else {
                alert("Failed to send broadcast: " + (data.detail || "Unknown error"));
            }
        } catch (error) {
            console.error("Broadcast error:", error);
            alert("Error sending broadcast. Check console.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

            {/* Send Broadcast Form */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                    <Send className="w-5 h-5 mr-2 text-blue-600" />
                    Send Broadcast
                </h2>

                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Message Content</label>
                        <textarea
                            className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent h-32 resize-none"
                            placeholder="Type your alert message here..."
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Select Region</label>
                            <select
                                className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500"
                                value={region}
                                onChange={(e) => setRegion(e.target.value)}
                            >
                                <option value="All">All Regions</option>
                                <option value="Nashik">Nashik</option>
                                <option value="Pune">Pune</option>
                                <option value="Nagpur">Nagpur</option>
                                <option value="Aurangabad">Aurangabad</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Alert Type</label>
                            <select
                                className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500"
                                value={type}
                                onChange={(e) => setType(e.target.value)}
                            >
                                <option value="General">General Info</option>
                                <option value="Weather">Weather Alert</option>
                                <option value="Emergency">Emergency</option>
                                <option value="Deadline">Deadline Reminder</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">Channels</label>
                        <div className="flex space-x-6">
                            <label className="flex items-center cursor-pointer">
                                <input type="checkbox" className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500" defaultChecked />
                                <span className="ml-2 text-sm text-gray-600 flex items-center">
                                    <Smartphone className="w-4 h-4 mr-1" /> SMS
                                </span>
                            </label>
                            <label className="flex items-center cursor-pointer">
                                <input type="checkbox" className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500" defaultChecked />
                                <span className="ml-2 text-sm text-gray-600 flex items-center">
                                    <Info className="w-4 h-4 mr-1" /> App Notification
                                </span>
                            </label>
                        </div>
                    </div>

                    <button
                        onClick={handleSendBroadcast}
                        disabled={loading}
                        className={`w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 flex items-center justify-center ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                        {loading ? 'Sending...' : 'Send Broadcast'}
                    </button>
                </div>
            </div>

            {/* Recent Broadcasts */}
            <div className="space-y-6">
                <h2 className="text-xl font-bold text-gray-900">Recent Broadcasts</h2>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 space-y-4">
                    <div className="flex items-start space-x-4 p-4 bg-red-50 rounded-lg border border-red-100">
                        <div className="p-2 bg-red-100 rounded-lg">
                            <AlertTriangle className="w-5 h-5 text-red-600" />
                        </div>
                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <h4 className="font-bold text-gray-900">Flood Warning</h4>
                                <span className="text-xs text-red-500 font-medium">10 mins ago</span>
                            </div>
                            <p className="text-sm text-gray-700 mb-2">Heavy rains expected in Nashik region. Please secure your crops and equipment.</p>
                            <div className="flex items-center space-x-2">
                                <span className="px-2 py-0.5 bg-white rounded border border-red-200 text-xs font-medium text-red-600">SMS Sent</span>
                                <span className="px-2 py-0.5 bg-white rounded border border-red-200 text-xs font-medium text-red-600">App Notification</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-start space-x-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <Info className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <h4 className="font-bold text-gray-900">PM Fasal Bima Deadline</h4>
                                <span className="text-xs text-slate-500 dark:text-gray-500 font-medium">2 hours ago</span>
                            </div>
                            <p className="text-sm text-gray-700 mb-2">Reminder: Last date to enroll for Kharif season insurance is Oct 31st.</p>
                            <div className="flex items-center space-x-2">
                                <span className="px-2 py-0.5 bg-white rounded border border-blue-200 text-xs font-medium text-blue-600">App Notification</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default Broadcast;
