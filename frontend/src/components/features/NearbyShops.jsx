import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from 'react-leaflet';
import { motion } from 'framer-motion';
import { MapPin, Navigation, Store, ExternalLink } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon in React Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Component to recenter map when position changes
const RecenterMap = ({ center }) => {
    const map = useMap();
    useEffect(() => {
        map.setView(center);
    }, [center, map]);
    return null;
};

const NearbyShops = ({ shops = [], isLoading = false, userLocation }) => {
    if (isLoading) {
        return (
            <div className="glass-panel p-6 rounded-2xl animate-pulse">
                <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-1/2 mb-6" />
                <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-xl" />
            </div>
        );
    }

    if (!shops || shops.length === 0) {
        return (
            <div className="glass-panel p-6 rounded-2xl text-center">
                <Store size={48} className="mx-auto text-slate-600 dark:text-gray-400 mb-4" />
                <p className="text-slate-500 dark:text-gray-500 dark:text-gray-400">
                    No nearby shops found
                </p>
                <p className="text-sm text-slate-600 dark:text-gray-400 dark:text-gray-500 mt-2">
                    Could not locate any shops with the required parts nearby.
                </p>
            </div>
        );
    }

    const defaultCenter = userLocation || [20.5937, 78.9629]; // Default to India center if no location

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-panel p-6 rounded-2xl"
        >
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                    <MapPin size={24} className="text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-gray-800 dark:text-white">
                        Nearby Repair Shops
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-gray-500 dark:text-gray-400">
                        Find parts at local stores near you
                    </p>
                </div>
            </div>

            <div className="h-[400px] w-full rounded-xl overflow-hidden shadow-inner border border-gray-200 dark:border-gray-700 relative z-0">
                <MapContainer
                    center={defaultCenter}
                    zoom={13}
                    style={{ height: '100%', width: '100%' }}
                    scrollWheelZoom={false}
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    {userLocation && (
                        <Circle center={userLocation} pathOptions={{ fillColor: 'blue' }} radius={200} />
                    )}

                    <RecenterMap center={defaultCenter} />

                    {shops.map((shop, index) => (
                        <Marker key={index} position={[shop.lat, shop.lng]}>
                            <Popup>
                                <div className="p-1 min-w-[200px]">
                                    <h4 className="font-bold text-gray-900">{shop.name}</h4>
                                    <div className="flex items-center gap-1 text-sm text-gray-600 mt-1">
                                        <Store size={14} />
                                        <span>{shop.address}</span>
                                    </div>
                                    <div className="mt-2 pt-2 border-t border-gray-200">
                                        <p className="text-sm font-semibold text-organic-green">
                                            {shop.partAvailable}: ₹{shop.price}
                                        </p>
                                        <p className="text-xs text-slate-500 dark:text-gray-500">Est. Cost</p>
                                    </div>
                                    <a
                                        href={`https://www.google.com/maps/dir/?api=1&destination=${shop.lat},${shop.lng}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="mt-2 flex items-center justify-center gap-1 w-full py-1 bg-blue-500 text-white text-xs font-bold rounded hover:bg-blue-600 transition-colors"
                                    >
                                        <Navigation size={12} />
                                        Get Directions
                                    </a>
                                </div>
                            </Popup>
                        </Marker>
                    ))}
                </MapContainer>
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {shops.slice(0, 4).map((shop, i) => (
                    <div key={i} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-700">
                        <div>
                            <h5 className="font-semibold text-sm text-gray-800 dark:text-gray-200">{shop.name}</h5>
                            <p className="text-xs text-slate-500 dark:text-gray-500">{shop.distance} from you</p>
                        </div>
                        <div className="text-right">
                            <div className="font-bold text-organic-green text-sm">₹{shop.price}</div>
                            <a
                                href={`https://www.google.com/maps/dir/?api=1&destination=${shop.lat},${shop.lng}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-blue-500 hover:underline flex items-center justify-end gap-1 mt-1"
                            >
                                Map <ExternalLink size={10} />
                            </a>
                        </div>
                    </div>
                ))}
            </div>
        </motion.div>
    );
};

export default NearbyShops;
