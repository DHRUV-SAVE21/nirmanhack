import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import CameraDiagnose from './CameraDiagnose';
import SatelliteMonitor from './SatelliteMonitor';
import { Camera, Satellite, ArrowLeft } from 'lucide-react';

const CropHealthDashboard = () => {
    const { t } = useTranslation();
    const [mode, setMode] = useState(null); // 'camera', 'satellite', or null (dashboard)

    return (
        <div className="w-full min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white transition-colors duration-300">
            {/* Main Navigation (Centered within full screen) */}
            {!mode && (
                <div className="container mx-auto p-4 max-w-6xl pt-32">
                    <h1 className="text-3xl md:text-5xl font-bold mb-16 text-center tracking-tight">
                        {t('cropHealth.title')} <span className="text-green-600 dark:text-green-500">{t('cropHealth.commandCenter')}</span>
                    </h1>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 px-4">
                        <button
                            onClick={() => setMode('camera')}
                            className="group relative h-80 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 hover:border-green-500 dark:hover:border-green-500 transition-all flex flex-col items-center justify-center gap-6 overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1"
                        >
                            <div className="p-6 bg-green-50 dark:bg-green-900/20 rounded-full group-hover:scale-110 transition-transform duration-500">
                                <Camera size={48} className="text-green-600 dark:text-green-500" />
                            </div>
                            <div className="text-center z-10 px-6">
                                <h2 className="text-2xl font-bold mb-2 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">{t('cropHealth.opticalDiagnostic')}</h2>
                                <p className="text-slate-500 dark:text-slate-400 font-medium max-w-xs mx-auto">{t('cropHealth.opticalDesc')}</p>
                            </div>
                        </button>

                        <button
                            onClick={() => setMode('satellite')}
                            className="group relative h-80 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 transition-all flex flex-col items-center justify-center gap-6 overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1"
                        >
                            <div className="p-6 bg-blue-50 dark:bg-blue-900/20 rounded-full group-hover:scale-110 transition-transform duration-500">
                                <Satellite size={48} className="text-blue-600 dark:text-blue-500" />
                            </div>
                            <div className="text-center z-10 px-6">
                                <h2 className="text-2xl font-bold mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{t('cropHealth.satelliteMonitor')}</h2>
                                <p className="text-slate-500 dark:text-slate-400 font-medium max-w-xs mx-auto">{t('cropHealth.satelliteDesc')}</p>
                            </div>
                        </button>
                    </div>
                </div>
            )}

            {/* Mode Views (Full Screen) */}
            {mode && (
                <div className="w-full h-full relative">
                    {/* Back Button (Floating) - Positioned to not overlap header */}


                    {mode === 'camera' && <CameraDiagnose />}
                    {mode === 'satellite' && <SatelliteMonitor />}
                </div>
            )}
        </div>
    );
};

export default CropHealthDashboard;
