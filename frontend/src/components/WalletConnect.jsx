import React, { useState, useEffect } from 'react';
import { Wallet, Check, AlertCircle } from 'lucide-react';

const WalletConnect = () => {
    const [account, setAccount] = useState(null);
    const [isConnecting, setIsConnecting] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Check if already connected
        if (window.ethereum) {
            window.ethereum.request({ method: 'eth_accounts' })
                .then(accounts => {
                    if (accounts.length > 0) {
                        setAccount(accounts[0]);
                    }
                })
                .catch(console.error);
        }
    }, []);

    const connectWallet = async () => {
        if (!window.ethereum) {
            setError('MetaMask is not installed. Please install MetaMask to continue.');
            return;
        }

        setIsConnecting(true);
        setError(null);

        try {
            // Request account access
            const accounts = await window.ethereum.request({
                method: 'eth_requestAccounts'
            });

            if (accounts.length > 0) {
                setAccount(accounts[0]);

                // Switch to Hardhat network
                try {
                    await window.ethereum.request({
                        method: 'wallet_switchEthereumChain',
                        params: [{ chainId: '0x7A69' }], // 31337 in hex
                    });
                } catch (switchError) {
                    // If network doesn't exist, add it
                    if (switchError.code === 4902) {
                        await window.ethereum.request({
                            method: 'wallet_addEthereumChain',
                            params: [{
                                chainId: '0x7A69',
                                chainName: 'Hardhat Local',
                                nativeCurrency: {
                                    name: 'ETH',
                                    symbol: 'ETH',
                                    decimals: 18
                                },
                                rpcUrls: ['http://127.0.0.1:8545'],
                                blockExplorerUrls: null,
                            }]
                        });
                    }
                }
            }
        } catch (error) {
            setError('Failed to connect wallet. Please try again.');
            console.error('Wallet connection error:', error);
        } finally {
            setIsConnecting(false);
        }
    };

    const disconnectWallet = () => {
        setAccount(null);
    };

    if (account) {
        return (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center justify-between">
                <div className="flex items-center">
                    <Check className="h-5 w-5 text-green-600 mr-2" />
                    <div>
                        <p className="text-sm font-medium text-green-800">Wallet Connected</p>
                        <p className="text-xs text-green-600">
                            {account.substring(0, 6)}...{account.substring(account.length - 4)}
                        </p>
                    </div>
                </div>
                <button
                    onClick={disconnectWallet}
                    className="text-xs text-green-700 hover:text-green-800 underline"
                >
                    Disconnect
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            <button
                onClick={connectWallet}
                disabled={isConnecting}
                className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
                {isConnecting ? (
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                ) : (
                    <Wallet className="h-4 w-4 mr-2" />
                )}
                {isConnecting ? 'Connecting...' : 'Connect MetaMask'}
            </button>

            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-2 flex items-start">
                    <AlertCircle className="h-4 w-4 text-red-600 mr-2 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-red-700">{error}</p>
                </div>
            )}

            <p className="text-xs text-gray-500 text-center">
                Connect your wallet to enable blockchain transactions
            </p>
        </div>
    );
};

export default WalletConnect;