const QRCode = require('qrcode');
const crypto = require('crypto');

/**
 * Generate a unique QR code hash for a product
 * @param {Object} productData - Product information
 * @returns {string} - Unique QR code hash
 */
const generateQRHash = (productData) => {
    const { crop, variety, farmLocation, harvestDate, farmer } = productData;
    const timestamp = Date.now();

    const dataString = `${crop}-${variety}-${farmLocation}-${harvestDate}-${farmer}-${timestamp}`;
    return crypto.createHash('sha256').update(dataString).digest('hex');
};

/**
 * Generate QR code data URL
 * @param {string} qrHash - QR code hash
 * @param {Object} options - QR code generation options
 * @returns {Promise<string>} - QR code data URL
 */
const generateQRCode = async (qrHash, options = {}) => {
    try {
        const qrOptions = {
            width: options.width || 256,
            margin: options.margin || 2,
            color: {
                dark: options.darkColor || '#000000',
                light: options.lightColor || '#FFFFFF'
            },
            errorCorrectionLevel: options.errorLevel || 'M'
        };

        // Create QR data with product verification URL
        const qrData = {
            type: 'agri-product',
            hash: qrHash,
            verifyUrl: `${process.env.FRONTEND_URL}/verify/${qrHash}`,
            timestamp: Date.now()
        };

        const qrDataString = JSON.stringify(qrData);
        const qrCodeDataURL = await QRCode.toDataURL(qrDataString, qrOptions);

        return qrCodeDataURL;
    } catch (error) {
        console.error('Error generating QR code:', error);
        throw new Error('Failed to generate QR code');
    }
};

/**
 * Generate QR code as buffer
 * @param {string} qrHash - QR code hash
 * @param {Object} options - QR code generation options
 * @returns {Promise<Buffer>} - QR code buffer
 */
const generateQRBuffer = async (qrHash, options = {}) => {
    try {
        const qrOptions = {
            width: options.width || 256,
            margin: options.margin || 2,
            color: {
                dark: options.darkColor || '#000000',
                light: options.lightColor || '#FFFFFF'
            },
            errorCorrectionLevel: options.errorLevel || 'M'
        };

        const qrData = {
            type: 'agri-product',
            hash: qrHash,
            verifyUrl: `${process.env.FRONTEND_URL}/verify/${qrHash}`,
            timestamp: Date.now()
        };

        const qrDataString = JSON.stringify(qrData);
        const qrCodeBuffer = await QRCode.toBuffer(qrDataString, qrOptions);

        return qrCodeBuffer;
    } catch (error) {
        console.error('Error generating QR code buffer:', error);
        throw new Error('Failed to generate QR code buffer');
    }
};

/**
 * Parse QR code data
 * @param {string} qrDataString - QR code data string
 * @returns {Object} - Parsed QR data
 */
const parseQRData = (qrDataString) => {
    try {
        const qrData = JSON.parse(qrDataString);

        if (qrData.type !== 'agri-product') {
            throw new Error('Invalid QR code type');
        }

        return qrData;
    } catch (error) {
        console.error('Error parsing QR data:', error);
        throw new Error('Invalid QR code data');
    }
};

/**
 * Generate product traceability URL
 * @param {string} qrHash - QR code hash
 * @returns {string} - Traceability URL
 */
const generateTraceabilityURL = (qrHash) => {
    return `${process.env.FRONTEND_URL}/trace/${qrHash}`;
};

/**
 * Create QR code for shipment tracking
 * @param {Object} shipmentData - Shipment information
 * @returns {Promise<Object>} - QR code data and image
 */
const generateShipmentQR = async (shipmentData) => {
    const { shipmentId, truckId, auctionId } = shipmentData;

    const qrData = {
        type: 'agri-shipment',
        shipmentId,
        truckId,
        auctionId,
        trackUrl: `${process.env.FRONTEND_URL}/track/${shipmentId}`,
        timestamp: Date.now()
    };

    const qrDataString = JSON.stringify(qrData);
    const qrCodeDataURL = await QRCode.toDataURL(qrDataString);

    return {
        qrData,
        qrCodeDataURL,
        trackingUrl: qrData.trackUrl
    };
};

module.exports = {
    generateQRHash,
    generateQRCode,
    generateQRBuffer,
    parseQRData,
    generateTraceabilityURL,
    generateShipmentQR
};