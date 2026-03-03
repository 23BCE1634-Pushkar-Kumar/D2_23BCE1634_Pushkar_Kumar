import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Gavel, Users, TrendingUp, Clock } from 'lucide-react';

const AuctionGraph = ({ auction, bids = [] }) => {
    // Process bid data for visualization
    const processBidData = () => {
        if (!bids || bids.length === 0) return [];

        const sortedBids = [...bids].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

        return sortedBids.map((bid, index) => ({
            bidNumber: index + 1,
            amount: bid.bidAmount,
            timestamp: new Date(bid.timestamp).toLocaleTimeString(),
            retailerId: bid.retailerId?.slice(-4) || 'User' // Show last 4 chars of ID
        }));
    };

    const bidData = processBidData();
    const currentHighestBid = auction?.currentHighestBid || Math.max(...bids.map(b => b.bidAmount), 0);
    const basePrice = auction?.basePrice || 0;
    const totalBids = bids.length;
    const uniqueBidders = new Set(bids.map(b => b.retailerId)).size;

    // Calculate bid increment suggestions
    const getBidSuggestions = () => {
        const increment = Math.ceil(currentHighestBid * 0.05); // 5% increment
        return [
            currentHighestBid + increment,
            currentHighestBid + increment * 2,
            currentHighestBid + increment * 3
        ];
    };

    const suggestions = getBidSuggestions();

    const formatPrice = (price) => `₹${price.toLocaleString()}`;

    if (!auction) {
        return (
            <div className="card">
                <div className="text-center text-gray-500 py-8">
                    <Gavel className="h-12 w-12 mx-auto mb-2" />
                    <p>No auction data available</p>
                </div>
            </div>
        );
    }

    return (
        <div className="card">
            <div className="card-header">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <Gavel className="h-5 w-5 mr-2" />
                    Auction Analytics
                </h3>
                <span className={`status-badge ${auction.status === 'open' ? 'status-open' : 'status-closed'}`}>
                    {auction.status.toUpperCase()}
                </span>
            </div>

            {/* Auction Summary */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="text-center">
                    <p className="text-2xl font-bold text-agri-green-600">
                        {formatPrice(currentHighestBid)}
                    </p>
                    <p className="text-sm text-gray-600">Highest Bid</p>
                </div>

                <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">{totalBids}</p>
                    <p className="text-sm text-gray-600">Total Bids</p>
                </div>

                <div className="text-center">
                    <p className="text-2xl font-bold text-purple-600">{uniqueBidders}</p>
                    <p className="text-sm text-gray-600">Bidders</p>
                </div>

                <div className="text-center">
                    <p className="text-2xl font-bold text-orange-600">
                        {formatPrice(currentHighestBid - basePrice)}
                    </p>
                    <p className="text-sm text-gray-600">Above Base</p>
                </div>
            </div>

            {/* Bid Progression Chart */}
            {bidData.length > 0 && (
                <div className="mb-6">
                    <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                        <TrendingUp className="h-4 w-4 mr-2" />
                        Bid Progression
                    </h4>
                    <div style={{ height: '200px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={bidData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis
                                    dataKey="bidNumber"
                                    tick={{ fontSize: 12 }}
                                    label={{ value: 'Bid Number', position: 'insideBottom', offset: -10 }}
                                />
                                <YAxis
                                    tick={{ fontSize: 12 }}
                                    tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
                                    label={{ value: 'Amount', angle: -90, position: 'insideLeft' }}
                                />
                                <Tooltip
                                    formatter={(value) => [formatPrice(value), 'Bid Amount']}
                                    labelFormatter={(label) => `Bid #${label}`}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="amount"
                                    stroke="#22c55e"
                                    strokeWidth={3}
                                    dot={{ fill: '#22c55e', strokeWidth: 2, r: 4 }}
                                    activeDot={{ r: 6 }}
                                />
                                {/* Base price reference line */}
                                <Line
                                    type="monotone"
                                    dataKey={() => basePrice}
                                    stroke="#ef4444"
                                    strokeDasharray="5 5"
                                    dot={false}
                                    name="Base Price"
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            {/* Recent Bids Table */}
            {bidData.length > 0 && (
                <div className="mb-6">
                    <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                        <Clock className="h-4 w-4 mr-2" />
                        Recent Bids
                    </h4>
                    <div className="overflow-x-auto">
                        <table className="min-w-full bg-white">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Time
                                    </th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Bidder
                                    </th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Amount
                                    </th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {bidData.slice(-5).reverse().map((bid, index) => (
                                    <tr key={index} className={index === 0 ? 'bg-green-50' : ''}>
                                        <td className="px-4 py-2 text-sm text-gray-900">{bid.timestamp}</td>
                                        <td className="px-4 py-2 text-sm text-gray-900">***{bid.retailerId}</td>
                                        <td className="px-4 py-2 text-sm font-medium text-gray-900">
                                            {formatPrice(bid.amount)}
                                        </td>
                                        <td className="px-4 py-2 text-sm">
                                            {index === 0 && (
                                                <span className="status-badge status-open">Leading</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Bid Suggestions */}
            {auction.status === 'open' && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 mb-3 flex items-center">
                        <Users className="h-4 w-4 mr-2" />
                        Suggested Bid Amounts
                    </h4>
                    <div className="grid grid-cols-3 gap-2">
                        {suggestions.map((amount, index) => (
                            <div key={index} className="text-center p-2 bg-white rounded border">
                                <p className="font-medium text-blue-900">{formatPrice(amount)}</p>
                                <p className="text-xs text-blue-600">
                                    {index === 0 ? 'Conservative' : index === 1 ? 'Competitive' : 'Aggressive'}
                                </p>
                            </div>
                        ))}
                    </div>
                    <p className="text-xs text-blue-600 mt-2 text-center">
                        Suggestions based on current bidding patterns
                    </p>
                </div>
            )}

            {/* Auction Details */}
            <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                <div>
                    <p className="text-gray-500">Crop</p>
                    <p className="font-medium">{auction.crop} {auction.variety && `(${auction.variety})`}</p>
                </div>
                <div>
                    <p className="text-gray-500">Quantity</p>
                    <p className="font-medium">{auction.quantity} kg</p>
                </div>
                <div>
                    <p className="text-gray-500">Base Price</p>
                    <p className="font-medium">{formatPrice(basePrice)}</p>
                </div>
                <div>
                    <p className="text-gray-500">Quality Grade</p>
                    <p className="font-medium">{auction.qualityGrade || 'A'}</p>
                </div>
            </div>
        </div>
    );
};

export default AuctionGraph;