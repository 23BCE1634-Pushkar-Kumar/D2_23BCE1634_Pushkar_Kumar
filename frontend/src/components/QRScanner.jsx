import React, { useState, useRef, useEffect } from 'react';
import { QrCode, Camera, X } from 'lucide-react';

const QRScanner = ({ onScan, onCancel }) => {
    const [isScanning, setIsScanning] = useState(false);
    const [manualInput, setManualInput] = useState('');
    const [error, setError] = useState('');
    const videoRef = useRef(null);
    const streamRef = useRef(null);

    useEffect(() => {
        return () => {
            stopCamera();
        };
    }, []);

    const startCamera = async () => {
        try {
            setError('');
            setIsScanning(true);

            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'environment', // Use back camera if available
                    width: { ideal: 640 },
                    height: { ideal: 480 }
                }
            });

            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (err) {
            setError('Camera access denied or not available');
            setIsScanning(false);
        }
    };

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        setIsScanning(false);
    };

    const handleManualSubmit = (e) => {
        e.preventDefault();
        if (manualInput.trim()) {
            onScan(manualInput.trim());
        }
    };

    // Mock QR scan simulation (replace with actual QR scanner library)
    const simulateQRScan = (qrData) => {
        onScan(qrData);
        stopCamera();
    };

    return (
        <div className="card max-w-md mx-auto">
            <div className="card-header">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <QrCode className="h-5 w-5 mr-2" />
                    QR Code Scanner
                </h3>
                {onCancel && (
                    <button
                        onClick={onCancel}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <X className="h-5 w-5" />
                    </button>
                )}
            </div>

            <div className="space-y-4">
                {/* Camera Scanner */}
                {!isScanning ? (
                    <div className="text-center">
                        <div className="bg-gray-100 rounded-lg p-8 mb-4">
                            <QrCode className="h-16 w-16 mx-auto text-gray-400 mb-2" />
                            <p className="text-gray-600">Scan QR code to track your product</p>
                        </div>

                        <button
                            onClick={startCamera}
                            className="btn-primary flex items-center justify-center w-full"
                        >
                            <Camera className="h-4 w-4 mr-2" />
                            Start Camera Scanner
                        </button>
                    </div>
                ) : (
                    <div className="relative">
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            className="w-full h-64 bg-black rounded-lg"
                        />

                        {/* Scanning overlay */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="border-2 border-agri-green-500 w-48 h-48 rounded-lg bg-transparent relative">
                                <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-agri-green-500 rounded-tl-lg"></div>
                                <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-agri-green-500 rounded-tr-lg"></div>
                                <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-agri-green-500 rounded-bl-lg"></div>
                                <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-agri-green-500 rounded-br-lg"></div>
                            </div>
                        </div>

                        <button
                            onClick={stopCamera}
                            className="absolute top-2 right-2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70"
                        >
                            <X className="h-4 w-4" />
                        </button>

                        <div className="mt-4 text-center">
                            <p className="text-sm text-gray-600 mb-2">
                                Position the QR code within the frame
                            </p>

                            {/* Demo buttons for testing */}
                            <div className="space-y-2">
                                <p className="text-xs text-gray-500">Demo QR codes:</p>
                                <div className="flex space-x-2 justify-center">
                                    <button
                                        onClick={() => simulateQRScan('SHIP001')}
                                        className="px-3 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded"
                                    >
                                        SHIP001
                                    </button>
                                    <button
                                        onClick={() => simulateQRScan('SHIP002')}
                                        className="px-3 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded"
                                    >
                                        SHIP002
                                    </button>
                                    <button
                                        onClick={() => simulateQRScan('CROP123')}
                                        className="px-3 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded"
                                    >
                                        CROP123
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                        {error}
                    </div>
                )}

                {/* Manual Input Alternative */}
                <div className="border-t pt-4">
                    <h4 className="font-medium text-gray-900 mb-2">Manual Entry</h4>
                    <form onSubmit={handleManualSubmit} className="flex space-x-2">
                        <input
                            type="text"
                            placeholder="Enter QR code manually"
                            value={manualInput}
                            onChange={(e) => setManualInput(e.target.value)}
                            className="flex-1 form-input text-sm"
                        />
                        <button
                            type="submit"
                            className="btn-primary text-sm px-4 py-2"
                        >
                            Scan
                        </button>
                    </form>

                    <div className="mt-2 text-xs text-gray-500">
                        Example codes: SHIP001, SHIP002, CROP123
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QRScanner;