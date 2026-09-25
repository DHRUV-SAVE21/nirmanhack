import React, { useCallback, useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, Image as ImageIcon, X, FileImage } from 'lucide-react';
import { useEquipmentStore } from '../../store/equipmentStore';

/**
 * ImageUploader Component
 * 
 * Drag-and-drop image upload with file picker fallback.
 * Features:
 * - Drag and drop zone
 * - File picker
 * - Image preview
 * - File type validation
 */

const ImageUploader = ({ className = '' }) => {
    const [isDragging, setIsDragging] = useState(false);
    const [error, setError] = useState(null);

    const capturedImage = useEquipmentStore((state) => state.capturedImage);
    const imageSource = useEquipmentStore((state) => state.imageSource);
    const setCapturedImage = useEquipmentStore((state) => state.setCapturedImage);
    const clearImage = useEquipmentStore((state) => state.clearImage);

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    const processFile = useCallback((file) => {
        setError(null);

        // Validate type
        if (!allowedTypes.includes(file.type)) {
            setError('Please upload a valid image (JPEG, PNG, or WebP)');
            return;
        }

        // Validate size
        if (file.size > maxSize) {
            setError('Image size should be less than 10MB');
            return;
        }

        // Read file as base64
        const reader = new FileReader();
        reader.onload = (e) => {
            setCapturedImage(e.target.result, 'upload');
        };
        reader.onerror = () => {
            setError('Failed to read the image file');
        };
        reader.readAsDataURL(file);
    }, [setCapturedImage]);

    const handleDragOver = useCallback((e) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        setIsDragging(false);

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            processFile(files[0]);
        }
    }, [processFile]);

    const handleFileSelect = useCallback((e) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            processFile(files[0]);
        }
    }, [processFile]);

    // If there's already a captured image from upload
    if (capturedImage && imageSource === 'upload') {
        return (
            <div className={`relative ${className}`}>
                <div className="relative rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-800">
                    <img
                        src={capturedImage}
                        alt="Uploaded equipment"
                        className="w-full h-64 object-cover"
                    />
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={clearImage}
                        className="absolute top-3 right-3 p-2 bg-red-500 hover:bg-red-600 rounded-full text-white shadow-lg transition-colors"
                    >
                        <X size={18} />
                    </motion.button>
                </div>
                <p className="mt-2 text-sm text-slate-500 dark:text-gray-500 dark:text-gray-400 text-center">
                    Image uploaded successfully
                </p>
            </div>
        );
    }

    return (
        <div className={className}>
            <motion.div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                animate={{
                    borderColor: isDragging ? '#22c55e' : 'rgba(156, 163, 175, 0.5)',
                    backgroundColor: isDragging ? 'rgba(34, 197, 94, 0.1)' : 'transparent'
                }}
                className={`
                    relative border-2 border-dashed rounded-2xl p-8
                    transition-all duration-200 cursor-pointer
                    hover:border-organic-green hover:bg-organic-green/5
                    ${isDragging ? 'border-organic-green bg-organic-green/10' : 'border-gray-400/50'}
                `}
            >
                <input
                    type="file"
                    accept={allowedTypes.join(',')}
                    onChange={handleFileSelect}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />

                <div className="flex flex-col items-center justify-center text-center">
                    <motion.div
                        animate={{
                            scale: isDragging ? 1.1 : 1,
                            y: isDragging ? -5 : 0
                        }}
                        className={`
                            p-4 rounded-full mb-4
                            ${isDragging
                                ? 'bg-organic-green text-white'
                                : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'}
                        `}
                    >
                        {isDragging ? (
                            <FileImage size={32} />
                        ) : (
                            <Upload size={32} />
                        )}
                    </motion.div>

                    <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-2">
                        {isDragging ? 'Drop your image here' : 'Upload Equipment Image'}
                    </h3>

                    <p className="text-sm text-slate-500 dark:text-gray-500 dark:text-gray-400 mb-4">
                        Drag and drop or click to select
                    </p>

                    <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-gray-400">
                        <ImageIcon size={14} />
                        <span>JPEG, PNG, WebP • Max 10MB</span>
                    </div>
                </div>
            </motion.div>

            {/* Error Message */}
            {error && (
                <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-3 text-sm text-red-500 text-center"
                >
                    {error}
                </motion.p>
            )}
        </div>
    );
};

export default ImageUploader;
