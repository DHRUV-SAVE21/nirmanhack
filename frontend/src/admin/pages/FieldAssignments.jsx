import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  MapPin, 
  User, 
  Calendar, 
  CheckCircle,
  Clock,
  Plus,
  Loader2,
  FileText,
  Navigation
} from 'lucide-react';
import { getApiUrl } from '../../config/api';

const TrackingModal = ({ assignment, officerMap, onClose }) => {
  const officer = officerMap[assignment.assigned_inspector_id] || { name: assignment.assigned_inspector_id, zone: "Unknown Zone" };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-sm p-6 shadow-2xl relative">
        <h3 className="text-lg font-bold mb-4 dark:text-white flex items-center gap-2">
            <Navigation className="text-green-600" size={20} />
            Officer Tracking
        </h3>
        <div className="space-y-4">
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-100 dark:border-green-800">
                <p className="text-xs text-green-600 dark:text-green-400 font-bold uppercase tracking-wider mb-1">Current Status</p>
                <p className="text-lg font-bold text-green-800 dark:text-green-200">{assignment.inspection_status?.replace('_', ' ').toUpperCase()}</p>
            </div>
            
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                    <User size={20} />
                </div>
                <div>
                     <p className="text-sm font-bold dark:text-white">{officer.name}</p>
                     <p className="text-xs text-slate-500 dark:text-gray-500">Field Officer • {officer.zone}</p>
                </div>
            </div>

            <div className="border-t pt-4 dark:border-slate-800">
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300 mb-2">
                    <MapPin size={16} />
                    <span className="text-sm font-medium">Last Known Location</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-gray-500 pl-6">
                    {assignment.inspection_status === 'report_submitted' 
                        ? 'Visit Completed. Location verified at farm site.' 
                        : 'GPS Signal Active. Officer is within 5km of assigned district.'}
                </p>
            </div>
        </div>

        <button 
            onClick={onClose}
            className="w-full mt-6 py-2 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-800 dark:text-white rounded-lg font-bold text-sm transition-colors"
        >
            Close
        </button>
      </div>
    </div>
  );
};

const AssignmentCard = ({ assignment, officerMap, onAssign, onTrack }) => {
  const statusColors = {
    pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    scheduled: 'bg-blue-50 text-blue-700 border-blue-200',
    report_submitted: 'bg-purple-50 text-purple-700 border-purple-200',
    completed: 'bg-green-50 text-green-700 border-green-200'
  };

  const officerName = officerMap[assignment.assigned_inspector_id]?.name || assignment.assigned_inspector_id;

  return (
    <div className="bg-white dark:bg-slate-900 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800 flex flex-col justify-between h-full">
      <div>
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-gray-500 dark:text-slate-400 font-bold">
              <User size={20} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                {assignment.assigned_inspector_id ? 'Inspector Assigned' : 'Unassigned'}
              </h4>
              <p className="text-xs text-slate-500 dark:text-gray-500 dark:text-gray-400">
                {officerName || 'No Officer'}
              </p>
            </div>
          </div>
          <span className={`px-2 py-1 text-xs font-bold rounded-full border ${statusColors[assignment.inspection_status] || statusColors.pending}`}>
             {assignment.inspection_status?.toUpperCase() || 'UNKNOWN'}
          </span>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
              <MapPin className="w-4 h-4 mr-2 text-slate-600 dark:text-gray-400" />
              <span>{assignment.farmer_profiles?.district || 'Unknown Location'}</span>
          </div>
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
              <Calendar className="w-4 h-4 mr-2 text-slate-600 dark:text-gray-400" />
              <span>Created: {new Date(assignment.created_at).toLocaleDateString()}</span>
          </div>
          {assignment.inspection_deadline && (
             <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                <Clock className="w-4 h-4 mr-2 text-red-400" />
                <span className="text-red-500 font-medium">Due: {new Date(assignment.inspection_deadline).toLocaleDateString()}</span>
             </div>
          )}
        </div>
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-100 dark:border-slate-800">
          <div className="text-xs text-slate-600 dark:text-gray-400 mb-2">Ref: <span className="text-gray-700 dark:text-gray-300 font-mono">{assignment.reference_no}</span></div>
          {!assignment.assigned_inspector_id ? (
             <button 
                onClick={() => onAssign(assignment)}
                className="w-full py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
             >
                <Plus size={14} /> Assign Officer
             </button>
          ) : (
             <div className="flex gap-2">
                 <button 
                    onClick={() => onTrack(assignment)}
                    className="flex-1 py-2 bg-gray-50 hover:bg-gray-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-200 text-xs font-bold rounded-lg transition-colors"
                 >
                    Track
                 </button>
                 {/* Show PDF for Scheduled OR Submitted */}
                 {(assignment.inspection_status === 'report_submitted' || assignment.inspection_status === 'scheduled') && (
                    <a href={`${getApiUrl(`inspections/generate-pdf/${assignment.id}`)}`} target="_blank" rel="noreferrer" className="flex-1 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-lg transition-colors text-center flex items-center justify-center gap-1">
                        <FileText size={14} /> PDF
                    </a>
                 )}
             </div>
          )}
      </div>
    </div>
  );
};

const FieldAssignments = () => {
    const [assignments, setAssignments] = useState([]);
    const [officers, setOfficers] = useState([]);
    const [officerMap, setOfficerMap] = useState({});
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ total: 0, pending: 0, completed: 0 });

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedClaim, setSelectedClaim] = useState(null);
    const [inspectorId, setInspectorId] = useState('');
    const [deadline, setDeadline] = useState('');
    const [trackAssignment, setTrackAssignment] = useState(null);

    const fetchData = async () => {
        try {
            const [assignRes, officerRes] = await Promise.all([
                axios.get(getApiUrl('inspections/assignments')),
                axios.get(getApiUrl('inspections/officers'))
            ]);
            
            setAssignments(assignRes.data || []);
            setOfficers(officerRes.data || []);
            
            // Build map for easy lookup
            const map = {};
            (officerRes.data || []).forEach(off => {
                map[off.officer_id] = off;
            });
            setOfficerMap(map);
            
            // Calc stats
            const data = assignRes.data || [];
            const total = data.length;
            const pending = data.filter(a => a.inspection_status === 'pending').length;
            const completed = data.filter(a => a.inspection_status === 'report_submitted').length;
            setStats({ total, pending, completed });
        } catch (error) {
            console.error("Error fetching data:", error);
            setAssignments([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleAssignClick = (claim) => {
        setSelectedClaim(claim);
        setIsModalOpen(true);
    };

    const handleTrackClick = (assignment) => {
        setTrackAssignment(assignment);
    };

    const submitAssignment = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`${getApiUrl('inspections/assign')}?claim_id=${selectedClaim.id}`, {
                inspector_id: inspectorId,
                deadline_date: new Date(deadline).toISOString()
            });

            setIsModalOpen(false);
            fetchData(); // Refresh
        } catch (error) {
            console.error("Assignment failed", error);
            alert("Failed to assign inspector");
        }
    };

    if (loading) return <div className="flex h-96 items-center justify-center"><Loader2 className="animate-spin text-green-500" /></div>;

    return (
        <div className="space-y-6">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Field Assignments</h1>
                    <p className="text-slate-500 dark:text-gray-500 dark:text-gray-400">Manage field officer visits and reports</p>
                </div>
                <div className="flex gap-4">
                    <div className="bg-white dark:bg-slate-900 px-4 py-2 rounded-lg border border-gray-100 dark:border-slate-800 shadow-sm">
                        <span className="text-xs text-slate-500 dark:text-gray-500 block">Pending</span>
                        <span className="text-lg font-bold text-yellow-600">{stats.pending}</span>
                    </div>
                    <div className="bg-white dark:bg-slate-900 px-4 py-2 rounded-lg border border-gray-100 dark:border-slate-800 shadow-sm">
                        <span className="text-xs text-slate-500 dark:text-gray-500 block">Reports Ready</span>
                        <span className="text-lg font-bold text-green-600">{stats.completed}</span>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {assignments.map(assignment => (
                    <AssignmentCard 
                        key={assignment.id} 
                        assignment={assignment} 
                        officerMap={officerMap}
                        onAssign={handleAssignClick}
                        onTrack={handleTrackClick}
                    />
                ))}
                
                {assignments.length === 0 && (
                    <div className="col-span-full py-12 text-center text-slate-600 dark:text-gray-400">
                        No assignments found.
                    </div>
                )}
            </div>
            
            {/* Tracking Modal */}
            {trackAssignment && (
                <TrackingModal 
                    assignment={trackAssignment} 
                    officerMap={officerMap}
                    onClose={() => setTrackAssignment(null)} 
                />
            )}


            {/* Assignment Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md p-6 shadow-2xl">
                        <h3 className="text-lg font-bold mb-4 dark:text-white">Assign Inspector</h3>
                        <form onSubmit={submitAssignment} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Select Inspector</label>
                                <select 
                                    className="w-full p-2 rounded-lg border dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                                    value={inspectorId}
                                    onChange={e => setInspectorId(e.target.value)}
                                    required
                                >
                                    <option value="">Select an officer...</option>
                                    {officers.map(officer => (
                                        <option key={officer.officer_id} value={officer.officer_id}>
                                            {officer.name} ({officer.zone})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Visit Deadline</label>
                                <input 
                                    type="date"
                                    className="w-full p-2 rounded-lg border dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                                    value={deadline}
                                    onChange={e => setDeadline(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="flex justify-end gap-3 mt-6">
                                <button 
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit"
                                    className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-bold hover:bg-green-700"
                                >
                                    Confirm Assignment
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
export default FieldAssignments;
