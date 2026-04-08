const express = require("express");
const { connectDB } = require("../utils/db");
const { authorizeRoles } = require("../middleware/auth");
const Auction = require("../models/Auction");
const multer = require("multer");
const FormData = require("form-data");
const fetch = require("node-fetch");

const router = express.Router();

// Configure multer for file upload
const upload = multer({
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB per file
        files: 10
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'));
        }
    }
});

// Classify crop images using Roboflow API
async function classifyImage(imageBuffer) {
    try {
        const formData = new FormData();
        formData.append('file', imageBuffer, 'crop.jpg');

        const response = await fetch('https://classify.roboflow.com/wheat-gnjlr/1?api_key=kddP4hNUe9zxVsXEsib1', {
            method: 'POST',
            body: formData,
            headers: formData.getHeaders()
        });

        if (!response.ok) {
            throw new Error(`API request failed: ${response.status}`);
        }

        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Image classification error:', error);
        throw error;
    }
}

// Determine final quality using majority voting
function determineFinalQuality(predictions) {
    if (!predictions || predictions.length === 0) {
        return { quality: 'Unknown', confidence: 0 };
    }

    // Count occurrences of each class
    const classCount = {};
    let totalConfidence = 0;

    predictions.forEach(pred => {
        if (pred.top) {
            classCount[pred.top] = (classCount[pred.top] || 0) + 1;
            totalConfidence += pred.confidence || 0;
        }
    });

    // Find the most frequent class
    let maxCount = 0;
    let finalQuality = 'Unknown';

    Object.entries(classCount).forEach(([className, count]) => {
        if (count > maxCount) {
            maxCount = count;
            finalQuality = className;
        }
    });

    const averageConfidence = totalConfidence / predictions.length;

    return {
        quality: finalQuality,
        confidence: averageConfidence,
        predictions: classCount
    };
}

// Classify crop images and return quality prediction
router.post("/classify-images", authorizeRoles(["farmer"]), upload.array('images', 10), async (req, res) => {
    try {
        const files = req.files;

        if (!files || files.length < 10) {
            return res.status(400).json({
                error: "At least 10 images are required for quality assessment"
            });
        }

        const predictions = [];

        // Process each image
        for (let i = 0; i < files.length; i++) {
            try {
                const prediction = await classifyImage(files[i].buffer);
                predictions.push(prediction);
            } catch (error) {
                console.error(`Error processing image ${i + 1}:`, error);
                // Continue processing other images
            }
        }

        if (predictions.length === 0) {
            return res.status(500).json({
                error: "Failed to process any images"
            });
        }

        const finalQuality = determineFinalQuality(predictions);

        res.json({
            success: true,
            processedImages: predictions.length,
            totalImages: files.length,
            finalQuality: finalQuality.quality,
            confidence: finalQuality.confidence,
            predictions: finalQuality.predictions,
            allPredictions: predictions
        });

    } catch (error) {
        console.error("Image classification error:", error);
        res.status(500).json({ error: "Failed to classify images" });
    }
});

// Create new auction (farmers only)
router.post("/create", authorizeRoles(["farmer"]), async (req, res) => {
    try {
        const { crop, variety, quantity, basePrice, description, harvestDate, qualityGrade, qualityConfidence, predictions } = req.body;

        if (!crop || !quantity || !basePrice) {
            return res.status(400).json({ error: "Crop, quantity, and base price are required" });
        }

        if (!qualityGrade) {
            return res.status(400).json({ error: "Quality grade is required. Please upload images for quality assessment." });
        }

        const db = await connectDB();
        const auctionModel = new Auction(db);

        const result = await auctionModel.createAuction({
            farmerId: req.user.id,
            crop,
            variety,
            quantity,
            basePrice,
            description,
            harvestDate,
            qualityGrade,
            qualityConfidence: qualityConfidence || null,
            qualityPredictions: predictions || null,
            createdAt: new Date()
        });

        res.status(201).json({
            success: true,
            message: "Auction created successfully",
            auctionId: result.insertedId
        });

    } catch (error) {
        console.error("Create auction error:", error);
        res.status(500).json({ error: error.message || "Internal server error" });
    }
});

// Get all open auctions (retailers and farmers)
router.get("/open", authorizeRoles(["retailer", "farmer"]), async (req, res) => {
    try {
        const db = await connectDB();
        const auctionModel = new Auction(db);

        const auctions = await auctionModel.getOpenAuctions();

        res.json({
            success: true,
            auctions
        });

    } catch (error) {
        console.error("Get open auctions error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Get auction by ID
router.get("/:auctionId", authorizeRoles(["farmer", "retailer"]), async (req, res) => {
    try {
        const db = await connectDB();
        const auctionModel = new Auction(db);

        const auction = await auctionModel.getAuctionById(req.params.auctionId);
        if (!auction) {
            return res.status(404).json({ error: "Auction not found" });
        }

        res.json({
            success: true,
            auction
        });

    } catch (error) {
        console.error("Get auction error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Place bid on auction (retailers only)
router.post("/:auctionId/bid", authorizeRoles(["retailer"]), async (req, res) => {
    try {
        const { bidAmount } = req.body;
        const auctionId = req.params.auctionId;

        if (!bidAmount || bidAmount <= 0) {
            return res.status(400).json({ error: "Valid bid amount is required" });
        }

        const db = await connectDB();
        const auctionModel = new Auction(db);

        await auctionModel.placeBid(auctionId, {
            retailerId: req.user.id,
            bidAmount
        });

        res.json({
            success: true,
            message: "Bid placed successfully"
        });

    } catch (error) {
        console.error("Place bid error:", error);
        res.status(400).json({ error: error.message || "Internal server error" });
    }
});

// Get farmer's auctions
router.get("/farmer/my-auctions", authorizeRoles(["farmer"]), async (req, res) => {
    try {
        const db = await connectDB();
        const auctionModel = new Auction(db);

        const auctions = await auctionModel.getAuctionsByFarmer(req.user.id);

        res.json({
            success: true,
            auctions
        });

    } catch (error) {
        console.error("Get farmer auctions error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Get retailer's bids
router.get("/retailer/my-bids", authorizeRoles(["retailer"]), async (req, res) => {
    try {
        const db = await connectDB();
        const auctionModel = new Auction(db);

        const auctions = await auctionModel.getBidsByRetailer(req.user.id);

        res.json({
            success: true,
            auctions
        });

    } catch (error) {
        console.error("Get retailer bids error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Close auction (farmers only - for their own auctions)
router.put("/:auctionId/close", authorizeRoles(["farmer"]), async (req, res) => {
    try {
        const { winnerId } = req.body;
        const auctionId = req.params.auctionId;

        const db = await connectDB();
        const auctionModel = new Auction(db);

        // Verify auction belongs to the farmer
        const auction = await auctionModel.getAuctionById(auctionId);
        if (!auction || auction.farmerId.toString() !== req.user.id) {
            return res.status(403).json({ error: "You can only close your own auctions" });
        }

        await auctionModel.closeAuction(auctionId, winnerId);

        res.json({
            success: true,
            message: winnerId ? "Auction sold successfully" : "Auction closed successfully"
        });

    } catch (error) {
        console.error("Close auction error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

module.exports = router;