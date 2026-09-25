import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import ModernNavbar from '../components/ui/ModernNavbar';
import GlassCard from '../components/ui/GlassCard';
import { 
  Package, 
  Plus, 
  TrendingUp,
  TrendingDown,
  Calendar,
  MapPin,
  Eye,
  Edit,
  Trash2,
  QrCode,
  Download,
  Filter,
  Search
} from 'lucide-react';

const ModernInventory = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const stats = [
    { label: 'Total Batches', value: '24', change: '+12%', up: true, icon: Package },
    { label: 'In Stock', value: '18', change: '+8%', up: true, icon: TrendingUp },
    { label: 'Sold', value: '6', change: '-5%', up: false, icon: TrendingDown },
    { label: 'Revenue', value: '₹2.4L', change: '+15%', up: true, icon: TrendingUp }
  ];

  const batches = [
    {
      id: 'BATCH001',
      product: 'Organic Wheat',
      quantity: 500,
      unit: 'kg',
      status: 'In Stock',
      date: '2024-02-01',
      location: 'Warehouse A',
      price: 2150,
      image: '/assets/field-crop.jpg'
    },
    {
      id: 'BATCH002',
      product: 'Basmati Rice',
      quantity: 300,
      unit: 'kg',
      status: 'In Stock',
      date: '2024-02-03',
      location: 'Warehouse B',
      price: 3200,
      image: '/assets/leaf-image.webp'
    },
    {
      id: 'BATCH003',
      product: 'Fresh Tomatoes',
      quantity: 150,
      unit: 'kg',
      status: 'Sold',
      date: '2024-01-28',
      location: 'Warehouse A',
      price: 45,
      image: '/assets/field-crop.jpg'
    },
    {
      id: 'BATCH004',
      product: 'Green Chillies',
      quantity: 80,
      unit: 'kg',
      status: 'In Stock',
      date: '2024-02-05',
      location: 'Warehouse C',
      price: 60,
      image: '/assets/leaf-image.webp'
    }
  ];

  const filteredBatches = batches.filter(batch => {
    const matchesSearch = batch.product.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         batch.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'all' || batch.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 relative overflow-hidden">
      
      {/* Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-green-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
      </div>

      {/* Content */}
      <div className="relative z-10">
        <ModernNavbar />
        
        <div className="min-h-screen pt-32 px-4 sm:px-6 lg:px-8 pb-12 max-w-7xl mx-auto">
          
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8"
          >
            <div>
              <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 dark:text-white mb-2">
                Inventory Management
              </h1>
              <p className="text-lg text-slate-600 dark:text-slate-400">
                Track and manage your farm produce
              </p>
            </div>
            
            <button
              onClick={() => navigate('/add-batch')}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold transition-all shadow-lg shadow-green-500/30 flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add Batch
            </button>
          </motion.div>

          {/* Stats Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
          >
            {stats.map((stat, i) => (
              <GlassCard key={i} className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div className={`p-3 rounded-xl ${
                    stat.up ? 'bg-green-500/20 border border-green-500/30' : 'bg-red-500/20 border border-red-500/30'
                  }`}>
                    <stat.icon className={`w-6 h-6 ${stat.up ? 'text-green-400' : 'text-red-400'}`} />
                  </div>
                  <div className={`flex items-center gap-1 text-sm font-semibold ${
                    stat.up ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {stat.up ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                    {stat.change}
                  </div>
                </div>
                <p className="text-3xl font-bold text-slate-900 dark:text-white mb-1">{stat.value}</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">{stat.label}</p>
              </GlassCard>
            ))}
          </motion.div>

          {/* Search and Filter */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <GlassCard className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-600 dark:text-slate-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search by product or batch ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 rounded-xl bg-slate-100 dark:bg-white/10 shadow-sm dark:shadow-none border border-white/20 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                  />
                </div>
                
                <div className="flex gap-2">
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-4 py-3 rounded-xl bg-slate-100 dark:bg-white/10 shadow-sm dark:shadow-none border border-white/20 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
                  >
                    <option value="all" className="bg-white dark:bg-slate-900">All Status</option>
                    <option value="In Stock" className="bg-white dark:bg-slate-900">In Stock</option>
                    <option value="Sold" className="bg-white dark:bg-slate-900">Sold</option>
                  </select>
                  
                  <button className="px-4 py-3 rounded-xl bg-slate-100 dark:bg-white/10 shadow-sm dark:shadow-none hover:bg-white/20 border border-white/20 text-slate-900 dark:text-white transition-colors">
                    <Download className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </GlassCard>
          </motion.div>

          {/* Batches Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredBatches.map((batch, i) => (
              <motion.div
                key={batch.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * i }}
              >
                <GlassCard className="overflow-hidden group hover:shadow-2xl hover:shadow-green-500/10 transition-all duration-300">
                  <div className="flex flex-col sm:flex-row gap-4 p-6">
                    
                    {/* Image */}
                    <div className="relative w-full sm:w-32 h-32 rounded-xl overflow-hidden flex-shrink-0 bg-gradient-to-br from-green-500/20 to-blue-500/20">
                      <img 
                        src={batch.image}
                        alt={batch.product}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute top-2 right-2">
                        <button className="p-2 rounded-lg bg-white/90 backdrop-blur-sm hover:bg-white transition-colors">
                          <QrCode className="w-4 h-4 text-slate-700" />
                        </button>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1 truncate">{batch.product}</h3>
                          <p className="text-sm text-slate-600 dark:text-slate-400">ID: {batch.id}</p>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ml-2 ${
                          batch.status === 'In Stock'
                            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                            : 'bg-slate-500/20 text-slate-400 border border-slate-500/30'
                        }`}>
                          {batch.status}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <div>
                          <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Quantity</p>
                          <p className="text-sm font-semibold text-slate-900 dark:text-white">{batch.quantity} {batch.unit}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Price</p>
                          <p className="text-sm font-semibold text-green-400">₹{batch.price}/{batch.unit}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-xs text-slate-600 dark:text-slate-400 mb-4">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(batch.date).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {batch.location}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <button className="flex-1 px-3 py-2 rounded-lg bg-slate-100 dark:bg-white/10 shadow-sm dark:shadow-none hover:bg-white/20 text-slate-900 dark:text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2">
                          <Eye className="w-4 h-4" />
                          View
                        </button>
                        <button className="px-3 py-2 rounded-lg bg-slate-100 dark:bg-white/10 shadow-sm dark:shadow-none hover:bg-white/20 text-slate-900 dark:text-white transition-colors">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button className="px-3 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 transition-colors border border-red-500/30">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>

          {/* No Results */}
          {filteredBatches.length === 0 && (
            <div className="text-center py-12">
              <Package className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-600 dark:text-slate-400 text-lg">No batches found</p>
              <p className="text-slate-500 text-sm mt-2">Try adjusting your search or filters</p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default ModernInventory;
