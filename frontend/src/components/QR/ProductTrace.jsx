import React, { useState, useEffect } from 'react';
import { useProvenance } from '../../hooks/useProvenance';
import { useGPS } from '../../hooks/useGPS';
import {
    Package,
    MapPin,
    Clock,
    CheckCircle,
    AlertTriangle,
    Truck,
    Store,
    Leaf,
    Award,
    Thermometer,
    Droplet,
    Calendar,
    User,
    ExternalLink
} from 'lucide-react';

const ProductTrace = ({ qrCodeHash, onClose }) => {
    const { getFullProductTrace, loading, error } = useProvenance();
    const { getTrackingHistory } = useGPS();

    const [traceData, setTraceData] = useState(null);
    const [activeTab, setActiveTab] = useState('overview');
    const [locationHistory, setLocationHistory] = useState([]);

    useEffect(() => {
        if (qrCodeHash) {
            loadTraceData();
        }
    }, [qrCodeHash]);

    const loadTraceData = async () => {
        try {
            const data = await getFullProductTrace(qrCodeHash);
            setTraceData(data);

            // Load GPS tracking if shipment exists
            if (data.product.shipmentId && data.product.shipmentId !== 0) {
                const gpsHistory = await getTrackingHistory(data.product.shipmentId);
                setLocationHistory(gpsHistory);
            }
        } catch (err) {
            console.error('Error loading trace data:', err);
        }
    };

    const getStageIcon = (stage) => {
        const icons = {
            'FARMING': <Leaf className="h-5 w-5 text-green-600" />,
            'HARVESTED': <Package className="h-5 w-5 text-yellow-600" />,
            'PROCESSED': <Award className="h-5 w-5 text-blue-600" />,
            'PACKAGED': <Package className="h-5 w-5 text-purple-600" />,
            'IN_TRANSIT': <Truck className="h-5 w-5 text-orange-600" />,
            'DELIVERED': <CheckCircle className="h-5 w-5 text-green-600" />,
            'RETAIL': <Store className="h-5 w-5 text-indigo-600" />
        };
        return icons[stage] || <Package className="h-5 w-5 text-gray-600" />;
    };

    const getStageColor = (stage) => {
        const colors = {
            'FARMING': 'bg-green-100 text-green-800',
            'HARVESTED': 'bg-yellow-100 text-yellow-800',
            'PROCESSED': 'bg-blue-100 text-blue-800',
            'PACKAGED': 'bg-purple-100 text-purple-800',
            'IN_TRANSIT': 'bg-orange-100 text-orange-800',
            'DELIVERED': 'bg-green-100 text-green-800',
            'RETAIL': 'bg-indigo-100 text-indigo-800'
        };
        return colors[stage] || 'bg-gray-100 text-gray-800';
    };

    const formatDate = (timestamp) => {
        return new Date(timestamp * 1000).toLocaleString();
    };

    const formatAddress = (address) => {
        return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="loading-spinner mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading product information...</p>
                </div>
            </div>
        );
    }

    if (error || !traceData) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">Product Not Found</h2>
                    <p className="text-gray-600 mb-4">
                        {error || 'The QR code does not correspond to any product in our system.'}
                    </p>
                    {onClose && (
                        <button onClick={onClose} className="btn-primary">
                            Go Back
                        </button>
                    )}
                </div>
            </div>
        );
    }

    const { product, history, currentStage, isExpired } = traceData;

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 py-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                                {getStageIcon(currentStage)}
                                <span className="ml-3">{product.crop} {product.variety && `(${product.variety})`}</span>
                            </h1>
                            <p className="text-gray-600 mt-1">
                                Product ID: {product.productId} • QR: {qrCodeHash.substring(0, 8)}...
                            </p>
                        </div>

                        <div className="flex items-center space-x-3">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStageColor(currentStage)}`}>
                                {currentStage.replace('_', ' ')}
                            </span>
                            {isExpired && (
                                <span className="px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                                    EXPIRED
                                </span>
                            )}
                            {onClose && (
                                <button onClick={onClose} className="btn-secondary">
                                    Close
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="bg-white border-b">
                <div className="max-w-7xl mx-auto px-4">
                    <nav className="flex space-x-8">
                        {[
                            { id: 'overview', label: 'Overview', icon: Package },
                            { id: 'journey', label: 'Journey', icon: MapPin },
                            { id: 'quality', label: 'Quality', icon: Award },
                            { id: 'tracking', label: 'Tracking', icon: Truck }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center py-4 border-b-2 transition-colors ${activeTab === tab.id
                                        ? 'border-agri-green-500 text-agri-green-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                <tab.icon className="h-4 w-4 mr-2" />
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-4 py-6">
                {activeTab === 'overview' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Product Details */}
                        <div className="lg:col-span-2">
                            <div className="card">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Product Details</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-gray-600">Crop Type</p>
                                        <p className="font-medium">{product.crop}</p>
                                    </div>
                                    {product.variety && (
                                        <div>
                                            <p className="text-sm text-gray-600">Variety</p>
                                            <p className="font-medium">{product.variety}</p>
                                        </div>
                                    )}
                                    <div>
                                        <p className="text-sm text-gray-600">Quantity</p>
                                        <p className="font-medium">{product.quantity} kg</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Farm Location</p>
                                        <p className="font-medium">{product.farmLocation || 'Not specified'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Harvest Date</p>
                                        <p className="font-medium">{formatDate(product.harvestDate)}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Expiry Date</p>
                                        <p className={`font-medium ${isExpired ? 'text-red-600' : ''}`}>
                                            {formatDate(product.expiryDate)}
                                            {isExpired && ' (EXPIRED)'}
                                        </p>
                                    </div>
                                </div>

                                {/* Certifications */}
                                {product.certifications && product.certifications.length > 0 && (
                                    <div className="mt-4">
                                        <p className="text-sm text-gray-600 mb-2">Certifications</p>
                                        <div className="flex flex-wrap gap-2">
                                            {product.certifications.map((cert, index) => (
                                                <span
                                                    key={index}
                                                    className="px-2 py-1 bg-green-100 text-green-800 text-sm rounded-full"
                                                >
                                                    {cert}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Quality Information */}
                        <div>
                            <div className="card">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                    <Award className="h-5 w-5 mr-2" />
                                    Quality Assessment
                                </h3>
                                <div className="space-y-3">
                                    <div>
                                        <p className="text-sm text-gray-600">Grade</p>
                                        <p className="font-semibold text-lg text-agri-green-600">
                                            {product.qualityGrade || 'Not assessed'}
                                        </p>
                                    </div>
                                    {product.qualityConfidence > 0 && (
                                        <div>
                                            <p className="text-sm text-gray-600">AI Confidence</p>
                                            <div className="flex items-center">
                                                <div className="flex-1 bg-gray-200 rounded-full h-2 mr-2">
                                                    <div
                                                        className="bg-agri-green-600 h-2 rounded-full"
                                                        style={{ width: `${product.qualityConfidence}%` }}
                                                    ></div>
                                                </div>
                                                <span className="text-sm font-medium">{product.qualityConfidence}%</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Supply Chain Actors */}
                            <div className="card mt-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Supply Chain</h3>
                                <div className="space-y-3">
                                    <div className="flex items-center">
                                        <User className="h-4 w-4 text-green-600 mr-2" />
                                        <div className="flex-1">
                                            <p className="text-sm text-gray-600">Farmer</p>
                                            <p className="font-medium text-sm">{formatAddress(product.farmer)}</p>
                                        </div>
                                    </div>

                                    {product.distributor !== '0x0000000000000000000000000000000000000000' && (
                                        <div className="flex items-center">
                                            <Truck className="h-4 w-4 text-orange-600 mr-2" />
                                            <div className="flex-1">
                                                <p className="text-sm text-gray-600">Distributor</p>
                                                <p className="font-medium text-sm">{formatAddress(product.distributor)}</p>
                                            </div>
                                        </div>
                                    )}

                                    {product.retailer !== '0x0000000000000000000000000000000000000000' && (
                                        <div className="flex items-center">
                                            <Store className="h-4 w-4 text-indigo-600 mr-2" />
                                            <div className="flex-1">
                                                <p className="text-sm text-gray-600">Retailer</p>
                                                <p className="font-medium text-sm">{formatAddress(product.retailer)}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'journey' && (
                    <div className="card">
                        <h3 className="text-lg font-semibold text-gray-900 mb-6">Product Journey</h3>
                        <div className="space-y-6">
                            {history.map((stage, index) => (
                                <div key={index} className="relative flex">
                                    <div className="flex-shrink-0">
                                        <div className="w-10 h-10 rounded-full bg-white border-2 border-gray-300 flex items-center justify-center">
                                            {getStageIcon(stage.stage)}
                                        </div>
                                        {index < history.length - 1 && (
                                            <div className="w-px h-6 bg-gray-300 mx-auto mt-2"></div>
                                        )}
                                    </div>

                                    <div className="ml-4 flex-1 min-w-0">
                                        <div className="flex items-center space-x-2 mb-2">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStageColor(stage.stage)}`}>
                                                {stage.stage.replace('_', ' ')}
                                            </span>
                                            <span className="text-sm text-gray-500 flex items-center">
                                                <Clock className="h-3 w-3 mr-1" />
                                                {formatDate(stage.timestamp)}
                                            </span>
                                        </div>

                                        <div className="text-sm text-gray-600 space-y-1">
                                            {stage.location && (
                                                <div className="flex items-center">
                                                    <MapPin className="h-3 w-3 mr-1" />
                                                    {stage.location}
                                                </div>
                                            )}

                                            {stage.notes && (
                                                <p>{stage.notes}</p>
                                            )}

                                            {stage.temperature && (
                                                <div className="flex items-center">
                                                    <Thermometer className="h-3 w-3 mr-1" />
                                                    Temperature: {stage.temperature}
                                                </div>
                                            )}

                                            {stage.humidity && (
                                                <div className="flex items-center">
                                                    <Droplet className="h-3 w-3 mr-1" />
                                                    Humidity: {stage.humidity}
                                                </div>
                                            )}

                                            <div className="flex items-center text-xs text-gray-400">
                                                <User className="h-3 w-3 mr-1" />
                                                {formatAddress(stage.actor)}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'quality' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="card">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quality Assessment</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-700">Quality Grade</label>
                                    <div className="mt-1">
                                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                                            {product.qualityGrade || 'Not assessed'}
                                        </span>
                                    </div>
                                </div>

                                {product.qualityConfidence > 0 && (
                                    <div>
                                        <label className="text-sm font-medium text-gray-700">AI Confidence Level</label>
                                        <div className="mt-2">
                                            <div className="bg-gray-200 rounded-full h-3">
                                                <div
                                                    className="bg-agri-green-600 h-3 rounded-full transition-all duration-300"
                                                    style={{ width: `${product.qualityConfidence}%` }}
                                                ></div>
                                            </div>
                                            <p className="text-sm text-gray-600 mt-1">{product.qualityConfidence}% confidence</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="card">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Certifications & Standards</h3>
                            {product.certifications && product.certifications.length > 0 ? (
                                <div className="space-y-2">
                                    {product.certifications.map((cert, index) => (
                                        <div key={index} className="flex items-center p-3 bg-green-50 rounded-lg">
                                            <Award className="h-5 w-5 text-green-600 mr-3" />
                                            <span className="font-medium text-green-800">{cert}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-gray-500">No certifications recorded</p>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'tracking' && (
                    <div className="card">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">GPS Tracking History</h3>
                        {locationHistory && locationHistory.length > 0 ? (
                            <div className="space-y-4">
                                {locationHistory.map((location, index) => (
                                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="font-medium text-gray-900">
                                                Location Update #{locationHistory.length - index}
                                            </span>
                                            <span className="text-sm text-gray-500">
                                                {formatDate(location.timestamp)}
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <span className="text-gray-600">Coordinates:</span>
                                                <br />
                                                {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                                            </div>
                                            <div>
                                                <span className="text-gray-600">Speed:</span>
                                                <br />
                                                {location.speed} km/h
                                            </div>
                                        </div>

                                        {location.location && (
                                            <div className="mt-2 text-sm">
                                                <span className="text-gray-600">Location:</span> {location.location}
                                            </div>
                                        )}

                                        {location.emergencyBrake && (
                                            <div className="mt-2">
                                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                    <AlertTriangle className="h-3 w-3 mr-1" />
                                                    Emergency Brake
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-500">No GPS tracking data available</p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProductTrace;