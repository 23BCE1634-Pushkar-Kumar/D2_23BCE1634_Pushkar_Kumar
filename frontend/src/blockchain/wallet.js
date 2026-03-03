import { ethers } from 'ethers';

// Wallet connection state
let provider = null;
let signer = null;
let isConnected = false;
let userAddress = null;

// Contract addresses and ABIs (will be loaded from API)
let contractAddresses = {};
let contractABIs = {};

/**
 * Initialize Web3 provider (MetaMask or similar)
 */
export const initializeProvider = async () => {
    if (typeof window.ethereum !== 'undefined') {
        provider = new ethers.BrowserProvider(window.ethereum);
        return provider;
    } else {
        throw new Error('MetaMask or similar wallet is not installed');
    }
};

/**
 * Connect to wallet (MetaMask)
 */
export const connectWallet = async () => {
    try {
        if (!provider) {
            await initializeProvider();
        }

        // Request account access
        await provider.send('eth_requestAccounts', []);
        signer = await provider.getSigner();
        userAddress = await signer.getAddress();
        isConnected = true;

        // Listen for account changes
        window.ethereum.on('accountsChanged', handleAccountsChanged);
        window.ethereum.on('chainChanged', handleChainChanged);

        return {
            address: userAddress,
            provider,
            signer
        };
    } catch (error) {
        console.error('Failed to connect wallet:', error);
        throw error;
    }
};

/**
 * Disconnect wallet
 */
export const disconnectWallet = () => {
    provider = null;
    signer = null;
    isConnected = false;
    userAddress = null;

    if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
    }
};

/**
 * Get current wallet connection status
 */
export const getWalletInfo = () => {
    return {
        isConnected,
        address: userAddress,
        provider,
        signer
    };
};

/**
 * Handle account changes
 */
const handleAccountsChanged = async (accounts) => {
    if (accounts.length === 0) {
        disconnectWallet();
        window.dispatchEvent(new CustomEvent('walletDisconnected'));
    } else {
        userAddress = accounts[0];
        if (signer) {
            signer = await provider.getSigner();
        }
        window.dispatchEvent(new CustomEvent('walletAccountChanged', {
            detail: { address: userAddress }
        }));
    }
};

/**
 * Handle chain changes
 */
const handleChainChanged = (chainId) => {
    // Reload the page as recommended by MetaMask
    window.location.reload();
};

/**
 * Load contract addresses and ABIs from backend
 */
export const loadContractData = async () => {
    try {
        // Load contract addresses
        const addressResponse = await fetch('/api/blockchain/addresses');
        const addressData = await addressResponse.json();
        if (addressData.success) {
            contractAddresses = addressData.addresses;
        }

        // Load contract ABIs
        const abiResponse = await fetch('/api/blockchain/abis');
        const abiData = await abiResponse.json();
        if (abiData.success) {
            contractABIs = abiData.abis;
        }

        return { contractAddresses, contractABIs };
    } catch (error) {
        console.error('Failed to load contract data:', error);
        throw error;
    }
};

/**
 * Get contract instance
 */
export const getContract = (contractName) => {
    try {
        if (!signer) {
            throw new Error('Wallet not connected');
        }

        const address = contractAddresses[contractName];
        const abi = contractABIs[contractName];

        if (!address || !abi) {
            throw new Error(`Contract ${contractName} not found or ABI not loaded`);
        }

        return new ethers.Contract(address, abi, signer);
    } catch (error) {
        console.error(`Failed to get contract ${contractName}:`, error);
        throw error;
    }
};

/**
 * Get read-only contract instance (no signer required)
 */
export const getReadOnlyContract = async (contractName) => {
    try {
        if (!provider) {
            await initializeProvider();
        }

        const address = contractAddresses[contractName];
        const abi = contractABIs[contractName];

        if (!address || !abi) {
            throw new Error(`Contract ${contractName} not found or ABI not loaded`);
        }

        return new ethers.Contract(address, abi, provider);
    } catch (error) {
        console.error(`Failed to get read-only contract ${contractName}:`, error);
        throw error;
    }
};

/**
 * Switch to local Hardhat network
 */
export const switchToHardhatNetwork = async () => {
    try {
        if (!window.ethereum) {
            throw new Error('MetaMask not available');
        }

        await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0x7A69' }], // 31337 in hex
        });
    } catch (switchError) {
        // If network doesn't exist, add it
        if (switchError.code === 4902) {
            try {
                await window.ethereum.request({
                    method: 'wallet_addEthereumChain',
                    params: [
                        {
                            chainId: '0x7A69', // 31337
                            chainName: 'Hardhat Local',
                            nativeCurrency: {
                                name: 'Ethereum',
                                symbol: 'ETH',
                                decimals: 18,
                            },
                            rpcUrls: ['http://127.0.0.1:8545'],
                            blockExplorerUrls: null,
                        },
                    ],
                });
            } catch (addError) {
                throw addError;
            }
        } else {
            throw switchError;
        }
    }
};

/**
 * Format ETH amount for display
 */
export const formatEth = (wei, decimals = 4) => {
    return parseFloat(ethers.formatEther(wei)).toFixed(decimals);
};

/**
 * Parse ETH amount to wei
 */
export const parseEth = (eth) => {
    return ethers.parseEther(eth.toString());
};

/**
 * Get current network info
 */
export const getNetworkInfo = async () => {
    try {
        if (!provider) {
            await initializeProvider();
        }

        const network = await provider.getNetwork();
        return {
            chainId: Number(network.chainId),
            name: network.name,
            isHardhat: Number(network.chainId) === 31337
        };
    } catch (error) {
        console.error('Failed to get network info:', error);
        return null;
    }
};

export default {
    initializeProvider,
    connectWallet,
    disconnectWallet,
    getWalletInfo,
    loadContractData,
    getContract,
    getReadOnlyContract,
    switchToHardhatNetwork,
    formatEth,
    parseEth,
    getNetworkInfo
};