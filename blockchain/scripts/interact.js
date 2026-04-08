const hre = require("hardhat");

async function main() {
    // Load contract addresses
    const fs = require('fs');
    const contractAddresses = JSON.parse(fs.readFileSync('./contract-addresses.json', 'utf8'));

    const [farmer, retailer, distributor] = await hre.ethers.getSigners();

    console.log("🧪 Testing deployed contracts...");
    console.log("Farmer:", farmer.address);
    console.log("Retailer:", retailer.address);
    console.log("Distributor:", distributor.address);

    // Get contract instances
    const auctionContract = await hre.ethers.getContractAt("AuctionContract", contractAddresses.AuctionContract);
    const trackingContract = await hre.ethers.getContractAt("TrackingContract", contractAddresses.TrackingContract);
    const provenanceContract = await hre.ethers.getContractAt("ProvenanceContract", contractAddresses.ProvenanceContract);

    console.log("\n1. Creating an auction...");
    const createAuctionTx = await auctionContract.connect(farmer).createAuction(
        "Tomatoes",           // crop
        "Roma",               // variety
        1000,                 // quantity (kg)
        hre.ethers.parseEther("0.1"), // base price (0.1 ETH)
        "Grade A",            // quality grade
        95,                   // quality confidence (95%)
        "Fresh organic tomatoes from our farm", // description
        ["QmHash1", "QmHash2"] // image hashes
    );

    await createAuctionTx.wait();
    console.log("✅ Auction created successfully!");

    // Get the auction details
    const auction = await auctionContract.getAuction(0);
    console.log("Auction ID 0 details:", {
        crop: auction.crop,
        variety: auction.variety,
        quantity: auction.quantity.toString(),
        basePrice: hre.ethers.formatEther(auction.basePrice),
        qualityGrade: auction.qualityGrade
    });

    console.log("\n2. Placing a bid...");
    const bidTx = await auctionContract.connect(retailer).placeBid(0, {
        value: hre.ethers.parseEther("0.15")
    });
    await bidTx.wait();
    console.log("✅ Bid placed successfully!");

    const updatedAuction = await auctionContract.getAuction(0);
    console.log("Current highest bid:", hre.ethers.formatEther(updatedAuction.currentHighestBid));

    console.log("\n3. Creating provenance record...");
    const qrHash = "QR_" + Date.now();
    const createProductTx = await provenanceContract.connect(farmer).createProduct(
        0,                    // auction ID
        "Tomatoes",          // crop
        "Roma",              // variety
        1000,                // quantity
        "Grade A",           // quality grade
        95,                  // confidence
        "Farm Location XYZ", // farm location
        Math.floor(Date.now() / 1000), // harvest date
        Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60), // expiry (30 days)
        ["Organic", "Fair Trade"], // certifications
        qrHash               // QR code hash
    );
    await createProductTx.wait();
    console.log("✅ Provenance record created with QR:", qrHash);

    console.log("\n4. Creating shipment...");
    const createShipmentTx = await trackingContract.connect(distributor).createShipment(
        0,                    // auction ID
        farmer.address,       // farmer
        retailer.address,     // retailer
        "TRUCK_001",         // truck ID
        Math.floor(Date.now() / 1000) + (24 * 60 * 60), // expected delivery (24 hours)
        "Fresh tomatoes batch #1" // product details
    );
    await createShipmentTx.wait();
    console.log("✅ Shipment created successfully!");

    console.log("\n5. Updating GPS location...");
    const updateLocationTx = await trackingContract.updateLocation(
        0,                    // shipment ID
        40748817,            // latitude * 10^6 (New York)
        -73985428,           // longitude * 10^6 (New York)
        60,                  // speed (60 km/h)
        "Highway I-95",      // location description
        false,               // emergency brake
        "All good"           // additional data
    );
    await updateLocationTx.wait();
    console.log("✅ GPS location updated!");

    const latestLocation = await trackingContract.getLatestLocation(0);
    console.log("Latest location:", {
        latitude: (Number(latestLocation.latitude) / 1000000).toFixed(6),
        longitude: (Number(latestLocation.longitude) / 1000000).toFixed(6),
        speed: latestLocation.speed.toString(),
        location: latestLocation.location
    });

    console.log("\n6. Getting product by QR code...");
    const product = await provenanceContract.getProductByQR(qrHash);
    console.log("Product found:", {
        crop: product.crop,
        variety: product.variety,
        qualityGrade: product.qualityGrade,
        farmLocation: product.farmLocation
    });

    console.log("\n🎉 All tests completed successfully!");
    console.log("\n📋 Summary:");
    console.log("- Auction created and bid placed");
    console.log("- Provenance record with QR code created");
    console.log("- Shipment tracking initiated");
    console.log("- GPS location updated");
    console.log("- Product retrieved using QR code");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });