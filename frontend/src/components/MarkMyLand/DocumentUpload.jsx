import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

const DocumentUpload = ({ landId, onUploadComplete }) => {
    const { t } = useTranslation();
    const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);

    const handleFileChange = (e) => {
        if (e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleUpload = async () => {
        if (!file || !landId) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            // Updated URL to match the backend router prefix
            const response = await fetch(`${apiBase}/api/feature1/document/upload?land_id=${landId}`, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) throw new Error('Upload failed');

            const data = await response.json();
            onUploadComplete(data); // Backend now returns the single object directly
        } catch (error) {
            console.error(error);
            alert(t('error_uploading'));
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="p-4 border rounded-lg bg-gray-800">
            <h3 className="text-lg font-bold mb-2">{t('upload_land_document')}</h3>
            <input
                type="file"
                onChange={handleFileChange}
                className="block w-full text-sm text-slate-600 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100 mb-4"
            />
            <button
                onClick={handleUpload}
                disabled={!file || uploading || !landId}
                className="bg-purple-600 hover:bg-purple-700 text-slate-900 dark:text-white font-bold py-2 px-4 rounded disabled:opacity-50"
            >
                {uploading ? t('uploading') : t('upload_verify')}
            </button>
        </div>
    );
};

export default DocumentUpload;
