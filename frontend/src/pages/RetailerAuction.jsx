import React, { useState, useEffect } from 'react';
import { Gavel, LogOut, Settings, Bell, Plus, Wallet } from 'lucide-react';
import AuctionGraph from '../components/AuctionGraph';
import WalletConnect from '../components/WalletConnect';
import api from '../utils/api';

const RetailerAuction = ({ user, onLogout }) => {
    const [auctions, setAuctions] = useState([]);
    const [selectedAuction, setSelectedAuction] = useState(null);
    const [bidAmount, setBidAmount] = useState('');
    const [loading, setLoading] = useState(true);
    const [bidLoading, setBidLoading] = useState(false);
    const [myBids, setMyBids] = useState([]);

    useEffect(() => {
        fetchOpenAuctions();
        fetchMyBids();
    }, []);

    const fetchOpenAuctions = async () => {
        try {
            const response = await api.getOpenAuctions();
            setAuctions(response.auctions || []);
        } catch (error) {
            console.error('Error fetching auctions:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchMyBids = async () => {
        try {
            const response = await api.getRetailerBids();
            setMyBids(response.auctions || []);
        } catch (error) {
            console.error('Error fetching my bids:', error);
        }
    };

    const handlePlaceBid = async (auctionId) => {
        if (!bidAmount || bidAmount <= 0) {
            alert('Please enter a valid bid amount in Rupees');
            return;
        }

        // Convert INR to ETH tokens for Hardhat blockchain transactions
        const bidInINR = parseFloat(bidAmount);
        const ETH_TO_INR_RATE = 80; // 1 ETH = ₹80 (simplified for localhost testing)
        const bidInETH = bidInINR / ETH_TO_INR_RATE;

        // Validate bid amount in reasonable INR range
        if (bidInINR > 500000) { // Max 5 lakh INR
            alert('⚠️ Bid amount too high! Please enter a value between ₹1,000 and ₹5,00,000');
            return;
        }

        if (bidInINR < 1000) { // Min 1000 INR
            alert('⚠️ Bid amount too low! Minimum bid is ₹1,000');
            return;
        }

        console.log(`💰 Bid Conversion: ₹${bidInINR.toLocaleString('en-IN')} = ${bidInETH.toFixed(6)} ETH`);

        setBidLoading(true);
        try {
            // First try blockchain bidding (if MetaMask is connected)
            if (window.ethereum && window.ethereum.selectedAddress) {
                try {
                    const blockchainBidData = {
                        auctionId: auctionId,
                        bidAmount: bidInETH, // Send ETH amount to backend
                        bidAmountINR: bidInINR, // Also send INR for reference
                        bidder: window.ethereum.selectedAddress
                    };

                    // Call blockchain bidding API
                    await api.placeBlockchainBid(blockchainBidData);
                    alert(`🎉 Blockchain bid placed successfully!\n₹${bidInINR.toLocaleString('en-IN')} (${bidInETH.toFixed(6)} ETH) confirmed on Hardhat.`);
                } catch (blockchainError) {
                    console.warn('Blockchain bid failed, falling back to traditional bid:', blockchainError);
                    // Fallback to traditional bidding (using INR)
                    await api.placeBid(auctionId, bidInINR);
                    alert(`✅ Traditional bid placed successfully! ₹${bidInINR.toLocaleString('en-IN')}`);
                }
            } else {
                // Traditional bidding if no wallet connected (using INR)
                await api.placeBid(auctionId, bidInINR);
                alert(`✅ Bid placed successfully! ₹${bidInINR.toLocaleString('en-IN')}\nConnect MetaMask for blockchain bidding.`);
            }

            setBidAmount('');
            setSelectedAuction(null);
            fetchOpenAuctions();
            fetchMyBids();
        } catch (error) {
            console.error('Error placing bid:', error);
            alert(error.response?.data?.error || 'Failed to place bid. Please try again.');
        } finally {
            setBidLoading(false);
        }
    };

    const getMyHighestBid = (auctionId) => {
        const auction = myBids.find(a => a._id === auctionId);
        if (!auction?.bids) return null;

        const myBidsForAuction = auction.bids.filter(bid =>
            bid.retailerId === user.id
        );

        return myBidsForAuction.length > 0
            ? Math.max(...myBidsForAuction.map(b => b.bidAmount))
            : null;
    };

    const isWinning = (auction) => {
        const myHighestBid = getMyHighestBid(auction._id);
        return myHighestBid && myHighestBid === auction.currentHighestBid;
    };

    const formatPrice = (price) => `₹${price.toLocaleString()}`;
    const formatDate = (date) => new Date(date).toLocaleDateString();

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center">
                            <Gavel className="h-8 w-8 text-blue-600 mr-3" />
                            <div>
                                <h1 className="text-xl font-semibold text-gray-900">Retailer Auction</h1>
                                <p className="text-sm text-gray-600">Welcome, {user.name}</p>
                            </div>
                        </div>

                        <div className="flex items-center space-x-4">
                            <button className="p-2 text-gray-400 hover:text-gray-600">
                                <Bell className="h-5 w-5" />
                            </button>
                            <button className="p-2 text-gray-400 hover:text-gray-600" onClick={() => (window.location.href = '/settings')}>
                                <Settings className="h-5 w-5" />
                            </button>
                            <button
                                onClick={onLogout}
                                className="flex items-center text-gray-600 hover:text-gray-800"
                            >
                                <LogOut className="h-4 w-4 mr-2" />
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column - Auction List */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="card">
                            <div className="card-header">
                                <h2 className="text-lg font-semibold text-gray-900">Open Auctions</h2>
                                <p className="text-sm text-gray-600">{auctions.length} active auctions</p>
                            </div>
                        </div>

                        {loading ? (
                            <div className="card">
                                <div className="text-center py-8">
                                    <div className="loading-spinner mx-auto"></div>
                                </div>
                            </div>
                        ) : auctions.length === 0 ? (
                            <div className="card text-center py-8">
                                <Gavel className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                <p className="text-gray-600">No active auctions</p>
                                <p className="text-sm text-gray-500">Check back later for new crop auctions</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {auctions.map((auction) => {
                                    const myHighestBid = getMyHighestBid(auction._id);
                                    const winning = isWinning(auction);

                                    return (
                                        <div key={auction._id} className="card">
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="flex-1">
                                                    <div className="flex items-center space-x-3 mb-2">
                                                        <h3 className="text-lg font-semibold text-gray-900">
                                                            {auction.crop} {auction.variety && `(${auction.variety})`}
                                                        </h3>
                                                        <span className="status-badge status-open">OPEN</span>
                                                        {winning && (
                                                            <span className="status-badge bg-green-100 text-green-800">
                                                                WINNING
                                                            </span>
                                                        )}
                                                    </div>

                                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                                        <div>
                                                            <p className="text-sm text-gray-600">Quantity</p>
                                                            <p className="font-medium">{auction.quantity} kg</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-sm text-gray-600">Base Price</p>
                                                            <p className="font-medium">{formatPrice(auction.basePrice)}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-sm text-gray-600">Current Highest</p>
                                                            <p className="font-medium text-green-600">
                                                                {formatPrice(auction.currentHighestBid)}
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <p className="text-sm text-gray-600">Total Bids</p>
                                                            <p className="font-medium">{auction.bids?.length || 0}</p>
                                                        </div>
                                                    </div>

                                                    {myHighestBid && (
                                                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                                                            <p className="text-sm text-blue-800">
                                                                <strong>Your highest bid:</strong> {formatPrice(myHighestBid)}
                                                                {winning && <span className="ml-2 text-green-600 font-medium">✓ Leading</span>}
                                                            </p>
                                                        </div>
                                                    )}

                                                    {auction.description && (
                                                        <p className="text-sm text-gray-600 mb-3">{auction.description}</p>
                                                    )}

                                                    <div className="flex items-center justify-between text-sm text-gray-500">
                                                        <span>Posted: {formatDate(auction.createdAt)}</span>
                                                        <span>Quality: Grade {auction.qualityGrade}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Bidding Section */}
                                            <div className="border-t border-gray-200 pt-4">
                                                {selectedAuction === auction._id ? (
                                                    <div className="space-y-3">
                                                        <div className="flex space-x-3">
                                                            <div className="flex-1">
                                                                <input
                                                                    type="number"
                                                                    placeholder={`Minimum: ₹${auction.currentHighestBid + 1}`}
                                                                    min={auction.currentHighestBid + 1}
                                                                    value={bidAmount}
                                                                    onChange={(e) => setBidAmount(e.target.value)}
                                                                    className="form-input"
                                                                />
                                                                {/* Currency Converter Display */}
                                                                {bidAmount && parseFloat(bidAmount) > 0 && (
                                                                    <div className="mt-1 text-xs text-gray-500">
                                                                        ⚡ ≈ {(parseFloat(bidAmount) / 80).toFixed(6)} ETH
                                                                        {window.ethereum && window.ethereum.selectedAddress && (
                                                                            <span className="ml-2 text-blue-600">
                                                                                (Hardhat blockchain)
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <button
                                                                onClick={() => handlePlaceBid(auction._id)}
                                                                disabled={bidLoading}
                                                                className="btn-primary flex items-center"
                                                            >
                                                                {bidLoading ? (
                                                                    <div className="loading-spinner h-4 w-4 mr-2"></div>
                                                                ) : (
                                                                    <Plus className="h-4 w-4 mr-2" />
                                                                )}
                                                                Place Bid
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    setSelectedAuction(null);
                                                                    setBidAmount('');
                                                                }}
                                                                className="btn-secondary"
                                                            >
                                                                Cancel
                                                            </button>
                                                        </div>

                                                        {/* Bid Suggestions */}
                                                        <div className="flex space-x-2">
                                                            <span className="text-sm text-gray-600">Quick bids:</span>
                                                            {[
                                                                auction.currentHighestBid + Math.ceil(auction.currentHighestBid * 0.05),
                                                                auction.currentHighestBid + Math.ceil(auction.currentHighestBid * 0.1),
                                                                auction.currentHighestBid + Math.ceil(auction.currentHighestBid * 0.15)
                                                            ].map((amount, index) => (
                                                                <button
                                                                    key={index}
                                                                    onClick={() => setBidAmount(amount.toString())}
                                                                    className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded"
                                                                >
                                                                    {formatPrice(amount)}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => setSelectedAuction(auction._id)}
                                                        className="btn-primary"
                                                    >
                                                        Place Bid
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Right Column - Auction Analytics */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* Selected Auction Analytics */}
                        {selectedAuction && (
                            <AuctionGraph
                                auction={auctions.find(a => a._id === selectedAuction)}
                                bids={auctions.find(a => a._id === selectedAuction)?.bids || []}
                            />
                        )}

                        {/* My Bids Summary */}
                        <div className="card">
                            <div className="card-header">
                                <h3 className="text-lg font-semibold text-gray-900">My Bids Summary</h3>
                            </div>

                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="text-center">
                                        <p className="text-2xl font-bold text-blue-600">
                                            {myBids.reduce((total, auction) => {
                                                return total + (auction.bids?.filter(b => b.retailerId === user.id).length || 0);
                                            }, 0)}
                                        </p>
                                        <p className="text-sm text-gray-600">Total Bids</p>
                                    </div>

                                    <div className="text-center">
                                        <p className="text-2xl font-bold text-green-600">
                                            {auctions.filter(auction => isWinning(auction)).length}
                                        </p>
                                        <p className="text-sm text-gray-600">Leading</p>
                                    </div>
                                </div>

                                {/* Recent Activity */}
                                <div>
                                    <h4 className="font-medium text-gray-900 mb-2">Recent Activity</h4>
                                    <div className="space-y-2 text-sm">
                                        {myBids.slice(0, 3).map((auction) => {
                                            const myBidsForAuction = auction.bids?.filter(b => b.retailerId === user.id) || [];
                                            const latestBid = myBidsForAuction[myBidsForAuction.length - 1];

                                            if (!latestBid) return null;

                                            return (
                                                <div key={auction._id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                                                    <div>
                                                        <p className="font-medium">{auction.crop}</p>
                                                        <p className="text-xs text-gray-500">
                                                            {new Date(latestBid.timestamp).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="font-medium">{formatPrice(latestBid.bidAmount)}</p>
                                                        <p className={`text-xs ${isWinning(auction) ? 'text-green-600' : 'text-gray-500'
                                                            }`}>
                                                            {isWinning(auction) ? 'Leading' : 'Outbid'}
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Blockchain Wallet Connection */}
                        <div className="card">
                            <div className="card-header">
                                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                                    <Wallet className="h-5 w-5 mr-2" />
                                    Blockchain Bidding
                                </h3>
                            </div>

                            <div className="space-y-3">
                                <WalletConnect />

                                <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-3">
                                    <h4 className="font-medium text-purple-800 mb-2">🔗 Blockchain Benefits:</h4>
                                    <ul className="text-xs text-purple-700 space-y-1">
                                        <li>✅ Transparent bidding history</li>
                                        <li>✅ Immutable auction records</li>
                                        <li>✅ Trustless transactions</li>
                                        <li>✅ Automatic bid refunds</li>
                                    </ul>
                                </div>

                                <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                                    💡 <strong>How it works:</strong> Connect MetaMask to place bids directly on blockchain smart contracts. Your bids are recorded permanently and cannot be manipulated.
                                </div>
                            </div>
                        </div>

                        {/* Market Tips */}
                        <div className="card">
                            <div className="card-header">
                                <h3 className="text-lg font-semibold text-gray-900">Bidding Tips</h3>
                            </div>

                            <div className="space-y-3 text-sm">
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                    <p className="text-blue-800">
                                        <strong>Smart Bidding:</strong> Bid incrementally and observe patterns before placing large bids.
                                    </p>
                                </div>

                                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                                    <p className="text-green-800">
                                        <strong>Quality Check:</strong> Higher grades (A) justify premium pricing.
                                    </p>
                                </div>

                                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                                    <p className="text-yellow-800">
                                        <strong>Timing:</strong> Last-minute bids can be effective but risky.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RetailerAuction;