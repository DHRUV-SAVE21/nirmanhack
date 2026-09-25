import React, { useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import AuthIdle from "../assets/images/auth-idle.svg";
import AuthFace from "../assets/images/auth-face.svg";
import { ShieldCheck, Upload, Camera, CheckCircle, XCircle, Loader2, ArrowLeft, Scan } from "lucide-react";

/**
 * Face Authentication Page — Fully Client-Side
 * No backend needed! Everything runs in the browser:
 *   1. Upload your photo (stored as base64 in memory)
 *   2. face-api.js models load from /public/models
 *   3. Webcam scans your face and matches against the uploaded photo
 *   4. On success → saved to localStorage → navigate to dashboard
 */
function FaceAuth() {
    // --- State ---
    const [step, setStep] = useState("upload"); // 'upload' | 'scanning' | 'success' | 'failed'
    const [tempAccount, setTempAccount] = useState(null);
    const [localUserStream, setLocalUserStream] = useState(null);
    const [modelsLoaded, setModelsLoaded] = useState(false);
    const [faceApiLoaded, setFaceApiLoaded] = useState(false);
    const [loginResult, setLoginResult] = useState("PENDING"); // PENDING | SUCCESS | FAILED
    const [counter, setCounter] = useState(5);
    const [labeledFaceDescriptors, setLabeledFaceDescriptors] = useState(null);
    const [imageError, setImageError] = useState(false);
    const [uploadName, setUploadName] = useState("");
    const [role, setRole] = useState("farmer"); // Default role
    const [uploadPreview, setUploadPreview] = useState(null);
    const [uploadFile, setUploadFile] = useState(null);
    const [uploadLoading, setUploadLoading] = useState(false);
    const [uploadError, setUploadError] = useState(null);

    const videoRef = useRef();
    const canvasRef = useRef();
    const faceApiIntervalRef = useRef();
    const videoWidth = 640;
    const videoHeight = 360;

    const navigate = useNavigate();

    // --- Load faceapi models from /public/models ---
    const loadModels = async () => {
        const uri = "/models";
        await faceapi.nets.ssdMobilenetv1.loadFromUri(uri);
        await faceapi.nets.faceLandmark68Net.loadFromUri(uri);
        await faceapi.nets.faceRecognitionNet.loadFromUri(uri);
    };

    // --- When account is set, load models + labeled images ---
    useEffect(() => {
        if (tempAccount) {
            setModelsLoaded(false);
            loadModels()
                .then(async () => {
                    const descriptors = await loadLabeledImages();
                    setLabeledFaceDescriptors(descriptors);
                })
                .then(() => setModelsLoaded(true))
                .catch(err => {
                    console.error("Model loading error:", err);
                    setImageError(true);
                });
        }
    }, [tempAccount]);

    // --- Countdown after success ---
    useEffect(() => {
        if (loginResult === "SUCCESS") {
            const counterInterval = setInterval(() => {
                setCounter((c) => c - 1);
            }, 1000);

            if (counter === 0) {
                // Stop camera
                if (videoRef.current) {
                    videoRef.current.pause();
                    videoRef.current.srcObject = null;
                }
                if (localUserStream) {
                    localUserStream.getTracks().forEach((track) => track.stop());
                }
                clearInterval(counterInterval);
                clearInterval(faceApiIntervalRef.current);

                // Save face auth data to localStorage (for navbar profile photo)
                const faceAuthData = {
                    status: true,
                    account: tempAccount,
                };
                localStorage.setItem("faceAuth", JSON.stringify(faceAuthData));

                // Also update the main 'user' in localStorage so navbar picks up the photo
                const existingUser = JSON.parse(localStorage.getItem("user") || "{}");
                const updatedUser = {
                    ...existingUser,
                    id: existingUser.id || tempAccount.id,
                    role: existingUser.role || tempAccount.role || 'farmer',
                    full_name: existingUser.full_name || tempAccount.fullName,
                    face_picture: tempAccount.picture, // base64 data URL
                    face_auth: true,
                };
                localStorage.setItem("user", JSON.stringify(updatedUser));

                setStep("success");
                // Navigate to dashboard after a brief success display
                setTimeout(() => navigate("/dashboard", { replace: true }), 1200);
            }

            return () => clearInterval(counterInterval);
        }
        setCounter(5);
    }, [loginResult, counter]);

    // --- Camera access ---
    const getLocalUserVideo = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: true });
            videoRef.current.srcObject = stream;
            setLocalUserStream(stream);
        } catch (err) {
            console.error("Camera error:", err);
            setUploadError("Could not access camera. Check browser permissions.");
        }
    };

    // --- Face scanning ---
    const scanFace = async () => {
        if (!canvasRef.current || !videoRef.current) return;
        faceapi.matchDimensions(canvasRef.current, videoRef.current);

        const faceApiInterval = setInterval(async () => {
            try {
                const detections = await faceapi
                    .detectAllFaces(videoRef.current)
                    .withFaceLandmarks()
                    .withFaceDescriptors();

                const resizedDetections = faceapi.resizeResults(detections, {
                    width: videoWidth,
                    height: videoHeight,
                });

                if (!labeledFaceDescriptors) return;

                const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors);

                const results = resizedDetections.map((d) =>
                    faceMatcher.findBestMatch(d.descriptor)
                );

                if (!canvasRef.current) return;

                canvasRef.current.getContext("2d").clearRect(0, 0, videoWidth, videoHeight);
                faceapi.draw.drawDetections(canvasRef.current, resizedDetections);
                faceapi.draw.drawFaceLandmarks(canvasRef.current, resizedDetections);

                if (results.length > 0 && tempAccount.id === results[0].label) {
                    setLoginResult("SUCCESS");
                } else if (results.length > 0) {
                    setLoginResult("FAILED");
                }

                if (!faceApiLoaded) {
                    setFaceApiLoaded(true);
                }
            } catch (err) {
                // Canvas or video might not be ready yet
            }
        }, 1000 / 15);

        faceApiIntervalRef.current = faceApiInterval;
    };

    // --- Load labeled images for recognition (uses base64 from memory) ---
    async function loadLabeledImages() {
        if (!tempAccount) return null;
        const descriptions = [];

        try {
            // tempAccount.picture is a base64 data URL from the uploaded file
            const img = await faceapi.fetchImage(tempAccount.picture);
            const detections = await faceapi
                .detectSingleFace(img)
                .withFaceLandmarks()
                .withFaceDescriptor();

            if (detections) {
                descriptions.push(detections.descriptor);
            } else {
                // No face found in the uploaded photo
                setImageError(true);
                return null;
            }
        } catch (err) {
            console.error("Image loading error:", err);
            setImageError(true);
            return null;
        }

        return new faceapi.LabeledFaceDescriptors(tempAccount.id, descriptions);
    }

    // --- Handle photo upload ---
    const handleFileUpload = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const validTypes = ["image/png", "image/jpeg", "image/jpg"];
        if (!validTypes.includes(file.type)) {
            setUploadError("Only PNG, JPG, or JPEG images are supported.");
            return;
        }

        setUploadError(null);
        setUploadFile(file);

        // Preview as base64
        const reader = new FileReader();
        reader.onload = (ev) => setUploadPreview(ev.target.result);
        reader.readAsDataURL(file);
    };

    // --- Submit photo — fully local, no backend needed ---
    const handleSubmitPhoto = () => {
        if (!uploadFile || !uploadName.trim()) {
            setUploadError("Please enter your name and upload a photo.");
            return;
        }

        if (!uploadPreview) {
            setUploadError("Photo not loaded yet, please wait.");
            return;
        }

        setUploadLoading(true);
        setUploadError(null);

        // Generate a local unique ID (no backend call needed)
        const localId = crypto.randomUUID ? crypto.randomUUID() : `user-${Date.now()}`;

        const user = {
            id: localId,
            fullName: uploadName.trim(),
            role: role, // Use selected role
            type: "LOCAL",
            picture: uploadPreview, // base64 data URL — stays entirely in browser
        };

        setTempAccount(user);
        setStep("scanning");
        setUploadLoading(false);
    };

    // --- Cleanup on unmount ---
    useEffect(() => {
        return () => {
            if (faceApiIntervalRef.current) clearInterval(faceApiIntervalRef.current);
            if (localUserStream) {
                localUserStream.getTracks().forEach((track) => track.stop());
            }
        };
    }, [localUserStream]);

    // ========== RENDER ==========

    // Error state
    if (imageError) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-8 bg-gradient-to-br from-slate-100 via-slate-50 to-white dark:from-slate-900 dark:via-[#0a0f1c] dark:to-black text-slate-900 dark:text-white">
                <XCircle size={64} className="text-red-500" />
                <h2 className="text-2xl font-bold text-center text-red-500 dark:text-red-400">
                    No face detected in the uploaded photo
                </h2>
                <p className="text-slate-500 dark:text-slate-400 text-center max-w-md">
                    Please make sure your photo has a clear, front-facing face and try again.
                </p>
                <button
                    onClick={() => {
                        setImageError(false);
                        setTempAccount(null);
                        setStep("upload");
                        setUploadPreview(null);
                        setUploadFile(null);
                    }}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl text-white font-bold transition-all"
                >
                    Try Again
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-100 via-slate-50 to-white dark:from-slate-900 dark:via-[#0a0f1c] dark:to-black text-slate-900 dark:text-white relative overflow-hidden">
            {/* Background decorations */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px]" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-lg bg-white dark:bg-white/5 backdrop-blur-xl rounded-3xl border border-slate-200 dark:border-white/10 shadow-xl dark:shadow-2xl relative z-10 overflow-hidden"
            >
                {/* Header */}
                <div className="p-6 text-center border-b border-slate-200 dark:border-white/5">
                    <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center border border-emerald-500/20 mx-auto mb-4">
                        <ShieldCheck className="text-emerald-500" size={32} />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                        {step === "upload" && "Face Authentication"}
                        {step === "scanning" && (loginResult === "SUCCESS" ? "Face Recognized!" : loginResult === "FAILED" ? "Face Not Recognized" : "Scanning Face...")}
                        {step === "success" && "Login Successful!"}
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                        {step === "upload" && "Upload your photo to get started"}
                        {step === "scanning" && !localUserStream && !modelsLoaded && "Loading AI models..."}
                        {step === "scanning" && !localUserStream && modelsLoaded && "Click to start camera scanning"}
                        {step === "scanning" && localUserStream && loginResult === "SUCCESS" && `Hold still ${counter} more seconds...`}
                        {step === "scanning" && localUserStream && loginResult === "FAILED" && "Move your face to the camera frame"}
                        {step === "scanning" && localUserStream && loginResult === "PENDING" && "Detecting your face..."}
                        {step === "success" && "Redirecting to dashboard..."}
                    </p>
                </div>

                <AnimatePresence mode="wait">
                    {/* ========== STEP 1: UPLOAD PHOTO ========== */}
                    {step === "upload" && (
                        <motion.div
                            key="upload"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="p-6 space-y-5"
                        >
                            {/* Name input */}
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Your Full Name</label>
                                <input
                                    type="text"
                                    placeholder="Enter your name..."
                                    value={uploadName}
                                    onChange={(e) => setUploadName(e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3.5 text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none transition-colors placeholder:text-slate-400 dark:placeholder:text-slate-600"
                                />
                            </div>

                            {/* Role Selection */}
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">I am a</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => setRole('farmer')}
                                        className={`px-4 py-3 rounded-xl border font-semibold transition-all flex items-center justify-center gap-2 ${role === 'farmer'
                                            ? 'bg-emerald-50 dark:bg-emerald-500/20 border-emerald-500 text-emerald-700 dark:text-emerald-400'
                                            : 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600'
                                            }`}
                                    >
                                        🌱 Farmer
                                    </button>
                                    <button
                                        onClick={() => setRole('user')}
                                        className={`px-4 py-3 rounded-xl border font-semibold transition-all flex items-center justify-center gap-2 ${role === 'user'
                                            ? 'bg-blue-50 dark:bg-blue-500/20 border-blue-500 text-blue-700 dark:text-blue-400'
                                            : 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600'
                                            }`}
                                    >
                                        👤 User
                                    </button>
                                </div>
                            </div>

                            {/* Photo upload area */}
                            {!uploadPreview ? (
                                <label
                                    htmlFor="face-upload"
                                    className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl cursor-pointer hover:border-emerald-500/50 hover:bg-emerald-50 dark:hover:bg-emerald-500/5 transition-all group"
                                >
                                    <Upload size={32} className="text-slate-400 dark:text-slate-500 group-hover:text-emerald-500 dark:group-hover:text-emerald-400 transition-colors mb-3" />
                                    <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">Click to upload your photo</p>
                                    <p className="text-xs text-slate-400 dark:text-slate-600 mt-1">PNG, JPG or JPEG</p>
                                    <input
                                        id="face-upload"
                                        type="file"
                                        accept=".png,.jpg,.jpeg"
                                        className="hidden"
                                        onChange={handleFileUpload}
                                    />
                                </label>
                            ) : (
                                <div className="relative">
                                    <img
                                        src={uploadPreview}
                                        alt="Preview"
                                        className="w-full h-48 object-cover rounded-2xl border border-slate-200 dark:border-slate-700"
                                    />
                                    <button
                                        onClick={() => { setUploadPreview(null); setUploadFile(null); }}
                                        className="absolute top-2 right-2 p-1.5 bg-red-500/80 hover:bg-red-500 rounded-full text-white transition-colors"
                                    >
                                        <XCircle size={18} />
                                    </button>
                                </div>
                            )}

                            {uploadError && (
                                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm">
                                    {uploadError}
                                </div>
                            )}

                            {/* Submit button */}
                            <button
                                onClick={handleSubmitPhoto}
                                disabled={uploadLoading || !uploadFile || !uploadName.trim()}
                                className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition-all transform active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {uploadLoading ? (
                                    <Loader2 className="animate-spin" size={20} />
                                ) : (
                                    <>
                                        <Camera size={20} />
                                        Continue to Face Scan
                                    </>
                                )}
                            </button>

                            {/* Back to regular auth */}
                            <div className="text-center">
                                <button
                                    onClick={() => navigate("/auth")}
                                    className="text-xs text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-white underline flex items-center gap-1 mx-auto"
                                >
                                    <ArrowLeft size={12} /> Use email login instead
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* ========== STEP 2: FACE SCANNING ========== */}
                    {step === "scanning" && (
                        <motion.div
                            key="scanning"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="p-6"
                        >
                            {/* Video container */}
                            <div className="relative rounded-2xl overflow-hidden bg-slate-100 dark:bg-black mb-4">
                                <video
                                    muted
                                    autoPlay
                                    ref={videoRef}
                                    height={videoHeight}
                                    width={videoWidth}
                                    onPlay={scanFace}
                                    style={{
                                        objectFit: "cover",
                                        height: "280px",
                                        width: "100%",
                                        borderRadius: "16px",
                                        display: localUserStream ? "block" : "none",
                                    }}
                                />
                                <canvas
                                    ref={canvasRef}
                                    style={{
                                        position: "absolute",
                                        top: 0,
                                        left: 0,
                                        display: localUserStream ? "block" : "none",
                                    }}
                                />

                                {/* Status badge on video */}
                                {localUserStream && (
                                    <div className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-bold border backdrop-blur-md ${loginResult === "SUCCESS"
                                        ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                                        : loginResult === "FAILED"
                                            ? "bg-red-500/20 text-red-400 border-red-500/30"
                                            : "bg-blue-500/20 text-blue-400 border-blue-500/30 animate-pulse"
                                        }`}>
                                        {loginResult === "SUCCESS" ? "MATCH" : loginResult === "FAILED" ? "NO MATCH" : "SCANNING..."}
                                    </div>
                                )}

                                {/* Scanning border animation */}
                                {localUserStream && loginResult === "PENDING" && (
                                    <div className="absolute inset-0 border-2 border-emerald-500/40 rounded-2xl animate-pulse pointer-events-none" />
                                )}
                            </div>

                            {/* Show idle/face image when camera not started */}
                            {!localUserStream && (
                                <>
                                    {modelsLoaded ? (
                                        <>
                                            <img
                                                alt="Ready to scan"
                                                src={AuthFace}
                                                className="mx-auto object-cover h-[180px] mb-4 opacity-80"
                                            />
                                            <button
                                                onClick={getLocalUserVideo}
                                                className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
                                            >
                                                <Scan size={20} />
                                                Start Face Scan
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <img
                                                alt="Loading models"
                                                src={AuthIdle}
                                                className="mx-auto object-cover h-[180px] mb-4 opacity-60"
                                            />
                                            <button
                                                disabled
                                                className="w-full py-4 bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 font-medium rounded-xl cursor-not-allowed flex items-center justify-center gap-2"
                                            >
                                                <Loader2 className="animate-spin" size={18} />
                                                Loading AI models...
                                            </button>
                                        </>
                                    )}
                                </>
                            )}

                            {/* Success countdown */}
                            {loginResult === "SUCCESS" && (
                                <div className="mt-4 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-center">
                                    <CheckCircle size={32} className="text-emerald-500 dark:text-emerald-400 mx-auto mb-2" />
                                    <p className="text-emerald-700 dark:text-emerald-400 font-bold">Face Verified Successfully!</p>
                                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Redirecting in {counter}s...</p>
                                </div>
                            )}

                            {/* Failed notice */}
                            {localUserStream && loginResult === "FAILED" && (
                                <div className="mt-4 p-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-center">
                                    <p className="text-red-600 dark:text-red-400 text-sm font-medium">Face not recognized — keep your face in frame</p>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* ========== STEP 3: SUCCESS ========== */}
                    {step === "success" && (
                        <motion.div
                            key="success"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="p-8 text-center"
                        >
                            <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-200 dark:border-emerald-500/30">
                                <CheckCircle size={40} className="text-emerald-500 dark:text-emerald-400" />
                            </div>
                            {tempAccount && (
                                <img
                                    className="mx-auto mb-4 w-24 h-24 rounded-full object-cover border-4 border-emerald-200 dark:border-emerald-500/30 shadow-lg shadow-emerald-500/10"
                                    src={tempAccount.picture}
                                    alt={tempAccount.fullName}
                                />
                            )}
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">
                                Welcome, {tempAccount?.fullName}!
                            </h3>
                            <p className="text-slate-500 dark:text-slate-400 text-sm">Taking you to your dashboard...</p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
}

export default FaceAuth;
