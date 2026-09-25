// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

// Create axios instance with default configuration
import axios from 'axios';

export const apiClient = axios.create({
    baseURL: API_BASE_URL,
    timeout: 120000, // 120 seconds (increased for AI analysis)
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
    withCredentials: true, // Enable CORS credentials
});

// Request interceptor
apiClient.interceptors.request.use(
    (config) => {
        // Add any auth tokens here if needed
        // const token = localStorage.getItem('authToken');
        // if (token) {
        //     config.headers.Authorization = `Bearer ${token}`;
        // }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor
apiClient.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        // Handle common errors
        if (error.response?.status === 401) {
            // Handle unauthorized access
            console.warn('Unauthorized access - redirecting to login');
        } else if (error.response?.status >= 500) {
            // Handle server errors
            console.error('Server error:', error.response?.data?.detail || error.message);
        } else if (error.code === 'NETWORK_ERROR' || !error.response) {
            // Handle network errors
            console.error('Network error - check if backend is running');
        }

        return Promise.reject(error);
    }
);

// Helper function for backward compatibility
export const getApiUrl = (endpoint = '') => {
    return `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;
};

// Helper function to get frontend URL
export const getFrontendUrl = (path = '') => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://localhost:5173';
    return `${baseUrl}${path.startsWith('/') ? path : '/' + path}`;
};

export { API_BASE_URL };
export default apiClient;