import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

// Import pages
import LoginPage from './pages/LoginPage';
import FarmerDashboard from './pages/FarmerDashboard';
import RetailerAuction from './pages/RetailerAuction';
import DistributorTracking from './pages/DistributorTracking';
import ConsumerScan from './pages/ConsumerScan';
import ConsumerDashboard from './pages/ConsumerDashboard';
import Settings from './pages/Settings';

function App() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkAuthStatus();
    }, []);

    const checkAuthStatus = () => {
        const token = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        if (token && storedUser) {
            try {
                const decoded = jwtDecode(token);
                const currentTime = Date.now() / 1000;

                if (decoded.exp > currentTime) {
                    setUser(JSON.parse(storedUser));
                } else {
                    // Token expired
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                }
            } catch (error) {
                console.error('Invalid token:', error);
                localStorage.removeItem('token');
                localStorage.removeItem('user');
            }
        }

        setLoading(false);
    };

    const handleLogin = (userData, token) => {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="loading-spinner"></div>
            </div>
        );
    }

    return (
        <Router>
            <div className="min-h-screen bg-gray-50">
                <Routes>
                    <Route
                        path="/"
                        element={
                            !user ? (
                                <LoginPage onLogin={handleLogin} />
                            ) : (
                                <Navigate to={`/${user.role}`} replace />
                            )
                        }
                    />

                    <Route
                        path="/farmer"
                        element={
                            user && user.role === 'farmer' ? (
                                <FarmerDashboard user={user} onLogout={handleLogout} />
                            ) : (
                                <Navigate to="/" replace />
                            )
                        }
                    />

                    <Route
                        path="/retailer"
                        element={
                            user && user.role === 'retailer' ? (
                                <RetailerAuction user={user} onLogout={handleLogout} />
                            ) : (
                                <Navigate to="/" replace />
                            )
                        }
                    />

                    <Route
                        path="/distributor"
                        element={
                            user && user.role === 'distributor' ? (
                                <DistributorTracking user={user} onLogout={handleLogout} />
                            ) : (
                                <Navigate to="/" replace />
                            )
                        }
                    />

                    <Route
                        path="/consumer"
                        element={
                            user && user.role === 'consumer' ? (
                                <ConsumerDashboard user={user} onLogout={handleLogout} />
                            ) : (
                                <Navigate to="/" replace />
                            )
                        }
                    />

                    {/* Settings (all authenticated roles) */}
                    <Route
                        path="/settings"
                        element={
                            user ? (
                                <Settings
                                    user={user}
                                    onBack={() => {
                                        // Navigate back to role dashboard
                                        window.location.href = `/${user.role}`;
                                    }}
                                />
                            ) : (
                                <Navigate to="/" replace />
                            )
                        }
                    />

                    {/* Catch-all route */}
                    <Route
                        path="*"
                        element={<Navigate to="/" replace />}
                    />
                </Routes>
            </div>
        </Router>
    );
}

export default App;