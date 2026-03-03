import React, { useState, useEffect } from 'react';
import { Plus, Sprout, LogOut, Settings, Bell, Upload, Camera, CheckCircle, XCircle } from 'lucide-react';
import WeatherWidget from '../components/WeatherWidget';
import CropPriceTrends from '../components/CropPriceTrends';
import WalletConnect from '../components/WalletConnect';
import api from '../utils/api';

const FarmerDashboard = ({ user, onLogout }) => {
    const [auctions, setAuctions] = useState([]);
    const [showCreateAuction, setShowCreateAuction] = useState(false);
    const [newAuction, setNewAuction] = useState({
        crop: '',
        variety: '',
        quantity: '',
        basePrice: '',
        duration: '7', // Default 7 days
        farmLocation: '',
        description: '',
        qualityGrade: '',
        qualityConfidence: null,
        predictions: null
    });
    const [loading, setLoading] = useState(true);
    const [createLoading, setCreateLoading] = useState(false);

    // Image upload and classification states
    const [uploadedImages, setUploadedImages] = useState([]);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [classificationLoading, setClassificationLoading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [qualityResult, setQualityResult] = useState(null);
    const [showQualityConfirmation, setShowQualityConfirmation] = useState(false);
    const [imageClassifications, setImageClassifications] = useState([]);

    useEffect(() => {
        fetchMyAuctions();
    }, []);

    const fetchMyAuctions = async () => {
        try {
            const response = await api.getFarmerAuctions();
            setAuctions(response.auctions || []);
        } catch (error) {
            console.error('Error fetching auctions:', error);
        } finally {
            setLoading(false);
        }
    };

    // Handle image selection
    const handleImageSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (uploadedImages.length >= 10) {
            alert('Maximum 10 photos allowed.');
            return;
        }

        if (!file.type.startsWith('image/')) {
            alert('Please select a valid image file.');
            return;
        }

        if (file.size > 5 * 1024 * 1024) { // 5MB limit
            alert('File size should be less than 5MB.');
            return;
        }

        // Create image object with preview URL
        const imageObj = {
            id: Date.now(),
            file: file,
            preview: URL.createObjectURL(file),
            uploaded: false,
            classification: null,
            progress: 0
        };

        setUploadedImages(prev => [...prev, imageObj]);

        // Auto-upload the image
        uploadSingleImage(imageObj);

        // Reset file input
        e.target.value = '';
    };

    // Upload and classify single image
    const uploadSingleImage = async (imageObj) => {
        try {
            // Update progress to show upload starting
            setUploadedImages(prev => prev.map(img =>
                img.id === imageObj.id
                    ? { ...img, progress: 10 }
                    : img
            ));

            const formData = new FormData();
            formData.append('image', imageObj.file);

            // Simulate upload progress
            const progressInterval = setInterval(() => {
                setUploadedImages(prev => prev.map(img =>
                    img.id === imageObj.id
                        ? { ...img, progress: Math.min(img.progress + 15, 80) }
                        : img
                ));
            }, 200);

            // Call classification API
            const response = await fetch('/api/classify-single-image', {
                method: 'POST',
                body: formData,
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            clearInterval(progressInterval);

            if (response.ok) {
                const result = await response.json();

                // Update image with classification result
                setUploadedImages(prev => prev.map(img =>
                    img.id === imageObj.id
                        ? {
                            ...img,
                            uploaded: true,
                            progress: 100,
                            classification: result.prediction
                        }
                        : img
                ));

                // Add to classifications array
                setImageClassifications(prev => [...prev, result.prediction]);

            } else {
                throw new Error('Failed to classify image');
            }

        } catch (error) {
            console.error('Error uploading/classifying image:', error);
            setUploadedImages(prev => prev.map(img =>
                img.id === imageObj.id
                    ? { ...img, progress: 0, uploaded: false }
                    : img
            ));
            alert('Failed to upload and classify image. Please try again.');
        }
    };

    // Remove uploaded image
    const removeImage = (imageId) => {
        setUploadedImages(prev => prev.filter(img => img.id !== imageId));
        setImageClassifications(prev => {
            const imgIndex = uploadedImages.findIndex(img => img.id === imageId);
            if (imgIndex !== -1) {
                return prev.filter((_, index) => index !== imgIndex);
            }
            return prev;
        });
        setQualityResult(null);
        setShowQualityConfirmation(false);
    };

    // Calculate final quality from all classifications
    const calculateFinalQuality = () => {
        if (imageClassifications.length < 10) return null;

        // Count quality grades
        const qualityCounts = imageClassifications.reduce((acc, classification) => {
            const grade = classification.class;
            acc[grade] = (acc[grade] || 0) + 1;
            return acc;
        }, {});

        // Find most common grade (majority vote)
        const finalGrade = Object.keys(qualityCounts).reduce((a, b) =>
            qualityCounts[a] > qualityCounts[b] ? a : b
        );

        // Calculate average confidence
        const avgConfidence = imageClassifications.reduce((sum, classification) =>
            sum + classification.confidence, 0) / imageClassifications.length;

        return {
            finalQuality: finalGrade,
            confidence: avgConfidence,
            predictions: imageClassifications,
            distribution: qualityCounts
        };
    };

    // Check if we can finalize quality assessment
    const handleFinalizeQuality = () => {
        const result = calculateFinalQuality();
        if (result) {
            setQualityResult(result);
            setNewAuction(prev => ({
                ...prev,
                qualityGrade: result.finalQuality,
                qualityConfidence: result.confidence,
                predictions: result.predictions
            }));
            setShowQualityConfirmation(true);
        }
    };

    const handleCreateAuction = async (e) => {
        e.preventDefault();

        if (!newAuction.qualityGrade) {
            alert('Please upload and classify 10 images to determine quality grade');
            return;
        }

        setCreateLoading(true);

        try {
            // For now, create auction in traditional database
            // TODO: Enable blockchain after testing
            /*
            const blockchainData = {
                cropType: newAuction.crop,
                quantity: parseInt(newAuction.quantity),
                basePrice: (parseFloat(newAuction.basePrice) * 1e18).toString(), // Convert to wei
                duration: parseInt(newAuction.duration) * 24 * 60 * 60, // Convert days to seconds
                location: newAuction.farmLocation,
                qualityGrade: newAuction.qualityGrade
            };
            
            await api.createBlockchainAuction(blockchainData);
            */

            // Create in traditional database for UI
            await api.createAuction(newAuction);
            setShowCreateAuction(false);
            setNewAuction({
                crop: '',
                variety: '',
                quantity: '',
                basePrice: '',
                duration: '7',
                farmLocation: '',
                description: '',
                qualityGrade: '',
                qualityConfidence: null,
                predictions: null
            });
            setUploadedImages([]);
            setImageClassifications([]);
            setQualityResult(null);
            setShowQualityConfirmation(false);
            fetchMyAuctions();
        } catch (error) {
            console.error('Error creating auction:', error);
            alert('Failed to create auction. Please try again.');
        } finally {
            setCreateLoading(false);
        }
    };

    const handleCloseAuction = async (auctionId) => {
        if (confirm('Are you sure you want to close this auction?')) {
            try {
                await api.closeAuction(auctionId);
                fetchMyAuctions();
            } catch (error) {
                console.error('Error closing auction:', error);
                alert('Failed to close auction. Please try again.');
            }
        }
    };

    const formatPrice = (price) => `₹${price.toLocaleString()}`;
    const formatDate = (date) => new Date(date).toLocaleDateString();

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center">
                            <Sprout className="h-8 w-8 text-agri-green-600 mr-3" />
                            <div>
                                <h1 className="text-xl font-semibold text-gray-900">Farmer Dashboard</h1>
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
                    {/* Left Column - Weather and Price Trends */}
                    <div className="lg:col-span-1 space-y-6">
                        <WeatherWidget location={user.location || "28.61,77.20"} crop="wheat" />
                        <CropPriceTrends crop="Wheat" />
                    </div>

                    {/* Right Column - Auction Management */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Create Auction Button */}
                        <div className="card">
                            <div className="flex justify-between items-center">
                                <h2 className="text-lg font-semibold text-gray-900">My Auctions</h2>
                                <button
                                    onClick={() => setShowCreateAuction(true)}
                                    className="btn-primary flex items-center"
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Create Auction
                                </button>
                            </div>
                        </div>

                        {/* Create Auction Form */}
                        {showCreateAuction && (
                            <div className="card">
                                <div className="card-header">
                                    <h3 className="text-lg font-semibold text-gray-900">Create New Auction</h3>
                                    <p className="text-sm text-gray-600">Upload crop images for AI-powered quality assessment</p>
                                </div>

                                <form onSubmit={handleCreateAuction} className="space-y-6">
                                    {/* Blockchain Wallet Connection */}
                                    <div className="bg-blue-50 p-4 rounded-lg">
                                        <h4 className="text-sm font-medium text-blue-900 mb-3">🔗 Blockchain Connection</h4>
                                        <WalletConnect />
                                        <p className="text-xs text-blue-600 mt-2">
                                            ⚡ Auctions will be created on blockchain for transparency and immutability
                                        </p>
                                    </div>

                                    {/* Image Upload Section */}
                                    <div className="bg-gray-50 p-6 rounded-lg">
                                        <div className="flex items-center mb-4">
                                            <Camera className="h-5 w-5 text-agri-green-600 mr-2" />
                                            <h4 className="text-lg font-medium text-gray-900">Crop Quality Assessment</h4>
                                        </div>

                                        <div className="space-y-4">
                                            <div>
                                                <label className="form-label">Upload Crop Images (10 required) *</label>
                                                <p className="text-sm text-gray-600 mb-4">
                                                    Upload 10 clear images of your crop from different angles for accurate AI quality assessment
                                                </p>

                                                {/* Image Upload Progress Grid */}
                                                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                                                    {Array.from({ length: 10 }, (_, index) => {
                                                        const image = uploadedImages[index];
                                                        return (
                                                            <div key={index} className="relative">
                                                                <div className="aspect-square border-2 border-dashed border-gray-300 rounded-lg overflow-hidden bg-gray-50">
                                                                    {image ? (
                                                                        <>
                                                                            <img
                                                                                src={image.preview}
                                                                                alt={`Crop ${index + 1}`}
                                                                                className="w-full h-full object-cover"
                                                                            />
                                                                            {/* Progress Overlay */}
                                                                            {image.progress < 100 && (
                                                                                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                                                                                    <div className="text-white text-sm font-medium">
                                                                                        {image.progress}%
                                                                                    </div>
                                                                                </div>
                                                                            )}
                                                                            {/* Success Check */}
                                                                            {image.uploaded && (
                                                                                <div className="absolute top-2 right-2 bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center">
                                                                                    ✓
                                                                                </div>
                                                                            )}
                                                                            {/* Remove Button */}
                                                                            <button
                                                                                onClick={() => removeImage(image.id)}
                                                                                className="absolute top-2 left-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors text-xs"
                                                                                title="Remove image"
                                                                            >
                                                                                ✕
                                                                            </button>
                                                                            {/* Quality Result */}
                                                                            {image.classification && (
                                                                                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 text-white text-xs p-1 text-center">
                                                                                    {image.classification.class}
                                                                                </div>
                                                                            )}
                                                                        </>
                                                                    ) : (
                                                                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                                            <div className="text-center">
                                                                                <div className="text-2xl mb-1">📷</div>
                                                                                <div className="text-xs">Photo {index + 1}</div>
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                {/* Progress Bar */}
                                                                {image && image.progress > 0 && image.progress < 100 && (
                                                                    <div className="mt-1 w-full bg-gray-200 rounded-full h-1">
                                                                        <div
                                                                            className="bg-agri-green-600 h-1 rounded-full transition-all duration-300"
                                                                            style={{ width: `${image.progress}%` }}
                                                                        ></div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>

                                                {/* Upload Button */}
                                                {uploadedImages.length < 10 && (
                                                    <div className="text-center">
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            onChange={handleImageSelect}
                                                            className="hidden"
                                                            id="image-upload"
                                                        />
                                                        <label
                                                            htmlFor="image-upload"
                                                            className="inline-flex items-center px-4 py-2 bg-agri-green-600 text-white rounded-lg cursor-pointer hover:bg-agri-green-700 transition-colors"
                                                        >
                                                            📷 Add Photo ({uploadedImages.length}/10)
                                                        </label>
                                                    </div>
                                                )}

                                                {/* Overall Progress */}
                                                <div className="mt-4">
                                                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                                                        <span>Upload Progress</span>
                                                        <span>{uploadedImages.filter(img => img.uploaded).length}/10 completed</span>
                                                    </div>
                                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                                        <div
                                                            className="bg-agri-green-600 h-2 rounded-full transition-all duration-300"
                                                            style={{ width: `${(uploadedImages.filter(img => img.uploaded).length / 10) * 100}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Finalize Quality Button */}
                                            {uploadedImages.filter(img => img.uploaded).length === 10 && !qualityResult && (
                                                <button
                                                    type="button"
                                                    onClick={handleFinalizeQuality}
                                                    className="btn-primary w-full"
                                                >
                                                    🔍 Finalize Quality Assessment
                                                </button>
                                            )}
                                        </div>

                                        {/* Quality Assessment Results */}
                                        {qualityResult && (
                                            <div className="bg-white p-4 rounded-lg border border-agri-green-200">
                                                <div className="flex items-center mb-3">
                                                    <CheckCircle className="h-5 w-5 text-agri-green-600 mr-2" />
                                                    <h5 className="font-medium text-gray-900">Quality Assessment Complete</h5>
                                                </div>

                                                <div className="space-y-2">
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-600">Predicted Quality:</span>
                                                        <span className="font-medium text-agri-green-600">
                                                            {qualityResult.finalQuality}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-600">Confidence:</span>
                                                        <span className="font-medium">
                                                            {(qualityResult.confidence * 100).toFixed(1)}%
                                                        </span>
                                                    </div>
                                                </div>

                                                {qualityResult.distribution && (
                                                    <div className="mt-3 pt-3 border-t border-gray-200">
                                                        <h6 className="text-sm font-medium text-gray-900 mb-2">Prediction Distribution:</h6>
                                                        <div className="space-y-1">
                                                            {Object.entries(qualityResult.distribution).map(([quality, count]) => (
                                                                <div key={quality} className="flex justify-between text-sm">
                                                                    <span className="text-gray-600">{quality}:</span>
                                                                    <span className="font-medium">{count} images</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Basic Auction Details */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="form-label">Crop Type *</label>
                                            <select
                                                required
                                                value={newAuction.crop}
                                                onChange={(e) => setNewAuction({ ...newAuction, crop: e.target.value })}
                                                className="form-input"
                                            >
                                                <option value="">Select Crop</option>
                                                <option value="Wheat">Wheat</option>
                                                <option value="Rice">Rice</option>
                                                <option value="Corn">Corn</option>
                                                <option value="Tomato">Tomato</option>
                                                <option value="Onion">Onion</option>
                                                <option value="Potato">Potato</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="form-label">Variety</label>
                                            <input
                                                type="text"
                                                placeholder="e.g., Basmati, Hybrid"
                                                value={newAuction.variety}
                                                onChange={(e) => setNewAuction({ ...newAuction, variety: e.target.value })}
                                                className="form-input"
                                            />
                                        </div>

                                        <div>
                                            <label className="form-label">Quantity (kg) *</label>
                                            <input
                                                type="number"
                                                required
                                                min="1"
                                                placeholder="Enter quantity in kg"
                                                value={newAuction.quantity}
                                                onChange={(e) => setNewAuction({ ...newAuction, quantity: e.target.value })}
                                                className="form-input"
                                            />
                                        </div>

                                        <div>
                                            <label className="form-label">Base Price (₹/kg) *</label>
                                            <input
                                                type="number"
                                                required
                                                min="1"
                                                placeholder="Starting price per kg"
                                                value={newAuction.basePrice}
                                                onChange={(e) => setNewAuction({ ...newAuction, basePrice: e.target.value })}
                                                className="form-input"
                                            />
                                        </div>

                                        <div>
                                            <label className="form-label">Auction Duration (days) *</label>
                                            <select
                                                required
                                                value={newAuction.duration}
                                                onChange={(e) => setNewAuction({ ...newAuction, duration: e.target.value })}
                                                className="form-input"
                                            >
                                                <option value="1">1 Day</option>
                                                <option value="3">3 Days</option>
                                                <option value="7">7 Days</option>
                                                <option value="14">14 Days</option>
                                                <option value="30">30 Days</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="form-label">Farm Location *</label>
                                            <input
                                                type="text"
                                                required
                                                placeholder="e.g., Punjab, India"
                                                value={newAuction.farmLocation}
                                                onChange={(e) => setNewAuction({ ...newAuction, farmLocation: e.target.value })}
                                                className="form-input"
                                            />
                                        </div>

                                        <div className="md:col-span-2">
                                            <label className="form-label">AI-Predicted Quality Grade</label>
                                            <input
                                                type="text"
                                                value={newAuction.qualityGrade || 'Upload images to determine quality'}
                                                readOnly
                                                className="form-input bg-gray-50 cursor-not-allowed"
                                                placeholder="Quality will be determined after image analysis"
                                            />
                                            {newAuction.qualityConfidence && (
                                                <p className="text-sm text-gray-600 mt-1">
                                                    Confidence: {(newAuction.qualityConfidence * 100).toFixed(1)}%
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="form-label">Description</label>
                                        <textarea
                                            rows={3}
                                            placeholder="Describe your crop, farming practices, etc."
                                            value={newAuction.description}
                                            onChange={(e) => setNewAuction({ ...newAuction, description: e.target.value })}
                                            className="form-input"
                                        />
                                    </div>

                                    <div className="flex space-x-3">
                                        <button
                                            type="submit"
                                            disabled={createLoading || !newAuction.qualityGrade}
                                            className="btn-primary flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {createLoading ? (
                                                <div className="loading-spinner h-4 w-4 mr-2"></div>
                                            ) : (
                                                <Plus className="h-4 w-4 mr-2" />
                                            )}
                                            Create Auction
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setShowCreateAuction(false);
                                                setUploadedImages([]);
                                                setImageClassifications([]);
                                                setQualityResult(null);
                                                setShowQualityConfirmation(false);
                                            }}
                                            className="btn-secondary"
                                        >
                                            Cancel
                                        </button>
                                    </div>

                                    {!newAuction.qualityGrade && (
                                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                                            <div className="flex">
                                                <XCircle className="h-5 w-5 text-amber-600 mr-2 flex-shrink-0 mt-0.5" />
                                                <div>
                                                    <h4 className="text-sm font-medium text-amber-800">Quality Assessment Required</h4>
                                                    <p className="text-sm text-amber-700 mt-1">
                                                        Please upload at least 10 crop images and analyze them to determine the quality grade before creating the auction.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </form>
                            </div>
                        )}

                        {/* Auctions List */}
                        <div className="space-y-4">
                            {loading ? (
                                <div className="card">
                                    <div className="text-center py-8">
                                        <div className="loading-spinner mx-auto"></div>
                                    </div>
                                </div>
                            ) : auctions.length === 0 ? (
                                <div className="card text-center py-8">
                                    <Sprout className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                    <p className="text-gray-600">No auctions created yet</p>
                                    <p className="text-sm text-gray-500">Create your first auction to start selling crops</p>
                                </div>
                            ) : (
                                auctions.map((auction) => (
                                    <div key={auction._id} className="card">
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1">
                                                <div className="flex items-center space-x-3 mb-2">
                                                    <h3 className="text-lg font-semibold text-gray-900">
                                                        {auction.crop} {auction.variety && `(${auction.variety})`}
                                                    </h3>
                                                    <span className={`status-badge ${auction.status === 'open' ? 'status-open' :
                                                        auction.status === 'sold' ? 'status-delivered' : 'status-closed'
                                                        }`}>
                                                        {auction.status.toUpperCase()}
                                                    </span>
                                                </div>

                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                                    <div>
                                                        <p className="text-sm text-gray-600">Quantity</p>
                                                        <p className="font-medium">{auction.quantity} kg</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm text-gray-600">Base Price</p>
                                                        <p className="font-medium">{formatPrice(auction.basePrice)}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm text-gray-600">Current Highest</p>
                                                        <p className="font-medium text-agri-green-600">
                                                            {formatPrice(auction.currentHighestBid)}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm text-gray-600">Total Bids</p>
                                                        <p className="font-medium">{auction.bids?.length || 0}</p>
                                                    </div>
                                                </div>

                                                {auction.description && (
                                                    <p className="text-sm text-gray-600 mb-3">{auction.description}</p>
                                                )}

                                                <div className="flex items-center justify-between text-sm text-gray-500">
                                                    <span>Created: {formatDate(auction.createdAt)}</span>
                                                    <div className="text-right">
                                                        <div>Quality: {auction.qualityGrade}</div>
                                                        {auction.qualityConfidence && (
                                                            <div className="text-xs text-agri-green-600">
                                                                AI Confidence: {(auction.qualityConfidence * 100).toFixed(1)}%
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="ml-4">
                                                {auction.status === 'open' && (
                                                    <button
                                                        onClick={() => handleCloseAuction(auction._id)}
                                                        className="btn-danger text-sm"
                                                    >
                                                        Close Auction
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        {/* Recent Bids */}
                                        {auction.bids && auction.bids.length > 0 && (
                                            <div className="mt-4 pt-4 border-t border-gray-200">
                                                <h4 className="text-sm font-medium text-gray-900 mb-2">Recent Bids</h4>
                                                <div className="space-y-1">
                                                    {auction.bids.slice(-3).reverse().map((bid, index) => (
                                                        <div key={index} className="flex justify-between text-sm">
                                                            <span className="text-gray-600">
                                                                {new Date(bid.timestamp).toLocaleString()}
                                                            </span>
                                                            <span className="font-medium text-agri-green-600">
                                                                {formatPrice(bid.bidAmount)}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FarmerDashboard;