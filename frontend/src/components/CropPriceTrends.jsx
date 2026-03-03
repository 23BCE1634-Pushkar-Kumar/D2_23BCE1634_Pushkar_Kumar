import React from 'react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

const CropPriceTrends = ({ crop = 'Wheat', period = '7d' }) => {
    // Mock price data - in a real app, this would come from an API
    const generatePriceData = (crop, days = 7) => {
        const basePrice = {
            wheat: 2500,
            rice: 3000,
            corn: 2200,
            tomato: 4000,
            onion: 2800
        };

        const price = basePrice[crop.toLowerCase()] || 2500;
        const data = [];

        for (let i = days - 1; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);

            // Generate realistic price variation
            const variation = (Math.random() - 0.5) * 0.2; // ±10% variation
            const dailyPrice = Math.round(price * (1 + variation));

            data.push({
                date: date.toLocaleDateString(),
                price: dailyPrice,
                volume: Math.floor(Math.random() * 1000) + 500, // Mock volume data
                marketPrice: dailyPrice + Math.floor(Math.random() * 200) - 100
            });
        }

        return data;
    };

    const priceData = generatePriceData(crop, period === '7d' ? 7 : period === '30d' ? 30 : 90);
    const currentPrice = priceData[priceData.length - 1]?.price || 0;
    const previousPrice = priceData[priceData.length - 2]?.price || 0;
    const priceChange = currentPrice - previousPrice;
    const percentChange = previousPrice ? ((priceChange / previousPrice) * 100).toFixed(2) : 0;

    const formatPrice = (price) => `₹${price.toLocaleString()}`;

    const getMarketInsights = (crop) => {
        const insights = {
            wheat: {
                demand: 'High',
                season: 'Harvesting season approaching',
                suggestion: 'Good time to sell, prices expected to rise'
            },
            rice: {
                demand: 'Stable',
                season: 'Mid-season',
                suggestion: 'Wait for better market conditions'
            },
            corn: {
                demand: 'Low',
                season: 'Off-season',
                suggestion: 'Consider storage until demand increases'
            },
            tomato: {
                demand: 'Very High',
                season: 'Peak demand',
                suggestion: 'Excellent time to sell'
            },
            onion: {
                demand: 'High',
                season: 'Festival season',
                suggestion: 'Premium prices available'
            }
        };

        return insights[crop.toLowerCase()] || insights.wheat;
    };

    const insights = getMarketInsights(crop);

    return (
        <div className="card">
            <div className="card-header">
                <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                        <DollarSign className="h-5 w-5 mr-2" />
                        {crop} Price Trends
                    </h3>

                    <div className="flex space-x-2">
                        <select className="text-sm border border-gray-300 rounded px-2 py-1">
                            <option value="7d">7 Days</option>
                            <option value="30d">30 Days</option>
                            <option value="90d">90 Days</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Current Price and Change */}
            <div className="mb-6">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-3xl font-bold text-gray-900">
                            {formatPrice(currentPrice)}
                        </p>
                        <p className="text-sm text-gray-600">per quintal</p>
                    </div>

                    <div className={`flex items-center space-x-1 ${priceChange >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                        {priceChange >= 0 ? (
                            <TrendingUp className="h-4 w-4" />
                        ) : (
                            <TrendingDown className="h-4 w-4" />
                        )}
                        <span className="font-medium">
                            {priceChange >= 0 ? '+' : ''}{formatPrice(priceChange)}
                        </span>
                        <span className="text-sm">
                            ({priceChange >= 0 ? '+' : ''}{percentChange}%)
                        </span>
                    </div>
                </div>
            </div>

            {/* Price Chart */}
            <div className="mb-6" style={{ height: '250px' }}>
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={priceData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                            dataKey="date"
                            tick={{ fontSize: 12 }}
                            tickFormatter={(value) => {
                                const date = new Date(value);
                                return `${date.getDate()}/${date.getMonth() + 1}`;
                            }}
                        />
                        <YAxis
                            tick={{ fontSize: 12 }}
                            tickFormatter={(value) => `₹${value}`}
                        />
                        <Tooltip
                            formatter={(value, name) => [formatPrice(value), name === 'price' ? 'Farm Price' : 'Market Price']}
                            labelFormatter={(label) => `Date: ${label}`}
                        />
                        <Area
                            type="monotone"
                            dataKey="price"
                            stroke="#22c55e"
                            fill="#22c55e"
                            fillOpacity={0.2}
                            name="Farm Price"
                        />
                        <Line
                            type="monotone"
                            dataKey="marketPrice"
                            stroke="#f97316"
                            strokeWidth={2}
                            dot={false}
                            name="Market Price"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            {/* Market Insights */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="bg-blue-50 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 mb-1">Demand Level</h4>
                    <p className="text-blue-700">{insights.demand}</p>
                </div>

                <div className="bg-orange-50 rounded-lg p-4">
                    <h4 className="font-medium text-orange-900 mb-1">Season Info</h4>
                    <p className="text-orange-700">{insights.season}</p>
                </div>

                <div className="bg-green-50 rounded-lg p-4">
                    <h4 className="font-medium text-green-900 mb-1">Average Volume</h4>
                    <p className="text-green-700">
                        {Math.round(priceData.reduce((sum, item) => sum + item.volume, 0) / priceData.length)} kg/day
                    </p>
                </div>
            </div>

            {/* Recommendation */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-medium text-yellow-900 mb-2">Market Suggestion</h4>
                <p className="text-yellow-800 text-sm">{insights.suggestion}</p>
            </div>

            {/* Price Statistics */}
            <div className="mt-4 grid grid-cols-3 gap-4 text-center text-sm">
                <div>
                    <p className="text-gray-500">Highest</p>
                    <p className="font-medium">{formatPrice(Math.max(...priceData.map(d => d.price)))}</p>
                </div>
                <div>
                    <p className="text-gray-500">Lowest</p>
                    <p className="font-medium">{formatPrice(Math.min(...priceData.map(d => d.price)))}</p>
                </div>
                <div>
                    <p className="text-gray-500">Average</p>
                    <p className="font-medium">
                        {formatPrice(Math.round(priceData.reduce((sum, d) => sum + d.price, 0) / priceData.length))}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default CropPriceTrends;