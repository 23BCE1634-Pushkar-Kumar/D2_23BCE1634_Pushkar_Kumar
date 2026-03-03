import React, { useState, useEffect } from 'react';
import { Package, LogOut, Settings, Bell, MapPin, Clock, User, Truck } from 'lucide-react';
import QRScanner from '../components/QRScanner';
import MapTracker from '../components/MapTracker';
import api from '../utils/api';

const ConsumerScan = ({ user, onLogout }) => {
    const [scanResult, setScanResult] = useState(null);
    const [shipmentData, setShipmentData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [showScanner, setShowScanner] = useState(true);
    const [error, setError] = useState('');

    const handleQRScan = async (qrCode) => {
        setLoading(true);
        setError('');
        setScanResult(qrCode);
        setShowScanner(false);

        try {
            // First try to get shipment by QR code
            const response = await api.getShipmentByQR(qrCode);
            if (response.success) {
                setShipmentData(response.shipment);
            } else {
                // If not found, create mock data for demonstration
                createMockShipmentData(qrCode);
            }
        } catch (err) {
            console.log('QR not found in shipments, creating mock data');
            createMockShipmentData(qrCode);
        } finally {
            setLoading(false);
        }
    };

    const createMockShipmentData = (qrCode) => {
        // Create mock shipment data for demonstration
        const mockData = {
            _id: qrCode,
            qrCode,
            truckId: 'truck001',
            status: Math.random() > 0.5 ? 'in_transit' : 'delivered',
            quantity: Math.floor(Math.random() * 500) + 100,
            createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
            estimatedDelivery: new Date(Date.now() + Math.random() * 2 * 24 * 60 * 60 * 1000),
            actualDelivery: Math.random() > 0.5 ? new Date() : null,
            pickupLocation: {
                address: "Green Valley Farm, Haryana",
                coordinates: { lat: 28.4595, lon: 77.0266 }
            },
            deliveryLocation: {
                address: "Delhi Wholesale Market",
                coordinates: { lat: 28.7041, lon: 77.1025 }
            },
            timeline: [
                {
                    status: "pending",
                    timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
                    note: "Shipment created"
                },
                {
                    status: "picked_up",
                    timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
                    note: "Picked up from farm"
                },
                {
                    status: "in_transit",
                    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
                    note: "In transit to destination"
                }
            ],
            // Mock crop/product info
            productInfo: {
                crop: ['Wheat', 'Rice', 'Tomato', 'Onion'][Math.floor(Math.random() * 4)],
                variety: 'Premium Grade A',
                harvestDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
                farmer: {
                    name: 'Ram Kumar',
                    location: 'Haryana',
                    certifications: ['Organic', 'Fair Trade']
                },
                qualityTests: {
                    pesticide: 'Not Detected',
                    moisture: '12%',
                    purity: '98%'
                }
            }
        };

        // Add delivered status if random
        if (mockData.status === 'delivered') {
            mockData.timeline.push({
                status: "delivered",
                timestamp: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000),
                note: "Successfully delivered"
            });
        }

        setShipmentData(mockData);
    };

    const resetScan = () => {
        setScanResult(null);
        setShipmentData(null);
        setShowScanner(true);
        setError('');
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'pending': return 'text-yellow-600 bg-yellow-100';
            case 'picked_up': return 'text-blue-600 bg-blue-100';
            case 'in_transit': return 'text-orange-600 bg-orange-100';
            case 'delivered': return 'text-green-600 bg-green-100';
            default: return 'text-gray-600 bg-gray-100';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'pending': return <Clock className="h-4 w-4" />;
            case 'picked_up': return <Truck className="h-4 w-4" />;
            case 'in_transit': return <MapPin className="h-4 w-4" />;
            case 'delivered': return <Package className="h-4 w-4" />;
            default: return <Clock className="h-4 w-4" />;
        }
    };

    const formatDate = (date) => new Date(date).toLocaleDateString();
    const formatDateTime = (date) => new Date(date).toLocaleString();

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center">
                            <Package className="h-8 w-8 text-purple-600 mr-3" />
                            <div>
                                <h1 className="text-xl font-semibold text-gray-900">Consumer Tracking</h1>
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
                {showScanner && !shipmentData && (
                    <div className="max-w-md mx-auto">
                        <QRScanner onScan={handleQRScan} />
                    </div>
                )}

                {loading && (
                    <div className="text-center py-8">
                        <div className="loading-spinner mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading shipment information...</p>
                    </div>
                )}

                {shipmentData && (
                    <div className="space-y-6">
                        {/* Shipment Overview */}
                        <div className="card">
                            <div className="card-header">
                                <div className="flex justify-between items-center">
                                    <h2 className="text-lg font-semibold text-gray-900">
                                        Product Tracking - {scanResult}
                                    </h2>
                                    <button
                                        onClick={resetScan}
                                        className="btn-secondary text-sm"
                                    >
                                        Scan Another
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {/* Product Information */}
                                {shipmentData.productInfo && (
                                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                        <h3 className="font-semibold text-green-900 mb-3 flex items-center">
                                            <Package className="h-4 w-4 mr-2" />
                                            Product Details
                                        </h3>
                                        <div className="space-y-2 text-sm">
                                            <div>
                                                <p className="text-green-700"><strong>Crop:</strong> {shipmentData.productInfo.crop}</p>
                                                <p className="text-green-700"><strong>Variety:</strong> {shipmentData.productInfo.variety}</p>
                                                <p className="text-green-700"><strong>Quantity:</strong> {shipmentData.quantity} kg</p>
                                                <p className="text-green-700"><strong>Harvest Date:</strong> {formatDate(shipmentData.productInfo.harvestDate)}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Farmer Information */}
                                {shipmentData.productInfo?.farmer && (
                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                        <h3 className="font-semibold text-blue-900 mb-3 flex items-center">
                                            <User className="h-4 w-4 mr-2" />
                                            Farmer Details
                                        </h3>
                                        <div className="space-y-2 text-sm">
                                            <p className="text-blue-700"><strong>Name:</strong> {shipmentData.productInfo.farmer.name}</p>
                                            <p className="text-blue-700"><strong>Location:</strong> {shipmentData.productInfo.farmer.location}</p>
                                            <div>
                                                <p className="text-blue-700"><strong>Certifications:</strong></p>
                                                <div className="flex space-x-1 mt-1">
                                                    {shipmentData.productInfo.farmer.certifications.map((cert, index) => (
                                                        <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                                                            {cert}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Quality Information */}
                                {shipmentData.productInfo?.qualityTests && (
                                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                                        <h3 className="font-semibold text-purple-900 mb-3">Quality Tests</h3>
                                        <div className="space-y-2 text-sm">
                                            <p className="text-purple-700">
                                                <strong>Pesticide:</strong> {shipmentData.productInfo.qualityTests.pesticide}
                                            </p>
                                            <p className="text-purple-700">
                                                <strong>Moisture:</strong> {shipmentData.productInfo.qualityTests.moisture}
                                            </p>
                                            <p className="text-purple-700">
                                                <strong>Purity:</strong> {shipmentData.productInfo.qualityTests.purity}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Timeline */}
                            <div className="card">
                                <div className="card-header">
                                    <h3 className="text-lg font-semibold text-gray-900">Shipment Timeline</h3>
                                </div>

                                <div className="space-y-4">
                                    {shipmentData.timeline.map((event, index) => (
                                        <div key={index} className="flex items-start space-x-3">
                                            <div className={`p-2 rounded-full ${getStatusColor(event.status)}`}>
                                                {getStatusIcon(event.status)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between">
                                                    <p className="font-medium text-gray-900 capitalize">
                                                        {event.status.replace('_', ' ')}
                                                    </p>
                                                    <p className="text-sm text-gray-500">
                                                        {formatDateTime(event.timestamp)}
                                                    </p>
                                                </div>
                                                <p className="text-sm text-gray-600">{event.note}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Current Status */}
                                <div className="mt-4 pt-4 border-t border-gray-200">
                                    <div className="flex items-center justify-between">
                                        <span className="font-medium text-gray-900">Current Status:</span>
                                        <span className={`status-badge ${shipmentData.status === 'delivered' ? 'status-delivered' :
                                            shipmentData.status === 'in_transit' ? 'status-in-transit' :
                                                shipmentData.status === 'picked_up' ? 'status-in-transit' :
                                                    'status-pending'
                                            }`}>
                                            {shipmentData.status.replace('_', ' ').toUpperCase()}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Delivery Information */}
                            <div className="card">
                                <div className="card-header">
                                    <h3 className="text-lg font-semibold text-gray-900">Delivery Information</h3>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <p className="text-sm font-medium text-gray-700">From</p>
                                        <p className="text-gray-600">{shipmentData.pickupLocation.address}</p>
                                    </div>

                                    <div>
                                        <p className="text-sm font-medium text-gray-700">To</p>
                                        <p className="text-gray-600">{shipmentData.deliveryLocation.address}</p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-sm font-medium text-gray-700">Estimated Delivery</p>
                                            <p className="text-gray-600">
                                                {shipmentData.estimatedDelivery ?
                                                    formatDateTime(shipmentData.estimatedDelivery) :
                                                    'Not available'
                                                }
                                            </p>
                                        </div>

                                        {shipmentData.actualDelivery && (
                                            <div>
                                                <p className="text-sm font-medium text-gray-700">Actual Delivery</p>
                                                <p className="text-green-600 font-medium">
                                                    {formatDateTime(shipmentData.actualDelivery)}
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    <div>
                                        <p className="text-sm font-medium text-gray-700">Tracking ID</p>
                                        <p className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                                            {shipmentData.qrCode}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Live Map Tracking */}
                        {shipmentData.status !== 'delivered' && shipmentData.truckId && (
                            <MapTracker
                                truckId={shipmentData.truckId}
                                destination={shipmentData.deliveryLocation.coordinates}
                                showHistory={true}
                            />
                        )}

                        {/* Contact Information */}
                        <div className="card">
                            <div className="card-header">
                                <h3 className="text-lg font-semibold text-gray-900">Need Help?</h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="text-center p-4 bg-gray-50 rounded-lg">
                                    <Package className="h-8 w-8 text-gray-600 mx-auto mb-2" />
                                    <p className="font-medium text-gray-900">Customer Support</p>
                                    <p className="text-sm text-gray-600">1800-123-4567</p>
                                </div>

                                <div className="text-center p-4 bg-gray-50 rounded-lg">
                                    <Truck className="h-8 w-8 text-gray-600 mx-auto mb-2" />
                                    <p className="font-medium text-gray-900">Delivery Issues</p>
                                    <p className="text-sm text-gray-600">delivery@agrihub.com</p>
                                </div>

                                <div className="text-center p-4 bg-gray-50 rounded-lg">
                                    <User className="h-8 w-8 text-gray-600 mx-auto mb-2" />
                                    <p className="font-medium text-gray-900">Quality Concerns</p>
                                    <p className="text-sm text-gray-600">quality@agrihub.com</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ConsumerScan;