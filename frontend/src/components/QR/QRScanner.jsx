import React, { useState, useRef, useEffect } from 'react';
import { QrCode, Camera, X, RefreshCw } from 'lucide-react';

const QRScanner = ({ onScan, onError, isOpen, onClose }) => {
    const [isScanning, setIsScanning] = useState(false);
    const [error, setError] = useState(null);
    const [hasPermission, setHasPermission] = useState(null);
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);
    const scanIntervalRef = useRef(null);

    // Initialize camera when scanner opens
    useEffect(() => {
        if (isOpen) {
            initializeCamera();
        } else {
            stopCamera();
        }

        return () => {
            stopCamera();
        };
    }, [isOpen]);

    // Initialize camera and start scanning
    const initializeCamera = async () => {
        try {
            setError(null);

            // Check if browser supports camera
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error('Camera not supported in this browser');
            }

            // Request camera permission
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'environment', // Use back camera on mobile
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            });

            streamRef.current = stream;
            setHasPermission(true);

            // Set video source
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.onloadedmetadata = () => {
                    videoRef.current.play();
                    startScanning();
                };
            }

        } catch (err) {
            console.error('Error initializing camera:', err);
            setError(err.message);
            setHasPermission(false);
            if (onError) onError(err);
        }
    };

    // Start QR code scanning
    const startScanning = () => {
        setIsScanning(true);

        scanIntervalRef.current = setInterval(() => {
            scanQRCode();
        }, 1000); // Scan every second
    };

    // Stop camera and scanning
    const stopCamera = () => {
        setIsScanning(false);

        // Clear scanning interval
        if (scanIntervalRef.current) {
            clearInterval(scanIntervalRef.current);
            scanIntervalRef.current = null;
        }

        // Stop video stream
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }

        // Reset video element
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
    };

    // Scan QR code from video feed
    const scanQRCode = async () => {
        if (!videoRef.current || !canvasRef.current) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');

        // Set canvas size to match video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // Draw current video frame to canvas
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        try {
            // Get image data from canvas
            const imageData = context.getImageData(0, 0, canvas.width, canvas.height);

            // Use jsQR library to decode QR code
            const code = jsQR(imageData.data, canvas.width, canvas.height);

            if (code) {
                // QR code found
                setIsScanning(false);

                try {
                    // Parse QR data
                    const qrData = JSON.parse(code.data);

                    if (qrData.type === 'agri-product' || qrData.type === 'agri-shipment') {
                        if (onScan) onScan(qrData);
                        onClose?.();
                    } else {
                        throw new Error('Invalid QR code - not an agricultural product');
                    }
                } catch (parseError) {
                    // If JSON parsing fails, treat as plain text
                    if (onScan) onScan({ type: 'text', data: code.data });
                    onClose?.();
                }
            }
        } catch (scanError) {
            console.error('Error scanning QR code:', scanError);
        }
    };

    // Manual file upload for QR image
    const handleFileUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        try {
            const imageUrl = URL.createObjectURL(file);
            const img = new Image();

            img.onload = () => {
                const canvas = canvasRef.current;
                const context = canvas.getContext('2d');

                canvas.width = img.width;
                canvas.height = img.height;
                context.drawImage(img, 0, 0);

                const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
                const code = jsQR(imageData.data, canvas.width, canvas.height);

                if (code) {
                    try {
                        const qrData = JSON.parse(code.data);
                        if (onScan) onScan(qrData);
                        onClose?.();
                    } catch (parseError) {
                        if (onScan) onScan({ type: 'text', data: code.data });
                        onClose?.();
                    }
                } else {
                    setError('No QR code found in the image');
                }

                URL.revokeObjectURL(imageUrl);
            };

            img.src = imageUrl;
        } catch (err) {
            setError('Error processing uploaded image');
            console.error(err);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                        <QrCode className="h-5 w-5 mr-2" />
                        Scan QR Code
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>

                {hasPermission === null && (
                    <div className="text-center py-8">
                        <Camera className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                        <p className="text-gray-600">Requesting camera permission...</p>
                    </div>
                )}

                {hasPermission === false && (
                    <div className="text-center py-8">
                        <div className="text-red-500 mb-4">
                            <X className="h-12 w-12 mx-auto" />
                        </div>
                        <p className="text-red-600 mb-4">Camera access denied or not available</p>
                        <button
                            onClick={initializeCamera}
                            className="btn-primary flex items-center mx-auto"
                        >
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Try Again
                        </button>
                    </div>
                )}

                {hasPermission === true && (
                    <div>
                        {/* Video preview */}
                        <div className="relative mb-4">
                            <video
                                ref={videoRef}
                                className="w-full h-64 bg-black rounded-lg object-cover"
                                autoPlay
                                muted
                                playsInline
                            />

                            {/* Scanning overlay */}
                            {isScanning && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-48 h-48 border-2 border-agri-green-500 rounded-lg">
                                        <div className="w-full h-full border border-white border-opacity-50 rounded-lg animate-pulse">
                                            {/* Scanning animation corners */}
                                            <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-agri-green-500"></div>
                                            <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-agri-green-500"></div>
                                            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-agri-green-500"></div>
                                            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-agri-green-500"></div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Instructions */}
                        <div className="text-center mb-4">
                            <p className="text-gray-600 text-sm">
                                {isScanning ? 'Hold camera steady and point at QR code' : 'Starting camera...'}
                            </p>
                        </div>

                        {/* Error display */}
                        {error && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                                <p className="text-red-600 text-sm">{error}</p>
                            </div>
                        )}

                        {/* Alternative upload option */}
                        <div className="border-t pt-4">
                            <p className="text-gray-600 text-sm mb-2 text-center">
                                Or upload an image with QR code:
                            </p>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleFileUpload}
                                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:bg-agri-green-50 file:text-agri-green-700 hover:file:bg-agri-green-100"
                            />
                        </div>
                    </div>
                )}

                {/* Hidden canvas for image processing */}
                <canvas ref={canvasRef} className="hidden" />

                {/* Action buttons */}
                <div className="flex space-x-3 mt-4">
                    <button
                        onClick={onClose}
                        className="btn-secondary flex-1"
                    >
                        Cancel
                    </button>
                    {hasPermission && (
                        <button
                            onClick={isScanning ? stopCamera : startScanning}
                            className="btn-primary flex-1"
                        >
                            {isScanning ? 'Stop Scanning' : 'Start Scanning'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

// Note: This component requires jsQR library
// Add this to your index.html: <script src="https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js"></script>
// Or install via npm: npm install jsqr

export default QRScanner;