import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import GlassCard from '../components/ui/GlassCard';
import ModernNavbar from '../components/ui/ModernNavbar';
import {
  Search,
  Filter,
  TrendingUp,
  MapPin,
  Star,
  ShoppingCart,
  Leaf,
  Award,
  Shield,
  Phone,
  Heart,
  Eye
} from 'lucide-react';

const ModernMarketplace = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = [
    { id: 'all', label: 'All Products' },
    { id: 'grains', label: 'Grains' },
    { id: 'vegetables', label: 'Vegetables' },
    { id: 'fruits', label: 'Fruits' },
    { id: 'organic', label: 'Organic' }
  ];

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMarketplace = async () => {
      setLoading(true);
      try {
        const apiBase = import.meta.env.VITE_API_BASE_URL || 'https://let-go-3-0.onrender.com';
        const res = await fetch(`${apiBase}/api/feature6/marketplace`);
        const data = await res.json();
        setProducts(data || []);
      } catch (e) {
        console.error("Marketplace fetch error:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchMarketplace();
  }, []);

  const filteredProducts = products.filter(product => {
    const matchesCategory = selectedCategory === 'all' || (product.category?.toLowerCase() === selectedCategory);
    const matchesSearch = product.crop_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.variety?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
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
            className="mb-8"
          >
            <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 dark:text-white mb-4">
              Farmer's Marketplace
            </h1>
            <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-400">
              Direct from farm to your doorstep • Fresh & Verified
            </p>
          </motion.div>

          {/* Search and Filter */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8"
          >
            <GlassCard className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-600 dark:text-slate-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search products or farmers..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 rounded-xl bg-slate-100 dark:bg-white/10 shadow-sm dark:shadow-none border border-white/20 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                  />
                </div>
                <button className="px-6 py-3 rounded-xl bg-slate-100 dark:bg-white/10 shadow-sm dark:shadow-none hover:bg-white/20 border border-white/20 text-slate-900 dark:text-white font-semibold flex items-center justify-center gap-2 transition-colors">
                  <Filter className="w-5 h-5" />
                  <span className="hidden sm:inline">Filters</span>
                </button>
              </div>

              {/* Categories */}
              <div className="flex gap-2 mt-4 overflow-x-auto no-scrollbar pb-2">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-4 py-2 rounded-lg font-semibold text-sm whitespace-nowrap transition-all ${selectedCategory === cat.id
                      ? 'bg-green-500 text-white shadow-lg shadow-green-500/30'
                      : 'bg-white/10 text-slate-300 hover:bg-white/20'
                      }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </GlassCard>
          </motion.div>

          {/* Products Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product, i) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * i }}
              >
                <GlassCard className="overflow-hidden group hover:shadow-2xl hover:shadow-green-500/10 transition-all duration-300">
                  {/* Product Image */}
                  <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-green-500/20 to-blue-500/20">
                    <img
                      src={product.image_url || 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&q=80&w=300'}
                      alt={product.crop_name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />

                    {/* Badges */}
                    <div className="absolute top-3 left-3 flex flex-col gap-2">
                      {product.verified_badge && (
                        <div className="px-3 py-1 rounded-full bg-green-500/90 backdrop-blur-sm flex items-center gap-1">
                          <Shield className="w-3 h-3 text-slate-900 dark:text-white" />
                          <span className="text-slate-900 dark:text-white text-xs font-bold">Verified</span>
                        </div>
                      )}
                      {product.integrity_score > 90 && (
                        <div className="px-3 py-1 rounded-full bg-emerald-500/90 backdrop-blur-sm flex items-center gap-1">
                          <Leaf className="w-3 h-3 text-slate-900 dark:text-white" />
                          <span className="text-slate-900 dark:text-white text-xs font-bold">High Trust</span>
                        </div>
                      )}
                    </div>

                    {/* Quick Actions */}
                    <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-2 rounded-full bg-white/90 backdrop-blur-sm hover:bg-white transition-colors">
                        <Heart className="w-4 h-4 text-slate-700" />
                      </button>
                      <button
                        onClick={() => navigate(`/product-transparency/${product.batch_id}`)}
                        className="p-2 rounded-full bg-white/90 backdrop-blur-sm hover:bg-white transition-colors"
                      >
                        <Eye className="w-4 h-4 text-slate-700" />
                      </button>
                    </div>

                    {/* Stock Status */}
                    <div className="absolute bottom-3 left-3">
                      <div className="px-3 py-1 rounded-full backdrop-blur-sm text-xs font-bold bg-green-500/90 text-white">
                        {product.quantity > 0 ? 'In Stock' : 'Sold Out'}
                      </div>
                    </div>
                  </div>

                  <div className="p-5">
                    {/* Product Header */}
                    <div className="mb-3">
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1 line-clamp-1">{product.crop_name}</h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {product.district || product.location || 'Rural Center'}
                      </p>
                    </div>

                    {/* Farmer Info */}
                    <div className="flex items-center gap-3 mb-4 pb-4 border-b border-slate-200 dark:border-white/10">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-emerald-400 flex items-center justify-center text-white font-bold text-sm">
                        {product.farmer_id?.charAt(0) || 'F'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">Farmer #{product.farmer_id?.substring(0, 8)}</p>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1">
                            <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                            <span className="text-xs text-slate-600 dark:text-slate-400">4.9</span>
                          </div>
                          <span className="text-xs text-slate-500">•</span>
                          <span className="text-xs text-slate-600 dark:text-slate-400">{product.variety}</span>
                        </div>
                      </div>
                    </div>

                    {/* Price */}
                    <div className="flex items-end justify-between mb-4">
                      <div>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Base Price</p>
                        <div className="flex items-baseline gap-2">
                          <p className="text-2xl font-bold text-green-400">
                            ₹{product.price_per_quintal}
                          </p>
                          <span className="text-sm text-slate-600 dark:text-slate-400">/quintal</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-slate-500">Available</p>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">{product.quantity} Qtl</p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button className="flex-1 px-4 py-2.5 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold transition-all shadow-lg shadow-green-500/30 flex items-center justify-center gap-2">
                        <TrendingUp className="w-4 h-4" />
                        <span className="text-sm">Place Bid</span>
                      </button>
                      <button
                        onClick={() => navigate(`/product-transparency/${product.batch_id}`)}
                        className="px-4 py-2.5 rounded-lg bg-slate-100 dark:bg-white/10 shadow-sm dark:shadow-none hover:bg-white/20 text-slate-900 dark:text-white font-semibold transition-colors border border-white/20"
                      >
                        <Shield className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>

          {/* No Results */}
          {filteredProducts.length === 0 && (
            <div className="text-center py-12">
              <Leaf className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-600 dark:text-slate-400 text-lg">No products found</p>
              <p className="text-slate-500 text-sm mt-2">Try adjusting your search or filters</p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default ModernMarketplace;
