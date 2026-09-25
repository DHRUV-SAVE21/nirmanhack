import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  ChevronRight, 
  Download,
  Eye
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ClaimListing = () => {
    const navigate = useNavigate();
  // Mock data - replace with API call
  const [claims] = useState([
    {
      id: 'CLM-2024-001',
      farmerName: 'Rajesh Kumar',
      farmId: 'FRM-8821',
      cropType: 'Wheat',
      lossPercentage: 45,
      amount: 25000,
      submissionDate: '2024-10-24',
      ndviScore: 0.82,
      status: 'Pending'
    },
    {
      id: 'CLM-2024-002',
      farmerName: 'Suresh Patil',
      farmId: 'FRM-1290',
      cropType: 'Rice',
      lossPercentage: 78,
      amount: 42000,
      submissionDate: '2024-10-23',
      ndviScore: 0.95,
      status: 'Approved'
    },
     {
      id: 'CLM-2024-003',
      farmerName: 'Anita Desai',
      farmId: 'FRM-3321',
      cropType: 'Cotton',
      lossPercentage: 30,
      amount: 15000,
      submissionDate: '2024-10-25',
      ndviScore: 0.65,
      status: 'Needs Verification'
    },
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-600 dark:text-gray-400 w-5 h-5" />
          <input 
            type="text" 
            placeholder="Search by name, ID or crop..." 
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>
        <div className="flex gap-2">
            <button className="flex items-center space-x-2 px-4 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 bg-white">
                <Filter className="w-4 h-4" />
                <span>Filter</span>
            </button>
             <button className="flex items-center space-x-2 px-4 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 bg-white">
                <Download className="w-4 h-4" />
                <span>Export</span>
            </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-gray-500 uppercase tracking-wider">Claim ID</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-gray-500 uppercase tracking-wider">Farmer</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-gray-500 uppercase tracking-wider">Crop Details</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-gray-500 uppercase tracking-wider">Loss Est.</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-gray-500 uppercase tracking-wider">Request Amount</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-gray-500 uppercase tracking-wider">NDVI Score</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 dark:text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {claims.map((claim) => (
                <tr key={claim.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{claim.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{claim.farmerName}</div>
                    <div className="text-xs text-slate-500 dark:text-gray-500">ID: {claim.farmId}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                     <span className="px-2 py-1 text-xs font-medium rounded-md bg-blue-50 text-blue-700">
                      {claim.cropType}
                     </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-gray-500 font-bold text-red-600">
                    {claim.lossPercentage}%
                  </td>
                   <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    ₹{claim.amount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                     <div className="flex items-center space-x-2">
                         <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                             <div 
                                className={`h-full ${claim.ndviScore > 0.8 ? 'bg-green-500' : claim.ndviScore > 0.5 ? 'bg-yellow-500' : 'bg-red-500'}`} 
                                style={{ width: `${claim.ndviScore * 100}%` }}
                             />
                         </div>
                         <span className="text-xs text-slate-500 dark:text-gray-500 font-medium">{claim.ndviScore}</span>
                     </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border
                      ${claim.status === 'Approved' ? 'bg-green-50 text-green-700 border-green-200' : 
                        claim.status === 'Pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 
                        claim.status === 'Needs Verification' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                        'bg-red-50 text-red-700 border-red-200'}`}>
                      {claim.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button 
                        onClick={() => navigate(`/admin/claims/${claim.id}`)}
                        className="text-blue-600 hover:text-blue-900 bg-blue-50 p-2 rounded-lg hover:bg-blue-100 transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
            <span className="text-sm text-slate-500 dark:text-gray-500">Showing 1 to 3 of 12 entries</span>
            <div className="flex gap-2">
                <button className="px-3 py-1 text-sm border border-gray-200 rounded-md bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50">Previous</button>
                <button className="px-3 py-1 text-sm border border-gray-200 rounded-md bg-white text-gray-600 hover:bg-gray-50">Next</button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ClaimListing;
