import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import ModernNavbar from '../components/ui/ModernNavbar';
import GlassCard from '../components/ui/GlassCard';
import {
  Upload,
  Camera,
  Leaf,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Droplets,
  Sun,
  Wind,
  ArrowRight,
  Zap
} from 'lucide-react';
import { speakText } from '../utils/voiceUtils';
import { useLanguageStore } from '../store/themeStore';

const CropHealthModern = () => {
  const navigate = useNavigate();
  const [selectedImage, setSelectedImage] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result);
        // Simulate analysis
        setAnalyzing(true);
        setTimeout(() => {
          setAnalyzing(false);
          setResult({
            health: 'Healthy',
            confidence: 94,
            disease: null,
            recommendations: [
              'Continue current watering schedule',
              'Monitor for pest activity',
              'Apply organic fertilizer in 1 week'
            ]
          });
          speakText("आपके फसल का स्वास्थ्य बहुत अच्छा है। सभी पैरामीटर सामान्य हैं।", 'hi');
        }, 2000);
      };
      reader.readAsDataURL(file);
    }
  };

  const quickStats = [
    { icon: Leaf, label: 'Crop Health', value: '92%', color: 'green' },
    { icon: Droplets, label: 'Soil Moisture', value: '68%', color: 'blue' },
    { icon: Sun, label: 'Sunlight', value: 'Optimal', color: 'amber' },
    { icon: Wind, label: 'Air Quality', value: 'Good', color: 'purple' }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 relative overflow-hidden">

      {/* Background Image with Overlay */}
      <div className="fixed inset-0 z-0">
        <img
          src="/assets/leaf-image.webp"
          alt="Crop background"
          className="w-full h-full object-cover opacity-20"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-950/95 to-slate-950" />

        {/* Animated Network Overlay */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-green-500/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10">
        <ModernNavbar />

        <div className="min-h-screen pt-32 px-4 sm:px-6 lg:px-8 pb-12 max-w-7xl mx-auto">

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/20 border border-green-500/30 text-green-400 text-sm font-semibold mb-6">
              <Zap className="w-4 h-4" />
              AI-Powered Crop Analysis
            </div>

            <h1 className="text-5xl sm:text-6xl font-bold mb-4">
              <span className="text-slate-900 dark:text-white">Crop Health </span>
              <span className="bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                Detection
              </span>
            </h1>

            <p className="text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto">
              Upload a photo of your crop and get instant AI-powered health analysis
            </p>
          </motion.div>

          {/* Quick Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12"
          >
            {quickStats.map((stat, i) => (
              <GlassCard key={i} className="p-6 text-center">
                <div className={`p-3 rounded-xl bg-${stat.color}-500/20 border border-${stat.color}-500/30 inline-block mb-3`}>
                  <stat.icon className={`w-6 h-6 text-${stat.color}-400`} />
                </div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white mb-1">{stat.value}</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">{stat.label}</p>
              </GlassCard>
            ))}
          </motion.div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">

            {/* Upload Section */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="w-full"
            >
              <GlassCard className="p-6 lg:p-8 h-full">
                <h2 className="text-xl lg:text-2xl font-bold text-slate-900 dark:text-white mb-4 lg:mb-6">Upload Crop Image</h2>

                {!selectedImage ? (
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="crop-upload"
                    />
                    <label
                      htmlFor="crop-upload"
                      className="block cursor-pointer"
                    >
                      <div className="relative aspect-video rounded-2xl border-2 border-dashed border-white/20 hover:border-green-500/50 transition-colors bg-white dark:bg-white/5 shadow-sm dark:shadow-none flex flex-col items-center justify-center gap-4">
                        <Upload className="w-16 h-16 text-slate-600 dark:text-slate-400" />
                        <div className="text-center">
                          <p className="text-slate-900 dark:text-white font-semibold mb-1">Click to upload</p>
                          <p className="text-sm text-slate-600 dark:text-slate-400">or drag and drop</p>
                        </div>
                      </div>
                    </label>

                    <div className="mt-4 flex gap-3">
                      <button className="flex-1 px-4 py-3 rounded-xl bg-slate-100 dark:bg-white/10 shadow-sm dark:shadow-none hover:bg-white/20 text-slate-900 dark:text-white font-semibold transition-colors flex items-center justify-center gap-2">
                        <Camera className="w-5 h-5" />
                        Take Photo
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="relative aspect-video rounded-2xl overflow-hidden">
                      <img
                        src={selectedImage}
                        alt="Uploaded crop"
                        className="w-full h-full object-cover"
                      />
                      {analyzing && (
                        <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center">
                          <div className="text-center">
                            <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                            <p className="text-slate-900 dark:text-white font-semibold">Analyzing crop health...</p>
                          </div>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => {
                        setSelectedImage(null);
                        setResult(null);
                      }}
                      className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-white/10 shadow-sm dark:shadow-none hover:bg-white/20 text-slate-900 dark:text-white font-semibold transition-colors"
                    >
                      Upload Different Image
                    </button>
                  </div>
                )}
              </GlassCard>
            </motion.div>

            {/* Results Section */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="w-full"
            >
              <GlassCard className="p-6 lg:p-8 h-full">
                <h2 className="text-xl lg:text-2xl font-bold text-slate-900 dark:text-white mb-4 lg:mb-6">Analysis Results</h2>

                {!result ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Leaf className="w-16 h-16 text-slate-600 mb-4" />
                    <p className="text-slate-600 dark:text-slate-400">Upload an image to see analysis results</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Health Status */}
                    <div className="p-6 rounded-2xl bg-green-500/10 border border-green-500/30">
                      <div className="flex items-center gap-3 mb-3">
                        <CheckCircle className="w-8 h-8 text-green-400" />
                        <div>
                          <p className="text-sm text-slate-600 dark:text-slate-400">Health Status</p>
                          <p className="text-2xl font-bold text-slate-900 dark:text-white">{result.health}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-slate-100 dark:bg-white/10 shadow-sm dark:shadow-none rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"
                            style={{ width: `${result.confidence}%` }}
                          />
                        </div>
                        <span className="text-sm font-semibold text-green-400">{result.confidence}%</span>
                      </div>
                    </div>

                    {/* Recommendations */}
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-green-400" />
                        Recommendations
                      </h3>
                      <div className="space-y-3">
                        {result.recommendations.map((rec, i) => (
                          <div key={i} className="flex items-start gap-3 p-4 rounded-xl bg-white dark:bg-white/5 shadow-sm dark:shadow-none">
                            <div className="w-2 h-2 rounded-full bg-green-400 mt-2" />
                            <p className="text-slate-700 dark:text-slate-300 flex-1">{rec}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                      <button className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold transition-all shadow-lg shadow-green-500/30 flex items-center justify-center gap-2">
                        View Details <ArrowRight className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                )}
              </GlassCard>
            </motion.div>
          </div>

          {/* Recent Scans */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-12"
          >
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Recent Scans</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <GlassCard key={i} className="p-6">
                  <div className="aspect-video rounded-xl bg-gradient-to-br from-green-500/20 to-blue-500/20 mb-4" />
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">Scan #{i}</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">2 days ago</p>
                    </div>
                    <div className="px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-sm font-semibold">
                      Healthy
                    </div>
                  </div>
                </GlassCard>
              ))}
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  );
};

export default CropHealthModern;
