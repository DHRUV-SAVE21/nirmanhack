import React, { useRef, useCallback, useState } from 'react';
import Webcam from 'react-webcam';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, X, RotateCcw, Check, SwitchCamera } from 'lucide-react';
import { useEquipmentStore } from '../../store/equipmentStore';

/**
 * CameraCapture Component
 * 
 * Full-screen camera modal for capturing equipment images.
 * Features:
 * - Live camera feed
 * - Capture with flash animation
 * - Switch between front/back camera
 * - Preview captured image before confirming
 */

const CameraCapture = ({ isOpen, onClose }) => {
    const webcamRef = useRef(null);
    const [facingMode, setFacingMode] = useState('environment'); // 'user' or 'environment'
    const [capturedPreview, setCapturedPreview] = useState(null);
    const [showFlash, setShowFlash] = useState(false);
    const [isWebcamReady, setIsWebcamReady] = useState(false);

    const setCapturedImage = useEquipmentStore((state) => state.setCapturedImage);

    const videoConstraints = {
        width: 1280,
        height: 720,
        facingMode: facingMode
    };

    const handleWebcamReady = useCallback(() => {
        setIsWebcamReady(true);
    }, []);

    const capture = useCallback(() => {
        if (!webcamRef.current) {
            console.error('Webcam ref not available');
            return;
        }

        // Flash animation
        setShowFlash(true);
        setTimeout(() => setShowFlash(false), 200);

        const imageSrc = webcamRef.current.getScreenshot();
        if (imageSrc) {
            setCapturedPreview(imageSrc);
        } else {
            console.error('Failed to capture screenshot');
            alert('Could not capture photo. Please try again.');
        }
    }, []);

    const confirmCapture = () => {
        if (capturedPreview) {
            setCapturedImage(capturedPreview, 'camera');
            setCapturedPreview(null);
            onClose();
        }
    };

    const retake = () => {
        setCapturedPreview(null);
    };

    const switchCamera = () => {
        setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
    };

    const handleClose = () => {
        setCapturedPreview(null);
        setIsWebcamReady(false);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 bg-black"
            >
                {/* Flash Effect */}
                <AnimatePresence>
                    {showFlash && (
                        <motion.div
                            initial={{ opacity: 1 }}
                            animate={{ opacity: 0 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="absolute inset-0 bg-white z-20"
                        />
                    )}
                </AnimatePresence>

                {/* Close Button */}
                <button
                    onClick={handleClose}
                    className="absolute top-4 right-4 z-30 p-3 bg-black/50 hover:bg-black/70 rounded-full text-slate-900 dark:text-white transition-colors"
                >
                    <X size={24} />
                </button>

                {capturedPreview ? (
                    // Preview Mode
                    <div className="relative w-full h-full flex items-center justify-center">
                        <img
                            src={capturedPreview}
                            alt="Captured preview"
                            className="max-w-full max-h-full object-contain"
                        />

                        {/* Preview Controls */}
                        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-6">
                            <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={retake}
                                className="p-4 bg-red-500/80 hover:bg-red-500 rounded-full text-white shadow-lg"
                            >
                                <RotateCcw size={28} />
                            </motion.button>
                            <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={confirmCapture}
                                className="p-6 bg-organic-green hover:bg-organic-green-600 rounded-full text-white shadow-lg"
                            >
                                <Check size={32} />
                            </motion.button>
                        </div>

                        <p className="absolute bottom-32 left-1/2 -translate-x-1/2 text-slate-900 dark:text-white text-lg font-medium">
                            Use this photo?
                        </p>
                    </div>
                ) : (
                    // Camera Mode
                    <div className="relative w-full h-full">
                        <Webcam
                            ref={webcamRef}
                            audio={false}
                            screenshotFormat="image/jpeg"
                            videoConstraints={videoConstraints}
                            className="w-full h-full object-cover"
                            screenshotQuality={0.92}
                            onUserMedia={handleWebcamReady}
                            onUserMediaError={(err) => {
                                console.error('Webcam error:', err);
                                alert('Could not access camera. Please check permissions.');
                            }}
                        />

                        {/* Loading indicator */}
                        {!isWebcamReady && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black">
                                <div className="text-slate-900 dark:text-white text-center">
                                    <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4" />
                                    <p>Starting camera...</p>
                                </div>
                            </div>
                        )}

                        {/* Camera Guide Overlay */}
                        <div className="absolute inset-0 pointer-events-none">
                            <div className="absolute inset-8 border-2 border-white/30 rounded-lg">
                                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-organic-green rounded-tl-lg" />
                                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-organic-green rounded-tr-lg" />
                                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-organic-green rounded-bl-lg" />
                                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-organic-green rounded-br-lg" />
                            </div>
                        </div>

                        {/* Instructions */}
                        <div className="absolute top-8 left-1/2 -translate-x-1/2 text-center">
                            <p className="text-slate-900 dark:text-white text-lg font-medium bg-black/50 px-4 py-2 rounded-full">
                                Position the equipment in frame
                            </p>
                        </div>

                        {/* Camera Controls */}
                        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-6">
                            {/* Switch Camera */}
                            <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={switchCamera}
                                className="p-4 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full text-slate-900 dark:text-white transition-colors"
                            >
                                <SwitchCamera size={24} />
                            </motion.button>

                            {/* Capture Button */}
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={capture}
                                className="relative p-2 bg-white rounded-full shadow-lg"
                            >
                                <div className="w-16 h-16 bg-organic-green rounded-full flex items-center justify-center">
                                    <Camera size={28} className="text-slate-900 dark:text-white" />
                                </div>
                                <div className="absolute inset-0 border-4 border-white rounded-full" />
                            </motion.button>

                            {/* Placeholder for symmetry */}
                            <div className="w-14 h-14" />
                        </div>
                    </div>
                )}
            </motion.div>
        </AnimatePresence>
    );
};

export default CameraCapture;
