const hre = require("hardhat");

async function main() {
    const [deployer] = await hre.ethers.getSigners();

    console.log("Deploying contracts with the account:", deployer.address);
    console.log("Account balance:", (await deployer.provider.getBalance(deployer.address)).toString());

    // Deploy AuctionContract
    console.log("\nDeploying AuctionContract...");
    const AuctionContract = await hre.ethers.getContractFactory("AuctionContract");
    const auctionContract = await AuctionContract.deploy();
    await auctionContract.waitForDeployment();
    console.log("AuctionContract deployed to:", await auctionContract.getAddress());

    // Deploy TrackingContract
    console.log("\nDeploying TrackingContract...");
    const TrackingContract = await hre.ethers.getContractFactory("TrackingContract");
    const trackingContract = await TrackingContract.deploy();
    await trackingContract.waitForDeployment();
    console.log("TrackingContract deployed to:", await trackingContract.getAddress());

    // Deploy ProvenanceContract
    console.log("\nDeploying ProvenanceContract...");
    const ProvenanceContract = await hre.ethers.getContractFactory("ProvenanceContract");
    const provenanceContract = await ProvenanceContract.deploy();
    await provenanceContract.waitForDeployment();
    console.log("ProvenanceContract deployed to:", await provenanceContract.getAddress());

    // Save contract addresses to a file
    const fs = require('fs');
    const contractAddresses = {
        AuctionContract: await auctionContract.getAddress(),
        TrackingContract: await trackingContract.getAddress(),
        ProvenanceContract: await provenanceContract.getAddress(),
        network: hre.network.name,
        deployedAt: new Date().toISOString()
    };

    fs.writeFileSync(
        './contract-addresses.json',
        JSON.stringify(contractAddresses, null, 2)
    );

    console.log("\n🎉 All contracts deployed successfully!");
    console.log("Contract addresses saved to contract-addresses.json");

    // Verification instructions for testnets
    if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
        console.log("\n📝 Verify contracts on Etherscan:");
        console.log(`npx hardhat verify --network ${hre.network.name} ${await auctionContract.getAddress()}`);
        console.log(`npx hardhat verify --network ${hre.network.name} ${await trackingContract.getAddress()}`);
        console.log(`npx hardhat verify --network ${hre.network.name} ${await provenanceContract.getAddress()}`);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });