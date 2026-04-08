const { MongoClient } = require("mongodb");

class DatabaseConnection {
    constructor() {
        this.client = null;
        this.db = null;
    }

    async connect() {
        if (!this.db) {
            try {
                if (!process.env.MONGO_URI) {
                    throw new Error("MONGO_URI environment variable is not set");
                }

                this.client = new MongoClient(process.env.MONGO_URI, {
                    maxPoolSize: 1, // Limit to 1 connection for serverless
                    serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
                    socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
                });

                await this.client.connect();
                this.db = this.client.db("agriSupplyChain");

                if (process.env.NODE_ENV !== 'production') {
                    console.log("Connected to MongoDB successfully");
                }
            } catch (error) {
                console.error("MongoDB connection error:", error.message);
                throw error;
            }
        }
        return this.db;
    }

    async disconnect() {
        if (this.client) {
            await this.client.close();
            if (process.env.NODE_ENV !== 'production') {
                console.log("Disconnected from MongoDB");
            }
        }
    }
}

const dbConnection = new DatabaseConnection();

async function connectDB() {
    return await dbConnection.connect();
}

module.exports = { connectDB, dbConnection };