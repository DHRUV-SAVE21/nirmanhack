import React, { useState, useEffect } from 'react';
import { newsService } from '../../../services/newsService';
import { useLanguageStore } from '../../../store/themeStore';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Newspaper, MapPin, RefreshCw, Search,
  Leaf, CloudSun, IndianRupee, Tractor, Globe,
  AlertTriangle, Languages
} from 'lucide-react';

/**
 * FarmerNews component - refactored to use lucide-react and standard function declaration
 */
export default function FarmerNews() {
  const { language } = useLanguageStore();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [location, setLocation] = useState({ lat: null, lon: null });
  const [searchQuery, setSearchQuery] = useState('');
  const [city, setCity] = useState('Detecting Location...');
  const [placeName, setPlaceName] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Custom icon mapping based on category
  const getCategoryIcon = (category) => {
    switch (category?.toLowerCase()) {
      case 'agriculture': return <Leaf className="text-green-600" />;
      case 'harvest': return <Tractor className="text-amber-600" />;
      case 'market': return <IndianRupee className="text-blue-600" />;
      case 'weather': return <CloudSun className="text-sky-500" />;
      case 'scheme': return <Newspaper className="text-purple-600" />;
      case 'advisory': return <AlertTriangle className="text-red-500" />;
      case 'machinery': return <Tractor className="text-slate-600" />;
      case 'government': return <Newspaper className="text-orange-600" />;
      default: return <Globe className="text-slate-500 dark:text-gray-500" />;
    }
  };

  const getCityName = async (lat, lon) => {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
      const data = await response.json();
      if (data && data.address) {
        const city = data.address.city || data.address.town || data.address.village || data.address.county || '';
        const state = data.address.state || '';
        const country = data.address.country || '';
        let formattedName = city;
        if (state) formattedName += city ? `, ${state}` : state;
        if (!formattedName) formattedName = country;
        setPlaceName(formattedName);
        setCity(formattedName);
      }
    } catch (e) {
      console.error("Reverse geocoding failed", e);
      setPlaceName(`${lat.toFixed(2)}, ${lon.toFixed(2)}`);
    }
  };

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          setLocation({ lat, lon });
          setCity('Locating...');
          getCityName(lat, lon);
        },
        (error) => {
          console.warn('Geolocation denied:', error);
          setCity('India (Location Access Denied)');
        }
      );
    }
  }, []);

  const loadNews = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const data = await newsService.getNews({
        page: isRefresh ? 1 : page,
        limit: 12,
        location: searchQuery,
        latitude: location.lat,
        longitude: location.lon,
        lang: language
      });
      if (isRefresh) {
        setArticles(data.articles);
        setPage(1);
      } else {
        setArticles(data.articles);
      }
      setHasMore(data.has_more);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleFreshFetch = async () => {
    setRefreshing(true);
    try {
      await newsService.fetchFreshNews(searchQuery || 'India', language);
      await loadNews(true);
    } catch (err) {
      console.error(err);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadNews(true);
  }, [location.lat, location.lon, language]);

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-amber-600 bg-clip-text text-transparent flex items-center gap-2">
            <Newspaper /> Farmer News Feed
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1 flex items-center gap-2 text-sm">
            <MapPin className="text-green-500" />
            {(location.lat || placeName) ? `News for: ${placeName || city}` : city}
          </p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <div className="relative flex-grow md:flex-grow-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 dark:text-gray-400" />
            <input
              type="text"
              placeholder="Search region or crop..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 w-full focus:ring-2 focus:ring-green-500 outline-none transition"
              onKeyDown={(e) => e.key === 'Enter' && loadNews(true)}
            />
          </div>
          <button
            onClick={handleFreshFetch}
            disabled={refreshing}
            className={`px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center gap-2 transition shadow-lg ${refreshing ? 'opacity-75 cursor-not-allowed' : ''}`}
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Updating...' : 'Fetch Live News'}
          </button>
        </div>
      </div>

      {loading && !articles.length ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-64 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <AnimatePresence>
            {articles.map((article, idx) => (
              <motion.div
                key={article.id || idx}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: idx * 0.15, ease: "easeOut" }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 dark:border-gray-700 flex flex-col h-full"
              >
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={article.image_url}
                    alt={article.title}
                    className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-500"
                    onError={(e) => e.target.src = 'https://images.unsplash.com/photo-1596356453261-0d265ae2520a?w=600'}
                  />
                  <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm text-slate-900 dark:text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                    {getCategoryIcon(article.category)} {article.category}
                  </div>
                </div>
                <div className="p-4 flex-grow flex flex-col">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-semibold text-slate-500 dark:text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {article.source_name || 'News Source'}
                    </span>
                    <span className="text-xs text-slate-600 dark:text-gray-400">
                      {new Date(article.published_at).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 line-clamp-2 leading-tight hover:text-red-600 dark:hover:text-red-400 transition-colors">
                    <a href={article.article_url} target="_blank" rel="noopener noreferrer">
                      {article.title}
                    </a>
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm line-clamp-3 mb-4 flex-grow">
                    {article.description}
                  </p>
                  <div className="mt-auto pt-3 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center text-xs text-slate-500 dark:text-gray-500">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {article.location_name || 'Unknown Location'}
                    </span>
                    <a
                      href={article.article_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-red-600 hover:text-red-700 font-medium"
                    >
                      Read Check →
                    </a>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
