import React, { useState, useEffect } from 'react';
import { Download, Share2, Copy, Check } from 'lucide-react';

const QRGenerator = ({ data, size = 256, onGenerate }) => {
    const [qrCodeUrl, setQrCodeUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (data) {
            generateQRCode();
        }
    }, [data, size]);

    const generateQRCode = async () => {
        setLoading(true);
        setError(null);

        try {
            // Use QRCode library to generate QR code
            const QRCode = (await import('qrcode')).default;

            const qrOptions = {
                width: size,
                margin: 2,
                color: {
                    dark: '#000000',
                    light: '#FFFFFF'
                },
                errorCorrectionLevel: 'M'
            };

            const qrDataString = typeof data === 'string' ? data : JSON.stringify(data);
            const qrUrl = await QRCode.toDataURL(qrDataString, qrOptions);

            setQrCodeUrl(qrUrl);
            if (onGenerate) {
                onGenerate({
                    dataUrl: qrUrl,
                    data: qrDataString,
                    size
                });
            }
        } catch (err) {
            console.error('Error generating QR code:', err);
            setError('Failed to generate QR code');
        } finally {
            setLoading(false);
        }
    };

    const downloadQRCode = () => {
        if (!qrCodeUrl) return;

        const link = document.createElement('a');
        link.download = `agri-qr-${Date.now()}.png`;
        link.href = qrCodeUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const copyToClipboard = async (text) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy text:', err);
        }
    };

    const shareQRCode = async () => {
        if (!navigator.share) {
            // Fallback to copying URL
            const shareUrl = typeof data === 'object' && data.verifyUrl ? data.verifyUrl : window.location.href;
            await copyToClipboard(shareUrl);
            return;
        }

        try {
            // Convert data URL to blob
            const response = await fetch(qrCodeUrl);
            const blob = await response.blob();
            const file = new File([blob], 'agri-qr.png', { type: 'image/png' });

            const shareData = {
                title: 'Agricultural Product QR Code',
                text: 'Scan this QR code to verify product authenticity and trace its journey',
                files: [file]
            };

            if (typeof data === 'object' && data.verifyUrl) {
                shareData.url = data.verifyUrl;
            }

            await navigator.share(shareData);
        } catch (err) {
            console.error('Error sharing QR code:', err);
            // Fallback to copying URL
            const shareUrl = typeof data === 'object' && data.verifyUrl ? data.verifyUrl : window.location.href;
            await copyToClipboard(shareUrl);
        }
    };

    if (!data) {
        return (
            <div className="text-center py-8">
                <div className="w-64 h-64 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <p className="text-gray-500">No data to generate QR code</p>
                </div>
            </div>
        );
    }

    return (
        <div className="text-center">
            {/* QR Code Display */}
            <div className="mb-4">
                {loading ? (
                    <div className="w-64 h-64 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center mx-auto">
                        <div className="text-center">
                            <div className="loading-spinner mx-auto mb-2"></div>
                            <p className="text-gray-500 text-sm">Generating QR code...</p>
                        </div>
                    </div>
                ) : error ? (
                    <div className="w-64 h-64 border-2 border-red-300 rounded-lg flex items-center justify-center mx-auto bg-red-50">
                        <div className="text-center">
                            <p className="text-red-500 text-sm">{error}</p>
                            <button
                                onClick={generateQRCode}
                                className="mt-2 text-red-600 hover:text-red-800 text-sm underline"
                            >
                                Try Again
                            </button>
                        </div>
                    </div>
                ) : qrCodeUrl ? (
                    <div className="relative inline-block">
                        <img
                            src={qrCodeUrl}
                            alt="QR Code"
                            className="rounded-lg shadow-lg mx-auto"
                            style={{ width: size, height: size }}
                        />
                        {/* QR Code overlay info */}
                        {typeof data === 'object' && data.type && (
                            <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 text-white text-xs p-2 rounded-b-lg">
                                {data.type === 'agri-product' ? '🌾 Product' : '🚛 Shipment'} QR Code
                            </div>
                        )}
                    </div>
                ) : null}
            </div>

            {/* QR Code Info */}
            {typeof data === 'object' && (
                <div className="bg-gray-50 rounded-lg p-4 mb-4 text-left">
                    <h4 className="font-semibold text-gray-900 mb-2">QR Code Information</h4>
                    <div className="space-y-1 text-sm text-gray-600">
                        {data.type && (
                            <div>
                                <span className="font-medium">Type:</span> {data.type}
                            </div>
                        )}
                        {data.hash && (
                            <div>
                                <span className="font-medium">ID:</span> {data.hash.substring(0, 8)}...
                            </div>
                        )}
                        {data.timestamp && (
                            <div>
                                <span className="font-medium">Generated:</span> {new Date(data.timestamp).toLocaleString()}
                            </div>
                        )}
                        {data.verifyUrl && (
                            <div className="flex items-center justify-between">
                                <span className="font-medium">Verify URL:</span>
                                <button
                                    onClick={() => copyToClipboard(data.verifyUrl)}
                                    className="ml-2 text-agri-green-600 hover:text-agri-green-800 transition-colors"
                                    title="Copy verification URL"
                                >
                                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Action Buttons */}
            {qrCodeUrl && (
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <button
                        onClick={downloadQRCode}
                        className="btn-primary flex items-center justify-center"
                    >
                        <Download className="h-4 w-4 mr-2" />
                        Download PNG
                    </button>

                    <button
                        onClick={shareQRCode}
                        className="btn-secondary flex items-center justify-center"
                    >
                        <Share2 className="h-4 w-4 mr-2" />
                        {navigator.share ? 'Share' : 'Copy Link'}
                    </button>

                    {typeof data === 'object' && data.verifyUrl && (
                        <button
                            onClick={() => window.open(data.verifyUrl, '_blank')}
                            className="btn-secondary"
                        >
                            Test Verify
                        </button>
                    )}
                </div>
            )}

            {/* Instructions */}
            <div className="mt-6 text-sm text-gray-600">
                <p>
                    📱 <strong>For consumers:</strong> Scan this QR code with your phone camera or QR scanner app
                </p>
                <p className="mt-1">
                    🔍 <strong>For verification:</strong> Use the QR scanner in the app or visit the verification URL
                </p>
            </div>
        </div>
    );
};

export default QRGenerator;