// Environment-aware API Base URL
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

/**
 * Fetch market prices for specific crops via our backend proxy to bypass CORS
 * @param {string} state - State name (optional)
 * @param {string} district - District name (optional)
 * @returns {Promise<Array>} List of market prices
 */
export const fetchMarketPrices = async (state = '', district = '') => {
    try {
        const params = new URLSearchParams();
        if (state) params.append('state', state);
        if (district) params.append('district', district);

        // Call our own backend instead of government API directly (fixed CORS)
        const response = await fetch(`${API_BASE}/api/mandi/prices?${params.toString()}`);
        const data = await response.json();

        if (data.success && data.data) {
            return data.data;
        }
        return [];
    } catch (error) {
        console.error("Failed to fetch market prices through backend proxy:", error);
        return [];
    }
};

/**
 * Get the latest price for a specific crop
 * @param {Array} marketData - The data returned from fetchMarketPrices
 * @param {string} cropName - The name of the crop to find
 * @returns {Object|null} - The price record or null
 */
export const getCropPrice = (marketData, cropName) => {
    if (!marketData || !cropName) return null;
    
    // Fuzzy search or direct match
    const record = marketData.find(item => 
        item.commodity.toLowerCase().includes(cropName.toLowerCase()) ||
        cropName.toLowerCase().includes(item.commodity.toLowerCase())
    );

    return record ? {
        price: record.modal_price,
        market: record.market,
        date: record.arrival_date,
        state: record.state,
        district: record.district
    } : null;
};
