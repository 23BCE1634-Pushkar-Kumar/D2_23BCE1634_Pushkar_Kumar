const express = require("express");
const cors = require("cors");
const path = require("path");

// Load environment variables
require("dotenv").config();

// Import routes
const authRoutes = require("./routes/auth");
const auctionRoutes = require("./routes/auctions");
const trackerRoutes = require("./routes/tracker");
const shipmentRoutes = require("./routes/shipments");
const weatherRoutes = require("./routes/weather");
const classificationRoutes = require("./routes/classification");
const blockchainRoutes = require("./routes/blockchain");

const app = express();

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true
}));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Request logging middleware (simplified for serverless)
app.use((req, res, next) => {
    if (process.env.NODE_ENV !== 'production') {
        console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    }
    next();
});

// Health check endpoint
app.get("/health", (req, res) => {
    res.json({
        status: "healthy",
        timestamp: new Date(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || "development",
        mongodb: process.env.MONGO_URI ? "configured" : "missing"
    });
});

// Simple test endpoint
app.get("/api/test", (req, res) => {
    res.json({
        message: "API is working correctly!",
        timestamp: new Date(),
        environment: process.env.NODE_ENV || "development"
    });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/auctions", auctionRoutes);
app.use("/api/tracker", trackerRoutes);
app.use("/api/shipments", shipmentRoutes);
app.use("/api/weather", weatherRoutes);
app.use("/api", classificationRoutes);
app.use("/api/blockchain", blockchainRoutes);

// API documentation route
app.get("/api", (req, res) => {
    res.json({
        message: "Agri Supply Chain API",
        version: "1.0.0",
        endpoints: {
            auth: {
                "POST /api/auth/register": "Register new user",
                "POST /api/auth/login": "User login",
                "GET /api/auth/profile": "Get user profile",
                "PUT /api/auth/profile": "Update user profile",
                "GET /api/auth/verify": "Verify token"
            },
            auctions: {
                "POST /api/auctions/create": "Create new auction (farmer)",
                "GET /api/auctions/open": "Get open auctions",
                "GET /api/auctions/:id": "Get auction by ID",
                "POST /api/auctions/:id/bid": "Place bid (retailer)",
                "GET /api/auctions/farmer/my-auctions": "Get farmer's auctions",
                "GET /api/auctions/retailer/my-bids": "Get retailer's bids",
                "PUT /api/auctions/:id/close": "Close auction (farmer)"
            },
            tracker: {
                "POST /api/tracker/:truckId/location": "Record GPS location",
                "GET /api/tracker/:truckId/latest": "Get latest location",
                "GET /api/tracker/:truckId/history": "Get location history",
                "GET /api/tracker/active-trucks": "Get all active trucks",
                "GET /api/tracker/:truckId/eta": "Calculate ETA"
            },
            shipments: {
                "POST /api/shipments/create": "Create shipment",
                "PUT /api/shipments/:id/status": "Update shipment status",
                "GET /api/shipments/qr/:qrCode": "Get shipment by QR code",
                "GET /api/shipments/truck/:truckId": "Get shipments by truck",
                "GET /api/shipments/my-shipments": "Get user's shipments"
            },
            weather: {
                "GET /api/weather/current": "Get current weather",
                "GET /api/weather/crop-advice": "Get crop-specific weather advice"
            },
            classification: {
                "POST /api/classify-single-image": "Classify single crop image",
                "POST /api/classify-images": "Classify multiple crop images (bulk)"
            }
        }
    });
});

// 404 handler for API routes
app.use("/api/*", (req, res) => {
    res.status(404).json({
        error: "API endpoint not found",
        path: req.path,
        method: req.method
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error("Global error handler:", err);

    res.status(err.status || 500).json({
        error: err.message || "Internal server error",
        timestamp: new Date(),
        path: req.path
    });
});

// Start server (only for local development)
const PORT = process.env.PORT || 5001;

// Only start server if not in Vercel serverless environment
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
    app.listen(PORT, () => {
        console.log(`
🌾 Agri Supply Chain Server Started
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📍 Port: ${PORT}
🌐 Environment: ${process.env.NODE_ENV || 'development'}
🔗 API Documentation: http://localhost:${PORT}/api
🏥 Health Check: http://localhost:${PORT}/health
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `);
    });
}

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Gracefully shutting down server...');
    process.exit(0);
});

process.on('unhandledRejection', (err) => {
    console.error('Unhandled Promise Rejection:', err);
    process.exit(1);
});

module.exports = app;