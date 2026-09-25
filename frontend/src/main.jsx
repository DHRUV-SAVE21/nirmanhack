import { StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './i18n';
import App from './App.jsx'

// Loading fallback for i18n translations
const I18nLoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-dark-navy">
    <div className="text-center">
      <div className="w-8 h-8 border-4 border-organic-green border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-slate-500 dark:text-gray-500 dark:text-gray-400">Loading...</p>
    </div>
  </div>
);

// Unregister any existing service workers to avoid stale cache issues
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    registrations.forEach((registration) => {
      registration.unregister();
      console.log('ServiceWorker unregistered');
    });
  });
}


createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Suspense fallback={<I18nLoadingFallback />}>
      <App />
    </Suspense>
  </StrictMode>,
)
