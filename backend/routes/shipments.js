const express = require("express");
const { connectDB } = require("../utils/db");
const { authorizeRoles } = require("../middleware/auth");
const Shipment = require("../models/Shipment");

const router = express.Router();

// Create new shipment (distributors)
router.post("/create", authorizeRoles(["distributor"]), async (req, res) => {
    try {
        const {
            auctionId,
            farmerId,
            retailerId,
            truckId,
            pickupLocation,
            deliveryLocation,
            quantity,
            estimatedDelivery
        } = req.body;

        if (!auctionId || !farmerId || !retailerId || !truckId || !pickupLocation || !deliveryLocation) {
            return res.status(400).json({ error: "Missing required shipment information" });
        }

        const db = await connectDB();
        const shipmentModel = new Shipment(db);

        const result = await shipmentModel.createShipment({
            auctionId,
            farmerId,
            retailerId,
            distributorId: req.user.id,
            truckId,
            pickupLocation,
            deliveryLocation,
            quantity,
            estimatedDelivery
        });

        res.status(201).json({
            success: true,
            message: "Shipment created successfully",
            shipmentId: result.insertedId
        });

    } catch (error) {
        console.error("Create shipment error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Update shipment status (distributors)
router.put("/:shipmentId/status", authorizeRoles(["distributor"]), async (req, res) => {
    try {
        const { status, note } = req.body;
        const shipmentId = req.params.shipmentId;

        const db = await connectDB();
        const shipmentModel = new Shipment(db);

        await shipmentModel.updateShipmentStatus(shipmentId, status, note);

        res.json({
            success: true,
            message: "Shipment status updated successfully"
        });

    } catch (error) {
        console.error("Update shipment status error:", error);
        res.status(400).json({ error: error.message || "Internal server error" });
    }
});

// Get shipment by QR code (consumers)
router.get("/qr/:qrCode", authorizeRoles(["consumer"]), async (req, res) => {
    try {
        const qrCode = req.params.qrCode;
        const db = await connectDB();
        const shipmentModel = new Shipment(db);

        const shipment = await shipmentModel.getShipmentByQR(qrCode);
        if (!shipment) {
            return res.status(404).json({ error: "Shipment not found" });
        }

        res.json({
            success: true,
            shipment
        });

    } catch (error) {
        console.error("Get shipment by QR error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Get shipments by truck (distributors)
router.get("/truck/:truckId", authorizeRoles(["distributor"]), async (req, res) => {
    try {
        const truckId = req.params.truckId;
        const db = await connectDB();
        const shipmentModel = new Shipment(db);

        const shipments = await shipmentModel.getShipmentsByTruck(truckId);

        res.json({
            success: true,
            shipments
        });

    } catch (error) {
        console.error("Get shipments by truck error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Get user's shipments (all roles)
router.get("/my-shipments", authorizeRoles(["farmer", "retailer", "distributor", "consumer"]), async (req, res) => {
    try {
        const db = await connectDB();
        const shipmentModel = new Shipment(db);

        const shipments = await shipmentModel.getShipmentsByUser(req.user.id, req.user.role);

        res.json({
            success: true,
            shipments
        });

    } catch (error) {
        console.error("Get user shipments error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

module.exports = router;