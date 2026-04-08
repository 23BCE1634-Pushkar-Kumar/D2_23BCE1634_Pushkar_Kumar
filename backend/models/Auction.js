const { ObjectId } = require("mongodb");

class Auction {
    constructor(db) {
        this.collection = db.collection("auctions");
    }

    async createAuction(auctionData) {
        const { farmerId, crop, variety, quantity, basePrice, description, harvestDate, qualityGrade } = auctionData;

        const auction = {
            farmerId: new ObjectId(farmerId),
            crop,
            variety: variety || null,
            quantity: parseFloat(quantity),
            basePrice: parseFloat(basePrice),
            currentHighestBid: parseFloat(basePrice),
            description: description || "",
            harvestDate: harvestDate ? new Date(harvestDate) : null,
            qualityGrade: qualityGrade || "A",
            bids: [],
            status: "open", // open, closed, sold
            winnerId: null,
            createdAt: new Date(),
            updatedAt: new Date(),
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from creation
        };

        return await this.collection.insertOne(auction);
    }

    async getOpenAuctions() {
        return await this.collection.find({
            status: "open",
            expiresAt: { $gt: new Date() }
        })
            .sort({ createdAt: -1 })
            .toArray();
    }

    async getAuctionById(auctionId) {
        return await this.collection.findOne({ _id: new ObjectId(auctionId) });
    }

    async placeBid(auctionId, bidData) {
        const { retailerId, bidAmount } = bidData;
        const auction = await this.getAuctionById(auctionId);

        if (!auction || auction.status !== "open") {
            throw new Error("Auction is not available for bidding");
        }

        if (bidAmount <= auction.currentHighestBid) {
            throw new Error("Bid amount must be higher than current highest bid");
        }

        const bid = {
            retailerId: new ObjectId(retailerId),
            bidAmount: parseFloat(bidAmount),
            timestamp: new Date()
        };

        return await this.collection.updateOne(
            { _id: new ObjectId(auctionId), status: "open" },
            {
                $push: { bids: bid },
                $set: {
                    currentHighestBid: parseFloat(bidAmount),
                    updatedAt: new Date()
                }
            }
        );
    }

    async closeAuction(auctionId, winnerId = null) {
        const updateData = {
            status: "closed",
            updatedAt: new Date()
        };

        if (winnerId) {
            updateData.winnerId = new ObjectId(winnerId);
            updateData.status = "sold";
        }

        return await this.collection.updateOne(
            { _id: new ObjectId(auctionId) },
            { $set: updateData }
        );
    }

    async getAuctionsByFarmer(farmerId) {
        return await this.collection.find({
            farmerId: new ObjectId(farmerId)
        })
            .sort({ createdAt: -1 })
            .toArray();
    }

    async getBidsByRetailer(retailerId) {
        return await this.collection.find({
            "bids.retailerId": new ObjectId(retailerId)
        }).toArray();
    }
}

module.exports = Auction;