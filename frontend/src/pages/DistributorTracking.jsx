import React, { useState, useEffect } from 'react';
import { Truck, LogOut, Settings, Bell, MapPin } from 'lucide-react';
import MapTracker from '../components/MapTracker';
import api from '../utils/api';

const DistributorTracking = ({ user, onLogout }) => {
    const [activeTrucks, setActiveTrucks] = useState([]);
    const [selectedTruck, setSelectedTruck] = useState('truck001');
    const [shipments, setShipments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchActiveTrucks();
        fetchShipments();

        // Auto-refresh every 30 seconds
        const interval = setInterval(() => {
            fetchActiveTrucks();
        }, 30000);

        return () => clearInterval(interval);
    }, []);

    const fetchActiveTrucks = async () => {
        try {
            const response = await api.getActiveTrucks();
            setActiveTrucks(response.trucks || []);
        } catch (error) {
            console.error('Error fetching active trucks:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchShipments = async () => {
        try {
            const response = await api.getMyShipments();
            setShipments(response.shipments || []);
        } catch (error) {
            console.error('Error fetching shipments:', error);
        }
    };

    const updateShipmentStatus = async (shipmentId, status, note = '') => {
        try {
            await api.updateShipmentStatus(shipmentId, status, note);
            fetchShipments();
            alert(`Shipment status updated to ${status}`);
        } catch (error) {
            console.error('Error updating shipment status:', error);
            alert('Failed to update shipment status');
        }
    };

    const formatTimestamp = (timestamp) => {
        return new Date(timestamp).toLocaleString();
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'pending': return 'status-pending';
            case 'picked_up': return 'status-in-transit';
            case 'in_transit': return 'status-in-transit';
            case 'delivered': return 'status-delivered';
            default: return 'status-pending';
        }
    };

    const getNextStatus = (currentStatus) => {
        switch (currentStatus) {
            case 'pending': return 'picked_up';
            case 'picked_up': return 'in_transit';
            case 'in_transit': return 'delivered';
            default: return null;
        }
    };

    const getNextStatusLabel = (currentStatus) => {
        switch (currentStatus) {
            case 'pending': return 'Mark as Picked Up';
            case 'picked_up': return 'Mark as In Transit';
            case 'in_transit': return 'Mark as Delivered';
            default: return null;
        }
    };

    // Mock telemetry data for demonstration
    const generateMockTelemetry = () => {
        return {
            engineTemp: Math.floor(Math.random() * 20) + 70, // 70-90°C
            fuelLevel: Math.floor(Math.random() * 50) + 30,  // 30-80%
            batteryVoltage: (Math.random() * 2 + 12).toFixed(1), // 12-14V
            avgSpeed: Math.floor(Math.random() * 30) + 40,   // 40-70 km/h
            totalDistance: Math.floor(Math.random() * 200) + 100 // 100-300 km
        };
    };

    const telemetryData = generateMockTelemetry();

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center">
                            <Truck className="h-8 w-8 text-orange-600 mr-3" />
                            <div>
                                <h1 className="text-xl font-semibold text-gray-900">Distributor Tracking</h1>
                                <p className="text-sm text-gray-600">Welcome, {user.name}</p>
                            </div>
                        </div>

                        <div className="flex items-center space-x-4">
                            <button className="p-2 text-gray-400 hover:text-gray-600">
                                <Bell className="h-5 w-5" />
                            </button>
                            <button className="p-2 text-gray-400 hover:text-gray-600" onClick={() => (window.location.href = '/settings')}>
                                <Settings className="h-5 w-5" />
                            </button>
                            <button
                                onClick={onLogout}
                                className="flex items-center text-gray-600 hover:text-gray-800"
                            >
                                <LogOut className="h-4 w-4 mr-2" />
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column - Fleet Overview */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* Fleet Status */}
                        <div className="card">
                            <div className="card-header">
                                <h3 className="text-lg font-semibold text-gray-900">Fleet Status</h3>
                            </div>

                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="text-center">
                                        <p className="text-2xl font-bold text-green-600">
                                            {activeTrucks.length}
                                        </p>
                                        <p className="text-sm text-gray-600">Active Trucks</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-2xl font-bold text-blue-600">
                                            {shipments.filter(s => s.status === 'in_transit').length}
                                        </p>
                                        <p className="text-sm text-gray-600">In Transit</p>
                                    </div>
                                </div>

                                {/* Truck Selection */}
                                <div>
                                    <label className="form-label">Select Truck to Track</label>
                                    <select
                                        value={selectedTruck}
                                        onChange={(e) => setSelectedTruck(e.target.value)}
                                        className="form-input"
                                    >
                                        <option value="truck001">Truck 001</option>
                                        <option value="truck002">Truck 002</option>
                                        <option value="truck003">Truck 003</option>
                                    </select>
                                </div>

                                {/* Telemetry Data */}
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <h4 className="font-medium text-gray-900 mb-3">Telemetry - {selectedTruck}</h4>
                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                        <div>
                                            <p className="text-gray-500">Engine Temp</p>
                                            <p className="font-medium">{telemetryData.engineTemp}°C</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-500">Fuel Level</p>
                                            <p className="font-medium">{telemetryData.fuelLevel}%</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-500">Battery</p>
                                            <p className="font-medium">{telemetryData.batteryVoltage}V</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-500">Avg Speed</p>
                                            <p className="font-medium">{telemetryData.avgSpeed} km/h</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Shipment Management */}
                        <div className="card">
                            <div className="card-header">
                                <h3 className="text-lg font-semibold text-gray-900">Active Shipments</h3>
                            </div>

                            <div className="space-y-3 max-h-96 overflow-y-auto">
                                {shipments.filter(s => s.status !== 'delivered').map((shipment) => (
                                    <div key={shipment._id} className="border border-gray-200 rounded-lg p-3">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <p className="font-medium text-sm">Shipment #{shipment._id.slice(-6)}</p>
                                                <p className="text-xs text-gray-600">Truck: {shipment.truckId}</p>
                                            </div>
                                            <span className={`status-badge ${getStatusColor(shipment.status)}`}>
                                                {shipment.status.replace('_', ' ').toUpperCase()}
                                            </span>
                                        </div>

                                        <div className="text-xs text-gray-600 mb-3">
                                            <p>From: {shipment.pickupLocation?.address}</p>
                                            <p>To: {shipment.deliveryLocation?.address}</p>
                                            <p>QR: {shipment.qrCode}</p>
                                        </div>

                                        {getNextStatus(shipment.status) && (
                                            <button
                                                onClick={() => updateShipmentStatus(
                                                    shipment._id,
                                                    getNextStatus(shipment.status),
                                                    `Status updated by distributor at ${new Date().toISOString()}`
                                                )}
                                                className="btn-primary text-xs w-full"
                                            >
                                                {getNextStatusLabel(shipment.status)}
                                            </button>
                                        )}
                                    </div>
                                ))}

                                {shipments.filter(s => s.status !== 'delivered').length === 0 && (
                                    <p className="text-center text-gray-500 py-4 text-sm">
                                        No active shipments
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Live Tracking Map */}
                    <div className="lg:col-span-2">
                        <MapTracker
                            truckId={selectedTruck}
                            showHistory={true}
                            destination={{
                                lat: 28.7041,
                                lon: 77.1025,
                                address: "Delhi Market"
                            }}
                        />

                        {/* Delivery Alerts */}
                        <div className="card mt-6">
                            <div className="card-header">
                                <h3 className="text-lg font-semibold text-gray-900">Delivery Alerts</h3>
                            </div>

                            <div className="space-y-3">
                                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                                    <div className="flex items-center">
                                        <MapPin className="h-4 w-4 text-yellow-600 mr-2" />
                                        <div>
                                            <p className="font-medium text-yellow-900">Truck 001 - ETA Update</p>
                                            <p className="text-sm text-yellow-700">Estimated arrival at Delhi Market in 45 minutes</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                    <div className="flex items-center">
                                        <Truck className="h-4 w-4 text-blue-600 mr-2" />
                                        <div>
                                            <p className="font-medium text-blue-900">Truck 002 - Route Optimized</p>
                                            <p className="text-sm text-blue-700">New route calculated, saving 15 minutes</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                                    <div className="flex items-center">
                                        <MapPin className="h-4 w-4 text-green-600 mr-2" />
                                        <div>
                                            <p className="font-medium text-green-900">Truck 003 - Delivered</p>
                                            <p className="text-sm text-green-700">Shipment #SHIP003 successfully delivered</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DistributorTracking;