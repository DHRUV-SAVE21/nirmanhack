import { create } from 'zustand';
import { apiClient } from '../config/api';

/**
 * Equipment Analyzer Store
 * 
 * Manages state for the equipment analysis multi-agent system including:
 * - Captured/uploaded images
 * - Analysis results
 * - Maintenance schedules
 * - Repair recommendations
 * - Price comparisons
 * - Subsidy information
 */

export const useEquipmentStore = create((set, get) => ({
    // Image state
    capturedImage: null,
    imageSource: null, // 'camera' or 'upload'

    // Analysis state
    analysisResult: null,
    isAnalyzing: false,
    analysisError: null,

    // Maintenance schedule
    maintenanceSchedule: [],

    // Repair recommendations
    repairRecommendations: [],

    // Damaged parts
    damagedParts: [],

    // Subsidies
    subsidies: null,

    // Analysis history
    analysisHistory: [],

    // Marketplace recommendations
    marketplaceRecommendations: [],

    // Actions
    setCapturedImage: (image, source) => set({
        capturedImage: image,
        imageSource: source,
        // Reset previous analysis when new image is set
        analysisResult: null,
        analysisError: null,
        maintenanceSchedule: [],
        repairRecommendations: [],
        damagedParts: [],
        subsidies: null,
        marketplaceRecommendations: []
    }),

    clearImage: () => set({
        capturedImage: null,
        imageSource: null,
        analysisResult: null,
        analysisError: null,
        maintenanceSchedule: [],
        repairRecommendations: [],
        damagedParts: [],
        subsidies: null,
        marketplaceRecommendations: []
    }),

    // Full analysis (all agents)
    analyzeEquipment: async (metadata = {}) => {
        const { capturedImage } = get();
        if (!capturedImage) return;

        set({ isAnalyzing: true, analysisError: null });

        try {
            const response = await apiClient.post('/api/equipment/full-analysis', {
                image_base64: capturedImage,
                equipment_type: metadata.equipmentType || "Unknown",
                equipment_age_days: metadata.ageDays || 0,
                total_usage_hours: metadata.usageHours || 0,
                last_service_date: metadata.lastServiceDate || "Unknown",
                environment: metadata.environment || "normal",
                repair_cost_estimate: metadata.repairCost || null,
                replacement_cost_estimate: metadata.replacementCost || null
            });

            const result = response.data;

            if (result.success) {
                const data = result.data;
                set({
                    analysisResult: data.analysis,
                    maintenanceSchedule: data.maintenance_schedule || [],
                    repairRecommendations: data.repair_recommendations || [],
                    damagedParts: data.damaged_parts || [],
                    subsidies: data.subsidies,
                    marketplaceRecommendations: data.marketplace_recommendations || [],
                    isAnalyzing: false
                });

                // Add to history
                const { analysisHistory } = get();
                set({
                    analysisHistory: [data.analysis, ...analysisHistory].slice(0, 20)
                });
            } else {
                throw new Error(result.error || 'Analysis failed');
            }
        } catch (error) {
            set({
                analysisError: error.message || 'Failed to analyze equipment',
                isAnalyzing: false
            });
        }
    },

    // Quick analysis (only equipment identification)
    analyzeEquipmentQuick: async () => {
        const { capturedImage } = get();
        if (!capturedImage) return;

        set({ isAnalyzing: true, analysisError: null });

        try {
            const response = await apiClient.post('/api/equipment/analyze', {
                image_base64: capturedImage
            });

            const result = response.data;

            if (result.success) {
                set({
                    analysisResult: result.data,
                    isAnalyzing: false
                });
            } else {
                throw new Error(result.error || 'Analysis failed');
            }
        } catch (error) {
            set({
                analysisError: error.message || 'Failed to analyze equipment',
                isAnalyzing: false
            });
        }
    },

    // Generate schedule from existing analysis
    generateSchedule: async () => {
        const { analysisResult } = get();
        if (!analysisResult) return;

        try {
            const response = await apiClient.post('/api/equipment/schedule/from-analysis', analysisResult);
            const result = response.data;

            if (result.success) {
                set({ maintenanceSchedule: result.data });
            }
        } catch (error) {
            console.error('Failed to generate schedule:', error);
        }
    },

    // Get repair recommendations
    getRecommendations: async () => {
        const { analysisResult } = get();
        if (!analysisResult) return;

        try {
            const response = await apiClient.post('/api/equipment/recommendations', analysisResult);
            const result = response.data;

            if (result.success) {
                set({ repairRecommendations: result.data });
            }
        } catch (error) {
            console.error('Failed to get recommendations:', error);
        }
    },

    // Nearby shops
    nearbyShops: [],
    isShopsLoading: false,

    // ... (other state)

    // Find nearby shops using Overpass API (OpenStreetMap)
    findNearbyShops: async (lat, lng, partName) => {
        set({ isShopsLoading: true });

        const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';
        const SEARCH_RADIUS = 10000; // 10km in meters

        // Overpass QL query for agricultural/hardware/farm shops
        const query = `
            [out:json][timeout:25];
            (
                node["shop"~"agrarian|hardware|farm|doityourself"](around:${SEARCH_RADIUS},${lat},${lng});
                way["shop"~"agrarian|hardware|farm|doityourself"](around:${SEARCH_RADIUS},${lat},${lng});
                node["craft"="agricultural_engines"](around:${SEARCH_RADIUS},${lat},${lng});
                node["amenity"="marketplace"](around:${SEARCH_RADIUS},${lat},${lng});
            );
            out center;
        `;

        // Calculate distance between two coordinates (Haversine formula)
        const calculateDistance = (lat1, lon1, lat2, lon2) => {
            const R = 6371; // Earth's radius in km
            const dLat = (lat2 - lat1) * Math.PI / 180;
            const dLon = (lon2 - lon1) * Math.PI / 180;
            const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            return R * c;
        };

        // Estimate price based on shop type
        const estimatePrice = (tags) => {
            const shopType = tags?.shop || tags?.craft || tags?.amenity || '';
            const basePrice = {
                'agrarian': 600,
                'farm': 550,
                'hardware': 700,
                'doityourself': 650,
                'agricultural_engines': 800,
                'marketplace': 500
            };
            const base = basePrice[shopType] || 600;
            // Add some variation
            return base + Math.floor(Math.random() * 300);
        };

        try {
            const response = await fetch(OVERPASS_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: `data=${encodeURIComponent(query)}`
            });

            if (!response.ok) {
                throw new Error('Overpass API request failed');
            }

            const data = await response.json();
            const elements = data.elements || [];

            // Transform OSM data to shop format
            const shops = elements.map(element => {
                const shopLat = element.lat || element.center?.lat;
                const shopLng = element.lon || element.center?.lon;
                const tags = element.tags || {};

                if (!shopLat || !shopLng) return null;

                const distance = calculateDistance(lat, lng, shopLat, shopLng);
                const shopType = tags.shop || tags.craft || tags.amenity || 'shop';

                // Generate name - use OSM name or create from shop type
                const name = tags.name ||
                    `${shopType.charAt(0).toUpperCase() + shopType.slice(1)} Shop`;

                // Build address from OSM tags
                const addressParts = [];
                if (tags['addr:street']) addressParts.push(tags['addr:street']);
                if (tags['addr:city']) addressParts.push(tags['addr:city']);
                if (tags['addr:district']) addressParts.push(tags['addr:district']);
                const address = addressParts.length > 0
                    ? addressParts.join(', ')
                    : 'Address not available';

                return {
                    name,
                    address,
                    lat: shopLat,
                    lng: shopLng,
                    price: estimatePrice(tags),
                    partAvailable: partName,
                    distance: distance < 1
                        ? `${Math.round(distance * 1000)} m`
                        : `${distance.toFixed(1)} km`,
                    distanceValue: distance, // For sorting
                    shopType
                };
            }).filter(Boolean); // Remove null entries

            // Sort by distance
            shops.sort((a, b) => a.distanceValue - b.distanceValue);

            set({
                nearbyShops: shops,
                isShopsLoading: false
            });
            return shops;

        } catch (error) {
            console.error('Failed to fetch shops from Overpass API:', error);
            set({
                nearbyShops: [],
                isShopsLoading: false
            });
            return [];
        }
    },

    // Get subsidies
    getSubsidies: async (equipmentType = null, state = null) => {
        try {
            const response = await apiClient.post('/api/subsidies', {
                equipment_type: equipmentType,
                state: state
            });

            const result = response.data;

            if (result.success) {
                set({ subsidies: result.data });
                return result.data;
            }
        } catch (error) {
            console.error('Failed to get subsidies:', error);
        }
        return null;
    },

    // Load analysis history from server
    loadHistory: async () => {
        try {
            const response = await apiClient.get('/api/equipment/history');
            const result = response.data;

            if (result.success) {
                set({ analysisHistory: result.data });
            }
        } catch (error) {
            console.error('Failed to load history:', error);
        }
    },

    // Clear all state
    reset: () => set({
        capturedImage: null,
        imageSource: null,
        analysisResult: null,
        isAnalyzing: false,
        analysisError: null,
        maintenanceSchedule: [],
        repairRecommendations: [],
        damagedParts: [],
        subsidies: null
    })
}));
