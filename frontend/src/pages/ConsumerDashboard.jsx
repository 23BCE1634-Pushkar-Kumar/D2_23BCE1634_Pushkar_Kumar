import React, { useEffect, useState } from 'react';
import { Package, ShoppingCart, Search, CheckCircle, Truck, MapPin, CreditCard, QrCode, Settings, LogOut } from 'lucide-react';
import api from '../utils/api';
import MapTracker from '../components/MapTracker';
import QRScanner from '../components/QRScanner';

// Simple cart stored in localStorage
const CART_KEY = 'consumer_cart_v1';

const ConsumerDashboard = ({ user, onLogout }) => {
    const [tab, setTab] = useState('shop'); // shop | cart | orders | track | scan
    const [auctions, setAuctions] = useState([]);
    const [query, setQuery] = useState('');
    const [cart, setCart] = useState([]);
    const [orders, setOrders] = useState([]);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [scannedShipment, setScannedShipment] = useState(null);
    const [scanLoading, setScanLoading] = useState(false);
    const [scanError, setScanError] = useState('');
    const [loading, setLoading] = useState(false);
    const [demoMode, setDemoMode] = useState(false);

    useEffect(() => {
        // Detect demo mode via URL or localStorage
        try {
            const params = new URLSearchParams(window.location.search);
            const urlDemo = params.get('demo') === '1';
            const storedDemo = localStorage.getItem('demo_inventory') === '1';
            const enabled = urlDemo || storedDemo;
            setDemoMode(enabled);
        } catch { }

        loadAuctions();
        const savedCart = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
        setCart(savedCart);
        const savedOrders = JSON.parse(localStorage.getItem('consumer_orders_v1') || '[]');
        setOrders(savedOrders);
    }, []);

    const loadAuctions = async () => {
        try {
            setLoading(true);
            if (demoMode) {
                setAuctions(getMockProducts());
                return;
            }

            const res = await api.getOpenAuctions();
            const list = res.auctions || [];
            setAuctions(list.length ? list : getMockProducts());
        } catch (e) {
            console.error('Failed to load products', e);
            // Fallback to mock products if API fails
            setAuctions(getMockProducts());
        } finally {
            setLoading(false);
        }
    };

    const addToCart = (auction) => {
        const item = {
            id: auction._id,
            name: `${auction.crop}${auction.variety ? ' (' + auction.variety + ')' : ''}`,
            price: auction.currentHighestBid || auction.basePrice,
            quantity: 1,
            auction,
        };
        const updated = [...cart];
        const existing = updated.find((i) => i.id === item.id);
        if (existing) existing.quantity += 1; else updated.push(item);
        setCart(updated);
        localStorage.setItem(CART_KEY, JSON.stringify(updated));
    };

    const updateQty = (id, delta) => {
        const updated = cart
            .map((i) => (i.id === id ? { ...i, quantity: Math.max(1, i.quantity + delta) } : i))
            .filter((i) => i.quantity > 0);
        setCart(updated);
        localStorage.setItem(CART_KEY, JSON.stringify(updated));
    };

    const removeFromCart = (id) => {
        const updated = cart.filter((i) => i.id !== id);
        setCart(updated);
        localStorage.setItem(CART_KEY, JSON.stringify(updated));
    };

    const checkout = async () => {
        if (cart.length === 0) return;
        // Create a pseudo-order stored locally (no backend order model yet)
        const orderId = `ORD-${Date.now().toString().slice(-8)}`;
        const total = cart.reduce((s, i) => s + i.price * i.quantity, 0);
        const order = {
            orderId,
            items: cart,
            total,
            status: 'processing', // processing -> shipped -> delivered
            createdAt: new Date().toISOString(),
            // Mock shipment linkage for tracking demo
            truckId: 'truck001',
            deliveryLocation: { lat: 28.7041, lon: 77.1025, address: 'Delhi Market' },
        };
        const updated = [order, ...orders];
        setOrders(updated);
        localStorage.setItem('consumer_orders_v1', JSON.stringify(updated));
        setCart([]);
        localStorage.setItem(CART_KEY, JSON.stringify([]));
        setTab('orders');
        setSelectedOrder(order);
    };

    const filtered = auctions.filter((a) => {
        const t = `${a.crop} ${a.variety || ''}`.toLowerCase();
        return t.includes(query.toLowerCase());
    });

    const formatPrice = (p) => `₹${Number(p).toLocaleString('en-IN')}`;

    // Handle QR scan result (from QRScanner component)
    const handleQRScan = async (payload) => {
        // payload can be plain string (e.g., 'SHIP001') or an object from a richer scanner
        const code = typeof payload === 'string' ? payload : (payload?.data || payload?.qrCode || '');
        if (!code) return;

        setScanError('');
        setScanLoading(true);
        setScannedShipment(null);

        try {
            const res = await api.getShipmentByQR(code);
            if (res?.success && res.shipment) {
                setScannedShipment(res.shipment);
            } else {
                setScannedShipment(createMockShipmentData(code));
            }
        } catch (e) {
            setScannedShipment(createMockShipmentData(code));
        } finally {
            setScanLoading(false);
            // Jump to Track tab to visualize
            setSelectedOrder(null);
            setTab('track');
        }
    };

    // Minimal mock for when backend has no record for QR
    const createMockShipmentData = (qrCode) => {
        return {
            _id: qrCode,
            qrCode,
            truckId: 'truck001',
            status: Math.random() > 0.5 ? 'in_transit' : 'delivered',
            quantity: Math.floor(Math.random() * 500) + 100,
            createdAt: new Date().toISOString(),
            pickupLocation: {
                address: 'Green Valley Farm, Haryana',
                coordinates: { lat: 28.4595, lon: 77.0266 },
            },
            deliveryLocation: {
                address: 'Delhi Wholesale Market',
                coordinates: { lat: 28.7041, lon: 77.1025 },
            },
            // Include product info so details are visible in UI
            productInfo: {
                crop: ['Wheat', 'Rice', 'Tomato', 'Onion'][Math.floor(Math.random() * 4)],
                variety: 'Premium Grade A',
                harvestDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
                farmer: {
                    name: 'Ram Kumar',
                    location: 'Haryana',
                    certifications: ['Organic', 'Fair Trade'],
                },
                qualityTests: {
                    pesticide: 'Not Detected',
                    moisture: '12%',
                    purity: '98%',
                },
            },
        };
    };

    // Mock product catalog for demo/testing
    const getMockProducts = () => {
        const items = [
            { crop: 'Tomato', variety: 'Roma', quantity: 200, basePrice: 25, description: 'Fresh red tomatoes' },
            { crop: 'Onion', variety: 'Red', quantity: 500, basePrice: 18, description: 'Crisp red onions' },
            { crop: 'Potato', variety: 'Chipsona', quantity: 800, basePrice: 22, description: 'Starchy potatoes ideal for fries' },
            { crop: 'Wheat', variety: 'Sharbati', quantity: 1000, basePrice: 28, description: 'Premium wheat grains' },
            { crop: 'Rice', variety: 'Basmati', quantity: 700, basePrice: 60, description: 'Long-grain aromatic rice' },
            { crop: 'Banana', variety: 'Cavendish', quantity: 300, basePrice: 35, description: 'Sweet ripe bananas' },
            { crop: 'Apple', variety: 'Shimla', quantity: 250, basePrice: 90, description: 'Juicy red apples' },
            { crop: 'Mango', variety: 'Alphonso', quantity: 150, basePrice: 150, description: 'King of fruits, seasonal' },
            { crop: 'Cauliflower', variety: 'Snowball', quantity: 180, basePrice: 30, description: 'Fresh white florets' },
            { crop: 'Spinach', variety: 'Local', quantity: 100, basePrice: 20, description: 'Green leafy spinach' },
            { crop: 'Carrot', variety: 'Nantes', quantity: 220, basePrice: 26, description: 'Crunchy orange carrots' },
            { crop: 'Chili', variety: 'Jwala', quantity: 160, basePrice: 40, description: 'Spicy green chilies' },
        ];
        return items.map((p, idx) => ({
            _id: `MOCK-${idx + 1}`,
            currentHighestBid: null,
            ...p,
        }));
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center">
                            <Package className="h-8 w-8 text-purple-600 mr-3" />
                            <div>
                                <h1 className="text-xl font-semibold text-gray-900">Consumer Dashboard</h1>
                                <p className="text-sm text-gray-600">Welcome, {user.name}</p>
                            </div>
                        </div>

                        <div className="flex items-center space-x-4">
                            <button className={`p-2 ${tab === 'scan' ? 'text-purple-600' : 'text-gray-400'} hover:text-gray-600`} onClick={() => setTab('scan')}>
                                <QrCode className="h-5 w-5" />
                            </button>
                            <button className="p-2 text-gray-400 hover:text-gray-600" onClick={() => (window.location.href = '/settings')}>
                                <Settings className="h-5 w-5" />
                            </button>
                            <button onClick={onLogout} className="flex items-center text-gray-600 hover:text-gray-800">
                                <LogOut className="h-4 w-4 mr-2" />
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Tabs */}
            <div className="bg-white border-b">
                <div className="max-w-7xl mx-auto px-4">
                    <nav className="flex space-x-6 overflow-x-auto">
                        {[
                            { id: 'shop', label: 'Shop', icon: Search },
                            { id: 'cart', label: 'Cart', icon: ShoppingCart },
                            { id: 'orders', label: 'My Orders', icon: CheckCircle },
                            { id: 'track', label: 'Track', icon: Truck },
                            { id: 'scan', label: 'Scan QR', icon: QrCode },
                        ].map((t) => (
                            <button key={t.id} onClick={() => setTab(t.id)} className={`flex items-center py-3 border-b-2 ${tab === t.id ? 'border-purple-600 text-purple-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                                <t.icon className="h-4 w-4 mr-2" />{t.label}
                            </button>
                        ))}
                    </nav>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-6">
                {/* SHOP */}
                {tab === 'shop' && (
                    <div>
                        <div className="flex items-center mb-4 gap-2">
                            <input className="form-input flex-1" placeholder="Search crops or varieties" value={query} onChange={(e) => setQuery(e.target.value)} />
                            <button
                                className={`px-3 py-2 rounded border ${demoMode ? 'bg-purple-50 border-purple-200 text-purple-700' : 'bg-white border-gray-200 text-gray-700'}`}
                                onClick={() => {
                                    const next = !demoMode;
                                    setDemoMode(next);
                                    if (next) localStorage.setItem('demo_inventory', '1'); else localStorage.removeItem('demo_inventory');
                                    loadAuctions();
                                }}
                                title="Toggle demo inventory"
                            >
                                {demoMode ? 'Using Demo Items' : 'Load Demo Items'}
                            </button>
                        </div>
                        {loading ? (
                            <div className="card"><div className="text-center py-8"><div className="loading-spinner mx-auto" /></div></div>
                        ) : filtered.length === 0 ? (
                            <div className="card text-center py-8">No products found</div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {filtered.map((a) => (
                                    <div key={a._id} className="card">
                                        <div className="flex items-start justify-between mb-2">
                                            <div>
                                                <h3 className="font-semibold text-gray-900">{a.crop}{a.variety ? ` (${a.variety})` : ''}</h3>
                                                <p className="text-sm text-gray-600">Qty: {a.quantity} kg</p>
                                            </div>
                                            <span className="text-green-700 font-semibold">{formatPrice(a.currentHighestBid || a.basePrice)}</span>
                                        </div>
                                        {a.description && <p className="text-sm text-gray-600 mb-3">{a.description}</p>}
                                        <button className="btn-primary w-full flex items-center justify-center" onClick={() => addToCart(a)}>
                                            <ShoppingCart className="h-4 w-4 mr-2" /> Add to Cart
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* CART */}
                {tab === 'cart' && (
                    <div className="card">
                        <div className="card-header">
                            <h3 className="text-lg font-semibold text-gray-900">Your Cart</h3>
                        </div>
                        {cart.length === 0 ? (
                            <p className="text-center text-gray-500 py-8">Cart is empty</p>
                        ) : (
                            <div className="space-y-3">
                                {cart.map((i) => (
                                    <div key={i.id} className="flex items-center justify-between border rounded p-3">
                                        <div>
                                            <p className="font-medium">{i.name}</p>
                                            <p className="text-sm text-gray-600">{formatPrice(i.price)} × {i.quantity}</p>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <button className="px-2 py-1 bg-gray-100 rounded" onClick={() => updateQty(i.id, -1)}>-</button>
                                            <span>{i.quantity}</span>
                                            <button className="px-2 py-1 bg-gray-100 rounded" onClick={() => updateQty(i.id, 1)}>+</button>
                                            <button className="text-red-600 text-sm" onClick={() => removeFromCart(i.id)}>Remove</button>
                                        </div>
                                    </div>
                                ))}
                                <div className="flex items-center justify-between pt-2 border-t">
                                    <span className="font-medium">Total</span>
                                    <span className="font-semibold text-green-700">{formatPrice(cart.reduce((s, i) => s + i.price * i.quantity, 0))}</span>
                                </div>
                                <button className="btn-primary flex items-center justify-center">
                                    <CreditCard className="h-4 w-4 mr-2" />
                                    <span onClick={checkout}>Checkout</span>
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* ORDERS */}
                {tab === 'orders' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        <div className="lg:col-span-1 space-y-3">
                            {orders.length === 0 ? (
                                <div className="card text-center py-8">No orders yet</div>
                            ) : orders.map((o) => (
                                <div key={o.orderId} className={`card cursor-pointer ${selectedOrder?.orderId === o.orderId ? 'ring-2 ring-purple-400' : ''}`} onClick={() => setSelectedOrder(o)}>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-semibold">{o.orderId}</p>
                                            <p className="text-sm text-gray-600">{new Date(o.createdAt).toLocaleString()}</p>
                                        </div>
                                        <span className="status-badge status-in-transit">{o.status.toUpperCase()}</span>
                                    </div>
                                    <div className="text-sm text-gray-600 mt-2">{o.items.length} items • {formatPrice(o.total)}</div>
                                </div>
                            ))}
                        </div>
                        <div className="lg:col-span-2">
                            {selectedOrder ? (
                                <div className="card">
                                    <div className="card-header">
                                        <h3 className="text-lg font-semibold">Order {selectedOrder.orderId}</h3>
                                        <p className="text-sm text-gray-600">Total: {formatPrice(selectedOrder.total)}</p>
                                    </div>
                                    <div className="space-y-3">
                                        {selectedOrder.items.map((i) => (
                                            <div key={i.id} className="flex items-center justify-between border rounded p-2">
                                                <div>
                                                    <p className="font-medium text-sm">{i.name}</p>
                                                    <p className="text-xs text-gray-600">Qty: {i.quantity}</p>
                                                </div>
                                                <span className="text-sm">{formatPrice(i.price * i.quantity)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="card text-center py-12">Select an order to view details</div>
                            )}
                        </div>
                    </div>
                )}

                {/* TRACK */}
                {tab === 'track' && (
                    <>
                        {selectedOrder && (
                            <div className="card">
                                <div className="card-header">
                                    <h3 className="text-lg font-semibold text-gray-900">Track Order - {selectedOrder.orderId}</h3>
                                </div>
                                {/* Order product details */}
                                <div className="px-4 pb-4">
                                    <h4 className="font-medium text-gray-900 mb-2">Products in this order</h4>
                                    <div className="space-y-2">
                                        {selectedOrder.items.map((i) => (
                                            <div key={i.id} className="flex items-center justify-between text-sm border rounded p-2">
                                                <div>
                                                    <p className="font-medium">{i.name}</p>
                                                    <p className="text-gray-600">Qty: {i.quantity}</p>
                                                </div>
                                                <span className="text-gray-900">{formatPrice(i.price * i.quantity)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <MapTracker
                                    truckId={selectedOrder.truckId}
                                    showHistory={true}
                                    destination={selectedOrder.deliveryLocation}
                                />
                            </div>
                        )}

                        {!selectedOrder && scannedShipment && (
                            <div className="space-y-4">
                                <div className="card">
                                    <div className="card-header">
                                        <h3 className="text-lg font-semibold text-gray-900">Track Shipment - {scannedShipment.qrCode || scannedShipment._id}</h3>
                                    </div>
                                    <div className="px-4 pb-4">
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div>
                                                <p className="text-sm text-gray-500">Status</p>
                                                <p className="font-medium capitalize">{(scannedShipment.status || 'in_transit').replace('_', ' ')}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500">Truck</p>
                                                <p className="font-medium">{scannedShipment.truckId || 'N/A'}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500">Destination</p>
                                                <p className="font-medium">{scannedShipment.deliveryLocation?.address || '—'}</p>
                                            </div>
                                        </div>
                                        {/* Product Info if available */}
                                        {scannedShipment.productInfo && (
                                            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                                                {/* Product Details */}
                                                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                                                    <h4 className="font-semibold text-green-900 mb-2">Product Details</h4>
                                                    <div className="text-sm space-y-1">
                                                        <p className="text-green-700"><strong>Crop:</strong> {scannedShipment.productInfo.crop}</p>
                                                        <p className="text-green-700"><strong>Variety:</strong> {scannedShipment.productInfo.variety}</p>
                                                        {scannedShipment.quantity && (
                                                            <p className="text-green-700"><strong>Quantity:</strong> {scannedShipment.quantity} kg</p>
                                                        )}
                                                        {scannedShipment.productInfo.harvestDate && (
                                                            <p className="text-green-700"><strong>Harvest Date:</strong> {new Date(scannedShipment.productInfo.harvestDate).toLocaleDateString()}</p>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Farmer Details */}
                                                {scannedShipment.productInfo.farmer && (
                                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                                        <h4 className="font-semibold text-blue-900 mb-2">Farmer Details</h4>
                                                        <div className="text-sm space-y-1">
                                                            <p className="text-blue-700"><strong>Name:</strong> {scannedShipment.productInfo.farmer.name}</p>
                                                            <p className="text-blue-700"><strong>Location:</strong> {scannedShipment.productInfo.farmer.location}</p>
                                                            {Array.isArray(scannedShipment.productInfo.farmer.certifications) && (
                                                                <div>
                                                                    <p className="text-blue-700"><strong>Certifications:</strong></p>
                                                                    <div className="flex flex-wrap gap-1 mt-1">
                                                                        {scannedShipment.productInfo.farmer.certifications.map((cert, idx) => (
                                                                            <span key={idx} className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded">{cert}</span>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Quality Tests */}
                                                {scannedShipment.productInfo.qualityTests && (
                                                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                                                        <h4 className="font-semibold text-purple-900 mb-2">Quality Tests</h4>
                                                        <div className="text-sm space-y-1">
                                                            <p className="text-purple-700"><strong>Pesticide:</strong> {scannedShipment.productInfo.qualityTests.pesticide}</p>
                                                            <p className="text-purple-700"><strong>Moisture:</strong> {scannedShipment.productInfo.qualityTests.moisture}</p>
                                                            <p className="text-purple-700"><strong>Purity:</strong> {scannedShipment.productInfo.qualityTests.purity}</p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    <MapTracker
                                        truckId={scannedShipment.truckId}
                                        showHistory={true}
                                        destination={scannedShipment.deliveryLocation?.coordinates || scannedShipment.deliveryLocation}
                                    />
                                </div>
                            </div>
                        )}

                        {!selectedOrder && !scannedShipment && (
                            <div className="card text-center py-12">Scan a product QR or select an order to track here</div>
                        )}
                    </>
                )}

                {/* SCAN */}
                {tab === 'scan' && (
                    <div className="card">
                        <div className="card-header">
                            <h3 className="text-lg font-semibold text-gray-900">Scan Product QR</h3>
                        </div>
                        <div className="py-4">
                            {/* Inline scanner with demo buttons; use the scan result to fetch details */}
                            <QRScanner onScan={handleQRScan} />
                            {scanLoading && (
                                <div className="text-sm text-gray-600 mt-3">Looking up shipment details...</div>
                            )}
                            {scanError && (
                                <div className="text-sm text-red-600 mt-3">{scanError}</div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ConsumerDashboard;
