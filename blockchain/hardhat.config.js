require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
    solidity: {
        version: "0.8.20",
        settings: {
            optimizer: {
                enabled: true,
                runs: 200
            },
            viaIR: true
        }
    },
    networks: {
        hardhat: {
            chainId: 31337,
            mining: {
                auto: false,
                interval: [3000, 6000]
            }
        },
        localhost: {
            url: "http://127.0.0.1:8545",
            chainId: 31337
        },
        polygon_mumbai: {
            url: "https://rpc-mumbai.maticvigil.com",
            chainId: 80001,
            accounts: [
                "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80", // Account 0
                "0x59c6995e998f97e5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d"  // Account 1 - Correct from Hardhat
            ],
            gasPrice: 2000000000, // 2 Gwei - very affordable
            timeout: 60000
        }
    },
    paths: {
        sources: "./contracts",
        tests: "./test",
        cache: "./cache",
        artifacts: "./artifacts"
    }
};