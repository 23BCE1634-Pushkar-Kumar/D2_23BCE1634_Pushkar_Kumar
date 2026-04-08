const { ethers } = require('hardhat');

async function main() {
    console.log('💰 Funding bidder account with ETH...');

    // Get accounts
    const [farmer, retailer] = await ethers.getSigners();

    console.log('👨‍🌾 Farmer (Account 0):', farmer.address);
    console.log('🛒 Retailer (Account 1):', retailer.address);

    // Check initial balances
    const farmerBalance = await ethers.provider.getBalance(farmer.address);
    const retailerBalance = await ethers.provider.getBalance(retailer.address);

    console.log('\n💳 Initial Balances:');
    console.log('Farmer:', ethers.formatEther(farmerBalance), 'ETH');
    console.log('Retailer:', ethers.formatEther(retailerBalance), 'ETH');

    // Transfer 10 ETH from farmer to retailer
    const transferAmount = ethers.parseEther('10.0');
    console.log('\n⚡ Transferring 10 ETH to retailer...');

    const tx = await farmer.sendTransaction({
        to: retailer.address,
        value: transferAmount
    });

    console.log('⏳ Waiting for transaction...');
    await tx.wait();
    console.log('✅ Transfer complete!');
    console.log('📄 Transaction hash:', tx.hash);

    // Check final balances
    const newFarmerBalance = await ethers.provider.getBalance(farmer.address);
    const newRetailerBalance = await ethers.provider.getBalance(retailer.address);

    console.log('\n💰 Final Balances:');
    console.log('Farmer:', ethers.formatEther(newFarmerBalance), 'ETH');
    console.log('Retailer:', ethers.formatEther(newRetailerBalance), 'ETH');

    console.log('\n🎉 Retailer account is now funded and ready for bidding!');
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('❌ Error:', error);
        process.exit(1);
    });