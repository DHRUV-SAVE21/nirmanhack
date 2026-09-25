import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
import GalaxyBackground from './components/three/GalaxyBackground';
import EarthWaves from './components/three/EarthWaves';
import GooeyNavbar from './components/layout/GooeyNavbar';
import VoiceFloatingButton from './components/layout/VoiceFloatingButton';
import CallingAssistantButton from './components/layout/CallingAssistantButton';
import NugenChatbot from './components/NugenChatbot/NugenChatbot';
import ReloadPrompt from './components/pwa/ReloadPrompt';
import OfflineIndicator from './components/features/OfflineIndicator';
import ErrorBoundary from './components/ErrorBoundary';
import GuidedTour from './components/GuidedTour/GuidedTour';
import WelcomePersonaModal from './components/GuidedTour/WelcomePersonaModal';
import LandingPage from './pages/LandingPage';
import ModernLandingPage from './pages/ModernLandingPage';
import EnhancedLandingPage from './pages/EnhancedLandingPage';
import ModernFeatures from './pages/ModernFeatures';
import AuthPage from './pages/AuthPage';
import FaceAuth from './pages/FaceAuth';
import FarmerDashboard from './pages/FarmerDashboard';
import ModernFarmerDashboard from './pages/ModernFarmerDashboard';
import EquipmentAnalyzer from './pages/EquipmentAnalyzer';
import MarkMyLand from './components/MarkMyLand/MarkMyLand';
import CropHealthDashboard from './components/CropHealth/Dashboard';
import CropHealthModern from './pages/CropHealthModern';
import InsuranceForm from './components/CropHealth/InsuranceForm';
import TrustReport from './components/Feature3/TrustReport';
import CropRecommendation from './components/features/CropRecommendation/CropRecommendation';
import FarmerNews from './components/features/DisasterNews/DisasterNews';
import SchemesPage from './pages/SchemesPage';
import Marketplace from './pages/Marketplace';
import ModernMarketplace from './pages/ModernMarketplace';
import FarmerInventory from './pages/FarmerInventory';
import ModernInventory from './pages/ModernInventory';
import AddBatch from './pages/AddBatch';
import ProductTransparency from './pages/ProductTransparency';
import ClaimApplication from './pages/ClaimApplication';
import FarmerProfile from './pages/FarmerProfile';
import ModernProfile from './pages/ModernProfile';
import InspectorDashboard from './pages/InspectorDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import CropYieldPrediction from './pages/CropYieldPrediction';

import DebugAuth from './pages/DebugAuth';

// Admin Imports
import AdminLayout from './admin/layout/AdminLayout';
import AdminDashboard from './admin/pages/AdminDashboard';
import Claims from './admin/pages/Claims';
import ClaimDetail from './admin/pages/ClaimDetail';
import FieldAssignments from './admin/pages/FieldAssignments';
import Broadcast from './admin/pages/Broadcast';
import AdminSchemes from './admin/pages/AdminSchemes';
import AdminReports from './admin/pages/AdminReports';
import AdminLandRegistration from './admin/pages/AdminLandRegistration';

import { useThemeStore } from './store/themeStore';
import PageIntroHandler from './components/layout/PageIntroHandler';

function AppContent() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');

  return (
    <main className={`relative min-h-screen font-sans transition-colors duration-500`}>
      {/* Global Navigation - Hidden on Admin Pages */}
      {!isAdmin && (
        <ErrorBoundary>
          <GooeyNavbar />
        </ErrorBoundary>
      )}

      <OfflineIndicator />
      <ReloadPrompt />

      {/* Persona & Guided Tour */}
      <WelcomePersonaModal />
      <GuidedTour />

      {/* Routes */}
      <Routes>
        <Route path="/" element={<ErrorBoundary><LandingPage /></ErrorBoundary>} />
        <Route path="/enhanced" element={<ErrorBoundary><EnhancedLandingPage /></ErrorBoundary>} />
        <Route path="/modern" element={<ErrorBoundary><ModernLandingPage /></ErrorBoundary>} />
        <Route path="/landing" element={<ErrorBoundary><LandingPage /></ErrorBoundary>} />
        {/* Authentication */}
        <Route path="/auth-face" element={<ErrorBoundary><FaceAuth /></ErrorBoundary>} />
        <Route path="/auth" element={<ErrorBoundary><AuthPage /></ErrorBoundary>} />
        <Route path="/debug-auth" element={<ErrorBoundary><DebugAuth /></ErrorBoundary>} />

        {/* Protected Routes - Farmer/User scope - PROTECTION TEMPORARILY DISABLED */}
        <Route path="/dashboard" element={<ErrorBoundary><FarmerDashboard /></ErrorBoundary>} />
        <Route path="/dashboard-modern" element={<ErrorBoundary><ModernFarmerDashboard /></ErrorBoundary>} />
        <Route path="/equipment" element={<ErrorBoundary><EquipmentAnalyzer /></ErrorBoundary>} />
        <Route path="/mark-my-land" element={<ErrorBoundary><MarkMyLand /></ErrorBoundary>} />
        <Route path="/crop-health" element={<ErrorBoundary><CropHealthDashboard /></ErrorBoundary>} />
        {/* /insurance-claim removed in favor of /apply-claim */}
        <Route path="/apply-claim" element={<ErrorBoundary><ClaimApplication /></ErrorBoundary>} />
        <Route path="/profile" element={<ErrorBoundary><FarmerProfile /></ErrorBoundary>} />
        <Route path="/profile-modern" element={<ErrorBoundary><ModernProfile /></ErrorBoundary>} />

        {/* Feature: Crop Yield Prediction */}
        <Route path="/crop-yield-prediction" element={<ErrorBoundary><CropYieldPrediction /></ErrorBoundary>} />

        <Route path="/trust-report/:batchId" element={<ErrorBoundary><TrustReport /></ErrorBoundary>} />

        {/* Feature 4: Smart Crop Recommender - PROTECTION TEMPORARILY DISABLED */}
        <Route path="/crop-recommendation" element={<ErrorBoundary><CropRecommendation /></ErrorBoundary>} />
        <Route path="/disaster-news" element={<ErrorBoundary><FarmerNews /></ErrorBoundary>} />

        {/* Feature 4: Schemes Agent - PROTECTION TEMPORARILY DISABLED */}
        <Route path="/schemes-assistant" element={<ErrorBoundary><SchemesPage /></ErrorBoundary>} />

        {/* Feature 6: Improved Inventory & Marketplace System - PROTECTION TEMPORARILY DISABLED */}
        <Route path="/inventory" element={<ErrorBoundary><FarmerInventory /></ErrorBoundary>} />
        <Route path="/inventory-modern" element={<ErrorBoundary><ModernInventory /></ErrorBoundary>} />
        <Route path="/add-batch" element={<ErrorBoundary><AddBatch /></ErrorBoundary>} />
        <Route path="/marketplace" element={<ErrorBoundary><Marketplace /></ErrorBoundary>} />
        <Route path="/marketplace-modern" element={<ErrorBoundary><ModernMarketplace /></ErrorBoundary>} />
        <Route path="/product-transparency/:batchId" element={<ErrorBoundary><ProductTransparency /></ErrorBoundary>} />

        {/* Admin Routes - PROTECTION TEMPORARILY DISABLED */}
        <Route path="/inspector/dashboard" element={<ErrorBoundary><InspectorDashboard /></ErrorBoundary>} />

        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="claims" element={<Claims />} />
          <Route path="land-verification" element={<AdminLandRegistration />} />
          <Route path="claims/:id" element={<ClaimDetail />} />
          <Route path="assignments" element={<FieldAssignments />} />
          <Route path="broadcasts" element={<Broadcast />} />
          <Route path="schemes" element={<AdminSchemes />} />
          <Route path="reports" element={<AdminReports />} />
        </Route>

        {/* Placeholder routes */}
        {/* Python Backend & Feature 5 Placeholders */}
        <Route path="/features" element={<div className="pt-32 text-center text-2xl">Features Coming Soon</div>} />
        <Route path="/features-modern" element={<ErrorBoundary><ModernFeatures /></ErrorBoundary>} />

        {/* Teammate Showcase Route */}
        <Route path="/showcase/waves" element={
          <ErrorBoundary>
            <div className="w-full h-screen relative">
              <div className="absolute top-24 left-0 w-full text-center z-10 pointer-events-none">
                <h1 className="text-4xl font-bold text-slate-900 dark:text-white drop-shadow-lg">Original Waves Design</h1>
                <p className="text-slate-700 dark:text-gray-300">For Team Review</p>
              </div>
              <EarthWaves mode="hero" />
            </div>
          </ErrorBoundary>
        } />
      </Routes>

      {/* Global Voice Assistant & Nugen AI Chatbot - Hidden on Admin Pages */}
      {!isAdmin && (
        <ErrorBoundary>
          <CallingAssistantButton />
          <VoiceFloatingButton />
          <NugenChatbot />
        </ErrorBoundary>
      )}
    </main>
  );
}

function App() {
  const theme = useThemeStore((state) => state.theme);

  React.useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  // Initialize Lenis Smooth Scroll
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1,
      smoothTouch: false,
      touchMultiplier: 2,
    });

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
    };
  }, []);

  // Main render
  return (
    <ErrorBoundary>
      <Router>
        <PageIntroHandler />
        <AppContent />
      </Router>
    </ErrorBoundary>
  );
}

export default App;
