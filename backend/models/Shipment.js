const { ObjectId } = require("mongodb");

class Shipment {
    constructor(db) {
        this.collection = db.collection("shipments");
    }

    async createShipment(shipmentData) {
        const {
            auctionId,
            farmerId,
            retailerId,
            distributorId,
            truckId,
            pickupLocation,
            deliveryLocation,
            quantity,
            estimatedDelivery
        } = shipmentData;

        const shipment = {
            auctionId: new ObjectId(auctionId),
            farmerId: new ObjectId(farmerId),
            retailerId: new ObjectId(retailerId),
            distributorId: new ObjectId(distributorId),
            truckId,
            pickupLocation: {
                address: pickupLocation.address,
                coordinates: {
                    lat: parseFloat(pickupLocation.lat),
                    lon: parseFloat(pickupLocation.lon)
                }
            },
            deliveryLocation: {
                address: deliveryLocation.address,
                coordinates: {
                    lat: parseFloat(deliveryLocation.lat),
                    lon: parseFloat(deliveryLocation.lon)
                }
            },
            quantity: parseFloat(quantity),
            status: "pending", // pending, picked_up, in_transit, delivered
            estimatedDelivery: estimatedDelivery ? new Date(estimatedDelivery) : null,
            actualDelivery: null,
            qrCode: this.generateQRCode(),
            createdAt: new Date(),
            updatedAt: new Date(),
            timeline: [{
                status: "pending",
                timestamp: new Date(),
                note: "Shipment created"
            }]
        };

        return await this.collection.insertOne(shipment);
    }

    async updateShipmentStatus(shipmentId, status, note = "") {
        const validStatuses = ["pending", "picked_up", "in_transit", "delivered"];
        if (!validStatuses.includes(status)) {
            throw new Error("Invalid shipment status");
        }

        const updateData = {
            status,
            updatedAt: new Date(),
            $push: {
                timeline: {
                    status,
                    timestamp: new Date(),
                    note
                }
            }
        };

        if (status === "delivered") {
            updateData.actualDelivery = new Date();
        }

        return await this.collection.updateOne(
            { _id: new ObjectId(shipmentId) },
            updateData
        );
    }

    async getShipmentByQR(qrCode) {
        return await this.collection.findOne({ qrCode });
    }

    async getShipmentsByTruck(truckId) {
        return await this.collection.find({
            truckId,
            status: { $in: ["picked_up", "in_transit"] }
        }).toArray();
    }

    async getShipmentsByUser(userId, role) {
        const field = `${role}Id`;
        return await this.collection.find({
            [field]: new ObjectId(userId)
        })
            .sort({ createdAt: -1 })
            .toArray();
    }

    generateQRCode() {
        return Math.random().toString(36).substring(2, 15) +
            Math.random().toString(36).substring(2, 15);
    }
}

module.exports = Shipment;