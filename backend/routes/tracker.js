const express = require("express");
const { connectDB } = require("../utils/db");
const { authorizeRoles } = require("../middleware/auth");
const GpsLocation = require("../models/GpsLocation");

const router = express.Router();

// Record GPS location from ESP32 (no auth required for IoT devices)
router.post("/:truckId", async (req, res) => {
    try {
        const { lat, lon, speed_kmph, accelX, accelY, accelZ, braking_event } = req.body;
        const truckId = req.params.truckId;

        console.log(`📍 Received GPS data for ${truckId}:`, req.body);

        if (!lat || !lon) {
            return res.status(400).json({ error: "Latitude and longitude are required" });
        }

        const db = await connectDB();
        const gpsModel = new GpsLocation(db);

        // Store the location with ESP32 data format
        await gpsModel.recordLocation({
            truckId,
            lat: parseFloat(lat),
            lon: parseFloat(lon),
            speed: parseFloat(speed_kmph) || 0,
            heading: 0, // ESP32 doesn't provide heading yet
            altitude: 0,
            accuracy: 5,
            engineTemp: 85 + Math.random() * 10, // Mock engine temp
            fuelLevel: 70 + Math.random() * 20,   // Mock fuel level
            batteryVoltage: 12.0 + Math.random() * 0.8,
            // ESP32 specific data
            accelX: parseFloat(accelX) || 0,
            accelY: parseFloat(accelY) || 0,
            accelZ: parseFloat(accelZ) || 0,
            brakingEvent: braking_event === "true" || braking_event === true
        });

        res.json({
            success: true,
            message: "GPS data recorded successfully",
            truckId: truckId,
            timestamp: new Date()
        });

    } catch (error) {
        console.error("ESP32 GPS data error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Record GPS location (distributors with auth)
router.post("/:truckId/location", authorizeRoles(["distributor"]), async (req, res) => {
    try {
        const { lat, lon, speed, heading, altitude, accuracy, engineTemp, fuelLevel, batteryVoltage } = req.body;
        const truckId = req.params.truckId;

        if (!lat || !lon) {
            return res.status(400).json({ error: "Latitude and longitude are required" });
        }

        const db = await connectDB();
        const gpsModel = new GpsLocation(db);

        await gpsModel.recordLocation({
            truckId,
            lat,
            lon,
            speed,
            heading,
            altitude,
            accuracy,
            engineTemp,
            fuelLevel,
            batteryVoltage
        });

        res.json({
            success: true,
            message: "Location recorded successfully"
        });

    } catch (error) {
        console.error("Record location error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Get latest location for a truck (public access for demo)
router.get("/:truckId/latest", async (req, res) => {
    try {
        const truckId = req.params.truckId;
        const db = await connectDB();
        const gpsModel = new GpsLocation(db);

        const location = await gpsModel.getLatestLocation(truckId);

        if (!location) {
            return res.json({
                success: false,
                message: "No GPS data found for this truck",
                truckId: truckId
            });
        }

        res.json({
            success: true,
            location: location,
            truckId: truckId
        });

    } catch (error) {
        console.error("Get latest location error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Get latest location for a truck (authenticated users)
router.get("/:truckId/latest-auth", authorizeRoles(["farmer", "retailer", "distributor", "consumer"]), async (req, res) => {
    try {
        const truckId = req.params.truckId;
        const db = await connectDB();
        const gpsModel = new GpsLocation(db);

        const location = await gpsModel.getLatestLocation(truckId);

        if (!location) {
            return res.status(404).json({ error: "No location data found for this truck" });
        }

        res.json({
            success: true,
            location
        });

    } catch (error) {
        console.error("Get latest location error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Get location history for a truck (distributors and consumers)
router.get("/:truckId/history", authorizeRoles(["distributor", "consumer"]), async (req, res) => {
    try {
        const truckId = req.params.truckId;
        const hoursBack = parseInt(req.query.hours) || 24;

        const db = await connectDB();
        const gpsModel = new GpsLocation(db);

        const history = await gpsModel.getLocationHistory(truckId, hoursBack);

        res.json({
            success: true,
            history,
            count: history.length
        });

    } catch (error) {
        console.error("Get location history error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Get all active trucks (distributors only)
router.get("/active-trucks", authorizeRoles(["distributor"]), async (req, res) => {
    try {
        const db = await connectDB();
        const gpsModel = new GpsLocation(db);

        const trucks = await gpsModel.getAllActiveTrucks();

        res.json({
            success: true,
            trucks,
            count: trucks.length
        });

    } catch (error) {
        console.error("Get active trucks error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Calculate ETA for a truck (distributors and consumers)
router.get("/:truckId/eta", authorizeRoles(["distributor", "consumer"]), async (req, res) => {
    try {
        const truckId = req.params.truckId;
        const { destinationLat, destinationLon } = req.query;

        const db = await connectDB();
        const gpsModel = new GpsLocation(db);

        const latest = await gpsModel.getLatestLocation(truckId);
        if (!latest) {
            return res.status(404).json({ error: "No location data found for this truck" });
        }

        // Simple ETA calculation (in a real app, you'd use a routing service)
        const currentLat = latest.coordinates.lat;
        const currentLon = latest.coordinates.lon;
        const destLat = parseFloat(destinationLat) || currentLat;
        const destLon = parseFloat(destinationLon) || currentLon;

        // Calculate distance using Haversine formula
        const distance = calculateDistance(currentLat, currentLon, destLat, destLon);

        // Average speed (use recent speed or default)
        const avgSpeed = latest.speedKmph > 0 ? latest.speedKmph : 40; // 40 km/h default

        // ETA in minutes
        const etaMinutes = distance > 0 ? (distance / avgSpeed) * 60 : 0;

        res.json({
            success: true,
            eta: {
                minutes: Math.round(etaMinutes),
                hours: (etaMinutes / 60).toFixed(1),
                distance: distance.toFixed(2),
                currentSpeed: latest.speedKmph
            }
        });

    } catch (error) {
        console.error("Calculate ETA error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Helper function to calculate distance between two points
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

module.exports = router;