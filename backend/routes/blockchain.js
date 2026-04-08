const express = require('express');
const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

const router = express.Router();

// Load contract addresses and ABIs
let contractAddresses = {};
let contractABIs = {};

try {
    contractAddresses = JSON.parse(
        fs.readFileSync(path.join(__dirname, '../../blockchain/contract-addresses.json'), 'utf8')
    );
} catch (error) {
    console.warn('Contract addresses not found. Run blockchain deployment first.');
}

// Load contract ABIs from artifacts
const loadContractABI = (contractName) => {
    try {
        const artifactPath = path.join(__dirname, `../../blockchain/artifacts/contracts/${contractName}.sol/${contractName}.json`);
        const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
        return artifact.abi;
    } catch (error) {
        console.warn(`ABI not found for ${contractName}`);
        return [];
    }
};

// Initialize provider and contracts
const initializeContracts = () => {
    try {
        // Use localhost Hardhat network (matching frontend RPC)
        const provider = new ethers.JsonRpcProvider(process.env.BLOCKCHAIN_RPC_URL || 'http://127.0.0.1:8545');
        const wallet = new ethers.Wallet(process.env.PRIVATE_KEY || '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80', provider);

        const contracts = {};

        if (contractAddresses.AuctionContract) {
            contracts.auction = new ethers.Contract(
                contractAddresses.AuctionContract,
                loadContractABI('AuctionContract'),
                wallet
            );
        }

        if (contractAddresses.TrackingContract) {
            contracts.tracking = new ethers.Contract(
                contractAddresses.TrackingContract,
                loadContractABI('TrackingContract'),
                wallet
            );
        }

        if (contractAddresses.ProvenanceContract) {
            contracts.provenance = new ethers.Contract(
                contractAddresses.ProvenanceContract,
                loadContractABI('ProvenanceContract'),
                wallet
            );
        }

        return { provider, wallet, contracts };
    } catch (error) {
        console.error('Failed to initialize contracts:', error);
        return { provider: null, wallet: null, contracts: {} };
    }
};

const { provider, wallet, contracts } = initializeContracts();

// Get contract addresses
router.get('/addresses', (req, res) => {
    res.json({
        success: true,
        addresses: contractAddresses,
        isConnected: provider !== null
    });
});

// Get contract ABIs
router.get('/abis', (req, res) => {
    const abis = {
        AuctionContract: loadContractABI('AuctionContract'),
        TrackingContract: loadContractABI('TrackingContract'),
        ProvenanceContract: loadContractABI('ProvenanceContract')
    };

    res.json({
        success: true,
        abis
    });
});

// AUCTION ROUTES

// Create auction on blockchain
router.post('/auction/create', async (req, res) => {
    try {
        const {
            crop,
            variety,
            quantity,
            basePrice,
            qualityGrade,
            qualityConfidence,
            description,
            imageHashes
        } = req.body;

        if (!contracts.auction) {
            return res.status(503).json({
                success: false,
                message: 'Auction contract not available'
            });
        }

        const basePriceWei = ethers.parseEther(basePrice.toString());

        const tx = await contracts.auction.createAuction(
            crop,
            variety || '',
            quantity,
            basePriceWei,
            qualityGrade || 'Ungraded',
            qualityConfidence || 0,
            description || '',
            imageHashes || []
        );

        const receipt = await tx.wait();
        const auctionCreatedEvent = receipt.logs.find(log =>
            log.topics[0] === contracts.auction.interface.getEvent('AuctionCreated').topicHash
        );

        const auctionId = ethers.toNumber(auctionCreatedEvent.topics[1]);

        res.json({
            success: true,
            auctionId,
            transactionHash: tx.hash,
            blockNumber: receipt.blockNumber
        });

    } catch (error) {
        console.error('Error creating auction on blockchain:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create auction on blockchain',
            error: error.message
        });
    }
});

// Get auction from blockchain
router.get('/auction/:id', async (req, res) => {
    try {
        const { id } = req.params;

        if (!contracts.auction) {
            return res.status(503).json({
                success: false,
                message: 'Auction contract not available'
            });
        }

        const auction = await contracts.auction.getAuction(id);

        res.json({
            success: true,
            auction: {
                id: auction.id.toString(),
                farmer: auction.farmer,
                crop: auction.crop,
                variety: auction.variety,
                quantity: auction.quantity.toString(),
                basePrice: ethers.formatEther(auction.basePrice),
                currentHighestBid: ethers.formatEther(auction.currentHighestBid),
                currentHighestBidder: auction.currentHighestBidder,
                qualityGrade: auction.qualityGrade,
                qualityConfidence: auction.qualityConfidence.toString(),
                startTime: auction.startTime.toString(),
                endTime: auction.endTime.toString(),
                isActive: auction.isActive,
                isFinalized: auction.isFinalized,
                description: auction.description,
                imageHashes: auction.imageHashes
            }
        });

    } catch (error) {
        console.error('Error fetching auction from blockchain:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch auction from blockchain',
            error: error.message
        });
    }
});

// Place bid on blockchain
router.post('/auction/:id/bid', async (req, res) => {
    try {
        const { id } = req.params; // This is MongoDB ObjectId
        const { bidAmount } = req.body;

        if (!contracts.auction) {
            return res.status(503).json({
                success: false,
                message: 'Auction contract not available'
            });
        }

        // Create a separate wallet for bidding (using localhost Hardhat)
        const provider = new ethers.JsonRpcProvider(process.env.BLOCKCHAIN_RPC_URL || 'http://127.0.0.1:8545');
        const bidderWallet = new ethers.Wallet(
            '0xdbda1821b80551c9d65939329250298aa3472ba22feea921c0cf5d620ea67b97', // Account 2 (index 2) for Hardhat - corresponds to 0x70997...c79c8
            provider
        );
        const bidderAuctionContract = new ethers.Contract(
            contractAddresses.AuctionContract,
            loadContractABI('AuctionContract'),
            bidderWallet
        );

        // Simple approach: use a fixed auction ID for testing
        // In production, you would maintain a proper mapping between MongoDB and blockchain IDs
        const blockchainAuctionId = 0; // Use the first auction for testing

        // Validate and limit bid amount (now receiving ETH tokens converted from INR)
        const bidAmountNumber = parseFloat(bidAmount);
        if (bidAmountNumber <= 0 || bidAmountNumber > 6250) { // Max 6250 ETH (₹5 lakh INR)
            return res.status(400).json({
                success: false,
                message: 'Invalid bid amount. Please bid between ₹1,000 and ₹5,00,000'
            });
        }

        if (bidAmountNumber < 12.5) { // Min 12.5 ETH (₹1,000 INR)
            return res.status(400).json({
                success: false,
                message: 'Bid amount too low. Minimum bid is ₹1,000'
            });
        }

        console.log('🔍 Blockchain Bid Details:');
        console.log('- MongoDB Auction ID:', id);
        console.log('- Blockchain Auction ID:', blockchainAuctionId);
        console.log('- Bid Amount (GO):', bidAmountNumber);
        console.log('- Bid Amount (INR):', req.body.bidAmountINR || 'Not provided');
        console.log('- Bidder Account:', bidderWallet.address);

        const bidAmountWei = ethers.parseEther(bidAmountNumber.toString());
        console.log('- Bid Amount (Wei):', bidAmountWei.toString());

        // Check bidder balance (should have enough ETH tokens)
        const bidderBalance = await provider.getBalance(bidderWallet.address);
        const requiredBalance = bidAmountWei + ethers.parseEther('1.0'); // Bid + gas buffer (1 ETH)

        if (bidderBalance < requiredBalance) {
            return res.status(400).json({
                success: false,
                message: `Insufficient balance. Need ${ethers.formatEther(requiredBalance)} ETH, have ${ethers.formatEther(bidderBalance)} ETH`
            });
        }

        const tx = await bidderAuctionContract.placeBid(blockchainAuctionId, {
            value: bidAmountWei,
            gasLimit: 300000 // Set reasonable gas limit to reduce costs
        });

        const receipt = await tx.wait();

        res.json({
            success: true,
            transactionHash: tx.hash,
            blockNumber: receipt.blockNumber
        });

    } catch (error) {
        console.error('Error placing bid on blockchain:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to place bid on blockchain',
            error: error.message
        });
    }
});

// Get active auctions
router.get('/auctions/active', async (req, res) => {
    try {
        if (!contracts.auction) {
            return res.status(503).json({
                success: false,
                message: 'Auction contract not available'
            });
        }

        const activeAuctionIds = await contracts.auction.getActiveAuctions();
        const auctions = [];

        for (const id of activeAuctionIds) {
            const auction = await contracts.auction.getAuction(id);
            auctions.push({
                id: auction.id.toString(),
                farmer: auction.farmer,
                crop: auction.crop,
                variety: auction.variety,
                quantity: auction.quantity.toString(),
                basePrice: ethers.formatEther(auction.basePrice),
                currentHighestBid: ethers.formatEther(auction.currentHighestBid),
                currentHighestBidder: auction.currentHighestBidder,
                qualityGrade: auction.qualityGrade,
                qualityConfidence: auction.qualityConfidence.toString(),
                startTime: auction.startTime.toString(),
                endTime: auction.endTime.toString(),
                isActive: auction.isActive,
                description: auction.description
            });
        }

        res.json({
            success: true,
            auctions
        });

    } catch (error) {
        console.error('Error fetching active auctions:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch active auctions',
            error: error.message
        });
    }
});

// TRACKING ROUTES

// Create shipment on blockchain
router.post('/tracking/shipment', async (req, res) => {
    try {
        const {
            auctionId,
            farmer,
            retailer,
            truckId,
            expectedDeliveryTime,
            productDetails
        } = req.body;

        if (!contracts.tracking) {
            return res.status(503).json({
                success: false,
                message: 'Tracking contract not available'
            });
        }

        const tx = await contracts.tracking.createShipment(
            auctionId,
            farmer,
            retailer,
            truckId,
            expectedDeliveryTime,
            productDetails || ''
        );

        const receipt = await tx.wait();
        const shipmentCreatedEvent = receipt.logs.find(log =>
            log.topics[0] === contracts.tracking.interface.getEvent('ShipmentCreated').topicHash
        );

        const shipmentId = ethers.toNumber(shipmentCreatedEvent.topics[1]);

        res.json({
            success: true,
            shipmentId,
            transactionHash: tx.hash,
            blockNumber: receipt.blockNumber
        });

    } catch (error) {
        console.error('Error creating shipment on blockchain:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create shipment on blockchain',
            error: error.message
        });
    }
});

// Update GPS location on blockchain
router.post('/tracking/location', async (req, res) => {
    try {
        const {
            shipmentId,
            latitude,
            longitude,
            speed,
            location,
            emergencyBrake,
            additionalData
        } = req.body;

        if (!contracts.tracking) {
            return res.status(503).json({
                success: false,
                message: 'Tracking contract not available'
            });
        }

        // Convert lat/lon to integers (multiply by 10^6 for precision)
        const latInt = Math.floor(latitude * 1000000);
        const lonInt = Math.floor(longitude * 1000000);

        const tx = await contracts.tracking.updateLocation(
            shipmentId,
            latInt,
            lonInt,
            speed || 0,
            location || '',
            emergencyBrake || false,
            additionalData || ''
        );

        const receipt = await tx.wait();

        res.json({
            success: true,
            transactionHash: tx.hash,
            blockNumber: receipt.blockNumber
        });

    } catch (error) {
        console.error('Error updating location on blockchain:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update location on blockchain',
            error: error.message
        });
    }
});

// Get shipment tracking history
router.get('/tracking/shipment/:id/history', async (req, res) => {
    try {
        const { id } = req.params;

        if (!contracts.tracking) {
            return res.status(503).json({
                success: false,
                message: 'Tracking contract not available'
            });
        }

        const history = await contracts.tracking.getTrackingHistory(id);
        const formattedHistory = history.map(location => ({
            timestamp: location.timestamp.toString(),
            latitude: Number(location.latitude) / 1000000,
            longitude: Number(location.longitude) / 1000000,
            speed: location.speed.toString(),
            location: location.location,
            emergencyBrake: location.emergencyBrake,
            additionalData: location.additionalData
        }));

        res.json({
            success: true,
            history: formattedHistory
        });

    } catch (error) {
        console.error('Error fetching tracking history:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch tracking history',
            error: error.message
        });
    }
});

// PROVENANCE ROUTES

// Create product on blockchain
router.post('/provenance/product', async (req, res) => {
    try {
        const {
            auctionId,
            crop,
            variety,
            quantity,
            qualityGrade,
            qualityConfidence,
            farmLocation,
            harvestDate,
            expiryDate,
            certifications,
            qrCodeHash
        } = req.body;

        if (!contracts.provenance) {
            return res.status(503).json({
                success: false,
                message: 'Provenance contract not available'
            });
        }

        const tx = await contracts.provenance.createProduct(
            auctionId,
            crop,
            variety || '',
            quantity,
            qualityGrade || '',
            qualityConfidence || 0,
            farmLocation || '',
            harvestDate,
            expiryDate,
            certifications || [],
            qrCodeHash
        );

        const receipt = await tx.wait();
        const productCreatedEvent = receipt.logs.find(log =>
            log.topics[0] === contracts.provenance.interface.getEvent('ProductCreated').topicHash
        );

        const productId = ethers.toNumber(productCreatedEvent.topics[1]);

        res.json({
            success: true,
            productId,
            transactionHash: tx.hash,
            blockNumber: receipt.blockNumber
        });

    } catch (error) {
        console.error('Error creating product on blockchain:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create product on blockchain',
            error: error.message
        });
    }
});

// Get product by QR code
router.get('/provenance/qr/:qrHash', async (req, res) => {
    try {
        const { qrHash } = req.params;

        if (!contracts.provenance) {
            return res.status(503).json({
                success: false,
                message: 'Provenance contract not available'
            });
        }

        const product = await contracts.provenance.getProductByQR(qrHash);
        const history = await contracts.provenance.getProductHistory(product.productId);

        const formattedHistory = history.map(stage => ({
            stage: stage.stage,
            actor: stage.actor,
            timestamp: stage.timestamp.toString(),
            location: stage.location,
            notes: stage.notes,
            evidenceHashes: stage.evidenceHashes,
            temperature: stage.temperature,
            humidity: stage.humidity
        }));

        res.json({
            success: true,
            product: {
                productId: product.productId.toString(),
                auctionId: product.auctionId.toString(),
                shipmentId: product.shipmentId.toString(),
                farmer: product.farmer,
                distributor: product.distributor,
                retailer: product.retailer,
                crop: product.crop,
                variety: product.variety,
                quantity: product.quantity.toString(),
                qualityGrade: product.qualityGrade,
                qualityConfidence: product.qualityConfidence.toString(),
                farmLocation: product.farmLocation,
                harvestDate: product.harvestDate.toString(),
                expiryDate: product.expiryDate.toString(),
                certifications: product.certifications,
                qrCodeHash: product.qrCodeHash,
                isActive: product.isActive
            },
            history: formattedHistory
        });

    } catch (error) {
        console.error('Error fetching product by QR:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch product by QR code',
            error: error.message
        });
    }
});

module.exports = router;