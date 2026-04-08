const { ObjectId } = require("mongodb");

class GpsLocation {
    constructor(db) {
        this.collection = db.collection("gps_locations");
    }

    async recordLocation(locationData) {
        const { truckId, lat, lon, speed, heading, altitude, accuracy } = locationData;

        const location = {
            truckId,
            lat: parseFloat(lat),
            lon: parseFloat(lon),
            speed: parseFloat(speed) || 0,
            heading: parseFloat(heading) || 0,
            altitude: parseFloat(altitude) || 0,
            accuracy: parseFloat(accuracy) || 0,
            timestamp: new Date(),
            // Additional telemetry data
            engineTemp: locationData.engineTemp || null,
            fuelLevel: locationData.fuelLevel || null,
            batteryVoltage: locationData.batteryVoltage || null,
            // ESP32 specific data
            accelX: locationData.accelX || null,
            accelY: locationData.accelY || null,
            accelZ: locationData.accelZ || null,
            brakingEvent: locationData.brakingEvent || false
        };

        return await this.collection.insertOne(location);
    }

    async getLatestLocation(truckId) {
        const locations = await this.collection
            .find({ truckId })
            .sort({ timestamp: -1 })
            .limit(1)
            .toArray();

        return locations[0] || null;
    }

    async getLocationHistory(truckId, hoursBack = 24) {
        const since = new Date(Date.now() - hoursBack * 60 * 60 * 1000);

        return await this.collection
            .find({
                truckId,
                timestamp: { $gte: since }
            })
            .sort({ timestamp: -1 })
            .toArray();
    }

    async getAllActiveTrucks() {
        // Get trucks that have reported in the last hour
        const since = new Date(Date.now() - 60 * 60 * 1000);

        return await this.collection.aggregate([
            { $match: { timestamp: { $gte: since } } },
            { $sort: { timestamp: -1 } },
            {
                $group: {
                    _id: "$truckId",
                    latestLocation: { $first: "$$ROOT" }
                }
            },
            { $replaceRoot: { newRoot: "$latestLocation" } }
        ]).toArray();
    }
}

module.exports = GpsLocation;