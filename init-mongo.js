// MongoDB initialization script for Docker
db = db.getSiblingDB('agriSupplyChain');

// Create collections with initial data
db.createCollection('users');
db.createCollection('auctions');
db.createCollection('gpslocations');
db.createCollection('shipments');

// Insert demo users
db.users.insertMany([
    {
        name: "Demo Farmer",
        email: "farmer@demo.com",
        password: "$2b$10$rOFl.xF8zPnIZ.3dXBSMHecJ2.7rVGh2zLv8gWpQmQZj8VGwKtOyK", // password: password
        role: "farmer",
        location: {
            address: "Punjab Farm, India",
            coordinates: [30.7333, 76.7794]
        },
        phone: "+91-98765-43210",
        createdAt: new Date(),
        updatedAt: new Date()
    },
    {
        name: "Demo Retailer",
        email: "retailer@demo.com",
        password: "$2b$10$rOFl.xF8zPnIZ.3dXBSMHecJ2.7rVGh2zLv8gWpQmQZj8VGwKtOyK", // password: password
        role: "retailer",
        location: {
            address: "Delhi Market, India",
            coordinates: [28.6139, 77.2090]
        },
        phone: "+91-87654-32109",
        createdAt: new Date(),
        updatedAt: new Date()
    },
    {
        name: "Demo Distributor",
        email: "distributor@demo.com",
        password: "$2b$10$rOFl.xF8zPnIZ.3dXBSMHecJ2.7rVGh2zLv8gWpQmQZj8VGwKtOyK", // password: password
        role: "distributor",
        location: {
            address: "Mumbai Logistics Hub, India",
            coordinates: [19.0760, 72.8777]
        },
        phone: "+91-76543-21098",
        createdAt: new Date(),
        updatedAt: new Date()
    },
    {
        name: "Demo Consumer",
        email: "consumer@demo.com",
        password: "$2b$10$rOFl.xF8zPnIZ.3dXBSMHecJ2.7rVGh2zLv8gWpQmQZj8VGwKtOyK", // password: password
        role: "consumer",
        location: {
            address: "Bangalore, India",
            coordinates: [12.9716, 77.5946]
        },
        phone: "+91-65432-10987",
        createdAt: new Date(),
        updatedAt: new Date()
    }
]);

// Create indexes for better performance
db.users.createIndex({ "email": 1 }, { unique: true });
db.auctions.createIndex({ "farmerId": 1 });
db.auctions.createIndex({ "endDate": 1 });
db.gpslocations.createIndex({ "truckId": 1, "timestamp": -1 });
db.shipments.createIndex({ "qrCode": 1 }, { unique: true });

print("Database initialized successfully with demo data!");