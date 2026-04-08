const { ethers } = require("hardhat");

async function main() {
    // Get contract addresses
    const contractAddresses = require('../contract-addresses.json');
    console.log('📋 Contract Addresses:', contractAddresses);

    // Get signer (farmer account)
    const [farmer] = await ethers.getSigners();
    console.log('👨‍🌾 Farmer address:', farmer.address);

    // Connect to AuctionContract
    const AuctionContract = await ethers.getContractFactory("AuctionContract");
    const auction = AuctionContract.attach(contractAddresses.AuctionContract);

    // Check current auction count
    const currentCount = await auction.getTotalAuctions();
    console.log('📊 Current blockchain auctions:', currentCount.toString());

    if (currentCount == 0) {
        console.log('🚀 Creating test blockchain auction...');

        // Create a test auction
        const tx = await auction.createAuction(
            "Rice",                           // crop
            "Basmati",                       // variety  
            1000,                            // quantity (kg)
            ethers.parseEther("0.5"),        // basePrice (0.5 ETH)
            "Grade A",                       // qualityGrade
            95,                              // qualityConfidence
            "Premium quality Basmati rice", // description
            []                               // imageHashes
        );

        console.log('⏳ Waiting for transaction confirmation...');
        const receipt = await tx.wait();
        console.log('✅ Transaction confirmed!');
        console.log('📄 Transaction hash:', tx.hash);

        // Get the created auction details
        const newCount = await auction.getTotalAuctions();
        console.log('📈 New auction count:', newCount.toString());

        // Get auction details
        const auctionData = await auction.auctions(0);
        console.log('🎯 Created Auction Details:');
        console.log('  - ID: 0');
        console.log('  - Farmer:', auctionData.farmer);
        console.log('  - Crop:', auctionData.crop);
        console.log('  - Quantity:', auctionData.quantity.toString(), 'kg');
        console.log('  - Base Price:', ethers.formatEther(auctionData.basePrice), 'ETH');
        console.log('  - Current Highest Bid:', ethers.formatEther(auctionData.currentHighestBid), 'ETH');
        console.log('  - Active:', auctionData.isActive);
        console.log('  - End Time:', new Date(Number(auctionData.endTime) * 1000).toLocaleString());

    } else {
        console.log('✅ Blockchain auctions already exist!');

        // Show existing auctions
        for (let i = 0; i < currentCount; i++) {
            const auctionData = await auction.auctions(i);
            console.log(`🎯 Auction ${i}:`);
            console.log('  - Crop:', auctionData.crop);
            console.log('  - Base Price:', ethers.formatEther(auctionData.basePrice), 'ETH');
            console.log('  - Active:', auctionData.isActive);
        }
    }

    console.log('\n🎉 Blockchain is ready for bidding!');
    console.log('💡 Now you can test blockchain bidding in the retailer UI');
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('❌ Error:', error);
        process.exit(1);
    });