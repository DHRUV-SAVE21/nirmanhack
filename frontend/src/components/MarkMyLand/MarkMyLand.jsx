import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence } from 'framer-motion';

// Modular Components
import ProgressIndicator from './modules/ProgressIndicator';
import Step1Map from './modules/Step1Map';
import Step2Upload from './modules/Step2Upload';
import Step3OCR from './modules/Step3OCR';
import Step4Result from './modules/Step4Result';
import Step5Additional from './modules/Step5Additional';

const MarkMyLand = () => {
    const { t } = useTranslation();
    const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
    const [step, setStep] = useState(1);
    const [polygon, setPolygon] = useState([]);
    const [landData, setLandData] = useState(null);
    const [docData, setDocData] = useState(null);
    const [verificationResult, setVerificationResult] = useState(null);
    const [additionalDocs, setAdditionalDocs] = useState({
        sevenTwelve: null,
        khataUtara: null
    });
    const [loading, setLoading] = useState(false);
    const [existingLands, setExistingLands] = useState([]);

    const steps = [
        { id: 1, label: 'Map Plot' },
        { id: 2, label: 'Deed Upload' },
        { id: 3, label: 'AI Review' },
        { id: 4, label: 'Blockchain ID' },
        { id: 5, label: 'Registry Final' }
    ];

    // Fetch existing lands on load
    useEffect(() => {
        const userStr = localStorage.getItem('user');
        const user = userStr ? JSON.parse(userStr) : null;
        const userId = user?.user_id || user?.id;

        fetch(`${apiBase}/api/feature1/lands`)
            .then(res => res.json())
            .then(data => {
                if (userId) {
                    const sorted = [...data].sort((a, b) => (a.user_id === userId ? -1 : 1));
                    setExistingLands(sorted);
                } else {
                    setExistingLands(data);
                }
            })
            .catch(err => console.error("Failed to load lands:", err));
    }, [apiBase]);

    const handlePolygonChange = (points) => {
        setPolygon(points);
    };

    const handleClearMap = async () => {
        console.log("[MarkMyLand] Selective Permanent Clear started...");
        const userStr = localStorage.getItem('user');
        const user = userStr ? JSON.parse(userStr) : null;
        const userId = user?.user_id || user?.id || "demo-user";

        const targets = existingLands.filter(l => 
            l.user_id === userId && l.status === 'REJECTED'
        );

        if (targets.length > 0) {
            setLoading(true);
            try {
                await Promise.all(targets.map(t => 
                    fetch(`${apiBase}/api/feature1/land/${t.id}`, { method: 'DELETE' })
                ));
            } catch (err) {
                console.error("Failed to delete some records from DB:", err);
            } finally {
                setLoading(false);
            }
        }

        setPolygon([]);
        setLandData(null);
        setDocData(null);
        setVerificationResult(null);
        setExistingLands(prev => prev.filter(l => 
            !(l.user_id === userId && l.status === 'REJECTED')
        ));
        setStep(1); 
    };

    const submitLand = async () => {
        if (polygon.length < 3) return;
        const userStr = localStorage.getItem('user');
        const user = userStr ? JSON.parse(userStr) : null;
        const userId = user?.user_id || user?.id || "demo-user";

        setLoading(true);
        try {
            const response = await fetch(`${apiBase}/api/feature1/land/record`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: userId, coordinates: polygon })
            });

            if (!response.ok) throw new Error('Failed to record land');

            const result = await response.json();
            if (result.data && result.data.length > 0) {
                const userObj = userStr ? JSON.parse(userStr) : {};
                const newLand = { 
                    ...result.data[0], 
                    status: 'PENDING', 
                    users: { 
                        full_name: userObj?.full_name || 'Demo Farmer', 
                        phone_number: userObj?.phone_number || '+91'
                    } 
                };
                setLandData(newLand);
                setExistingLands(prev => [newLand, ...prev]);
                setStep(2); 
            }
        } catch (error) {
            console.error(error);
            alert(t('error_recording_land') + ": " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleUploadComplete = (documentData) => {
        setDocData(documentData);
        setStep(3);
    };

    const verifyLandClaim = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${apiBase}/api/feature1/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ land_id: landData.id, document_id: docData.id })
            });

            if (!response.ok) throw new Error('Verification failed');
            const result = await response.json();
            setVerificationResult(result);
            setStep(4);
        } catch (error) {
            console.error(error);
            alert(t('error_verifying'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div data-tour="markmyland-main" className="container mx-auto p-4 max-w-6xl min-h-screen bg-slate-950/20 rounded-3xl backdrop-blur-3xl pb-24">
            <header className="pt-12 pb-16 text-center">
                 <h1 className="text-5xl font-black mb-4 text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-400 to-blue-500 tracking-tighter italic">
                     {t('mark_my_land')}
                 </h1>
                 <p className="text-slate-500 uppercase font-black text-[10px] tracking-[0.5em]">{t('production_ready_registry')}</p>
            </header>

            <ProgressIndicator currentStep={step} steps={steps} />

            <div className="mt-12 relative">
                <AnimatePresence mode="wait">
                    {step === 1 && (
                        <Step1Map 
                            key="step1"
                            onPolygonChange={handlePolygonChange}
                            existingLands={existingLands}
                            handleClearMap={handleClearMap}
                            submitLand={submitLand}
                            polygon={polygon}
                            loading={loading}
                            t={t}
                        />
                    )}

                    {step === 2 && (
                        <Step2Upload 
                            key="step2"
                            landData={landData}
                            handleUploadComplete={handleUploadComplete}
                            loading={loading}
                            t={t}
                        />
                    )}

                    {step === 3 && docData && (
                        <Step3OCR 
                            key="step3"
                            docData={docData}
                            landData={landData}
                            verifyLandClaim={verifyLandClaim}
                            setStep={setStep}
                            loading={loading}
                            t={t}
                        />
                    )}

                    {step === 4 && verificationResult && (
                        <Step4Result 
                            key="step4"
                            verificationResult={verificationResult}
                            landData={landData}
                            docData={docData}
                            setStep={setStep}
                            t={t}
                        />
                    )}

                    {step === 5 && (
                        <Step5Additional 
                            key="step5"
                            landData={landData}
                            additionalDocs={additionalDocs}
                            setAdditionalDocs={setAdditionalDocs}
                            t={t}
                        />
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default MarkMyLand;
