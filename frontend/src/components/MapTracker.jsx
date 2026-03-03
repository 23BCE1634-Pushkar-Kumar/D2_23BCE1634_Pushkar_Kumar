import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import { Navigation, MapPin, Clock, Gauge } from 'lucide-react';
import L from 'leaflet';
import api from '../utils/api';

// Fix default markers in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom truck icon
const truckIcon = L.divIcon({
    html: `<div style="background: #22c55e; border-radius: 50%; width: 20px; height: 20px; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
    className: 'custom-truck-marker',
    iconSize: [20, 20],
    iconAnchor: [10, 10]
});

const MapTracker = ({ truckId = 'truck001', showHistory = false, destination = null }) => {
    const [location, setLocation] = useState(null);
    const [history, setHistory] = useState([]);
    const [eta, setEta] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [lastUpdate, setLastUpdate] = useState(null);

    useEffect(() => {
        if (truckId) {
            fetchData();
            const interval = setInterval(fetchData, 5000); // Update every 5 seconds for real-time ESP32 data
            return () => clearInterval(interval);
        }
    }, [truckId]);

    const fetchData = async () => {
        try {
            console.log(`🔄 Fetching data for truck: ${truckId}`);

            // Fetch latest location
            const locationResponse = await api.getLatestLocation(truckId);
            console.log('📍 Location response:', locationResponse);

            if (locationResponse.success && locationResponse.location) {
                setLocation(locationResponse.location);
                setLastUpdate(new Date());
                setError(null);

                // Calculate ETA if destination is provided
                if (destination && destination.lat && destination.lon) {
                    try {
                        const etaResponse = await api.calculateETA(
                            truckId,
                            destination.lat,
                            destination.lon
                        );
                        if (etaResponse.success) {
                            setEta(etaResponse.eta);
                        }
                    } catch (etaError) {
                        console.warn('ETA calculation failed:', etaError);
                    }
                }
            } else {
                setError(`No GPS data available for ${truckId}`);
                setLocation(null);
            }

            // Fetch history if requested
            if (showHistory) {
                try {
                    const historyResponse = await api.getLocationHistory(truckId, 24);
                    if (historyResponse.success && historyResponse.history) {
                        setHistory(historyResponse.history);
                    }
                } catch (historyError) {
                    console.warn('History fetch failed:', historyError);
                }
            }

        } catch (err) {
            console.error('🚨 Tracking error:', err);
            setError(`Failed to load tracking data: ${err.message}`);
        } finally {
            setLoading(false);
        }
    } // <-- Add this closing brace for fetchData

    const formatTimestamp = (timestamp) => {
        return new Date(timestamp).toLocaleTimeString();
    };

    const getStatusColor = (speed) => {
        if (speed > 30) return 'text-green-600';
        if (speed > 10) return 'text-yellow-600';
        return 'text-red-600';
    };

    if (loading) {
        return (
            <div className="card">
                <div className="flex items-center justify-center h-64">
                    <div className="loading-spinner"></div>
                </div>
            </div>
        );
    }

    if (error || !location) {
        return (
            <div className="card">
                <div className="flex items-center justify-center h-64 text-gray-500">
                    <div className="text-center">
                        <MapPin className="h-12 w-12 mx-auto mb-2" />
                        <p>{error || 'No tracking data available'}</p>
                    </div>
                </div>
            </div>
        );
    }

    const center = [location.lat, location.lon];
    const historyPath = history.map(point => [point.lat, point.lon]);

    return (
        <div className="card">
            <div className="card-header">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <Navigation className="h-5 w-5 mr-2" />
                    Live Tracking - Truck {truckId}
                </h3>
            </div>

            {/* Status Information */}
            <div className="mb-4 grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="flex items-center space-x-2">
                    <Gauge className={`h-4 w-4 ${getStatusColor(location.speedKmph)}`} />
                    <span className="text-sm">
                        <span className="font-medium">{location.speedKmph} km/h</span>
                        <span className="text-gray-500 block">Current Speed</span>
                    </span>
                </div>

                <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-blue-500" />
                    <span className="text-sm">
                        <span className="font-medium">{formatTimestamp(location.timestamp)}</span>
                        <span className="text-gray-500 block">Last Update</span>
                    </span>
                </div>

                {eta && (
                    <div className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4 text-purple-500" />
                        <span className="text-sm">
                            <span className="font-medium">{eta.minutes} min</span>
                            <span className="text-gray-500 block">ETA</span>
                        </span>
                    </div>
                )}

                <div className="flex items-center space-x-2">
                    <Navigation className="h-4 w-4 text-orange-500" />
                    <span className="text-sm">
                        <span className="font-medium">{location.heading}°</span>
                        <span className="text-gray-500 block">Heading</span>
                    </span>
                </div>
            </div>

            {/* Map */}
            <div style={{ height: '400px', width: '100%' }}>
                <MapContainer
                    center={center}
                    zoom={13}
                    style={{ height: '100%', width: '100%' }}
                    className="rounded-lg"
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    {/* Current location marker */}
                    <Marker position={center} icon={truckIcon}>
                        <Popup>
                            <div className="text-sm">
                                <p><strong>Truck {truckId}</strong></p>
                                <p>Speed: {location.speedKmph} km/h</p>
                                <p>Heading: {location.heading}°</p>
                                <p>Last seen: {formatTimestamp(location.timestamp)}</p>
                                {location.engineTemp && (
                                    <p>Engine Temp: {location.engineTemp}°C</p>
                                )}
                                {location.fuelLevel && (
                                    <p>Fuel: {location.fuelLevel}%</p>
                                )}
                            </div>
                        </Popup>
                    </Marker>

                    {/* Destination marker */}
                    {destination && (
                        <Marker position={[destination.lat, destination.lon]}>
                            <Popup>
                                <div className="text-sm">
                                    <p><strong>Destination</strong></p>
                                    <p>{destination.address || 'Delivery Location'}</p>
                                    {eta && <p>ETA: {eta.minutes} minutes</p>}
                                </div>
                            </Popup>
                        </Marker>
                    )}

                    {/* History path */}
                    {showHistory && historyPath.length > 1 && (
                        <Polyline
                            positions={historyPath}
                            color="#3b82f6"
                            weight={3}
                            opacity={0.7}
                            dashArray="5, 5"
                        />
                    )}
                </MapContainer>
            </div>

            {/* Telemetry Data */}
            {(location.engineTemp || location.fuelLevel || location.batteryVoltage) && (
                <div className="mt-4 bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">Telemetry Data</h4>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                        {location.engineTemp && (
                            <div>
                                <p className="text-gray-500">Engine Temp</p>
                                <p className="font-medium">{location.engineTemp}°C</p>
                            </div>
                        )}
                        {location.fuelLevel && (
                            <div>
                                <p className="text-gray-500">Fuel Level</p>
                                <p className="font-medium">{location.fuelLevel}%</p>
                            </div>
                        )}
                        {location.batteryVoltage && (
                            <div>
                                <p className="text-gray-500">Battery</p>
                                <p className="font-medium">{location.batteryVoltage}V</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Coordinates for debugging */}
            <div className="mt-2 text-xs text-gray-400">
                Coordinates: {location.lat?.toFixed(6)}, {location.lon?.toFixed(6)}
                {lastUpdate && (
                    <span className="ml-4">
                        Last Update: {lastUpdate.toLocaleTimeString()}
                    </span>
                )}
                {location.brakingEvent && (
                    <span className="ml-4 text-red-500 font-bold">
                        🚨 BRAKING EVENT
                    </span>
                )}
            </div>
        </div>
    );
};

export default MapTracker;