import React, { useState } from 'react';
import { Sprout, Users, Truck, Package, Eye, EyeOff } from 'lucide-react';
import api from '../utils/api';

const LoginPage = ({ onLogin }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'farmer',
        location: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const roles = [
        { value: 'farmer', label: 'Farmer', icon: Sprout, color: 'bg-green-500', description: 'Sell crops and create auctions' },
        { value: 'retailer', label: 'Retailer', icon: Users, color: 'bg-blue-500', description: 'Buy crops through auctions' },
        { value: 'distributor', label: 'Distributor', icon: Truck, color: 'bg-orange-500', description: 'Transport goods and track shipments' },
        { value: 'consumer', label: 'Consumer', icon: Package, color: 'bg-purple-500', description: 'Track product origins' }
    ];

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            let response;
            if (isLogin) {
                response = await api.login({
                    email: formData.email,
                    password: formData.password
                });
            } else {
                response = await api.register(formData);
                if (response.success) {
                    // Auto-login after registration
                    const loginResponse = await api.login({
                        email: formData.email,
                        password: formData.password
                    });
                    response = loginResponse;
                }
            }

            if (response.success) {
                onLogin(response.user, response.token);
            }
        } catch (err) {
            setError(err.response?.data?.error || 'An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const selectedRole = roles.find(role => role.value === formData.role);

    return (
        <div className="min-h-screen flex">
            {/* Left side - Hero section */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-agri-green-600 to-agri-green-800 text-white">
                <div className="flex flex-col justify-center px-12 py-24">
                    <div className="mb-8">
                        <Sprout className="h-16 w-16 mb-4" />
                        <h1 className="text-5xl font-bold mb-4">Agri Supply Chain</h1>
                        <p className="text-xl opacity-90 mb-8">
                            Connecting farmers, retailers, distributors, and consumers in a transparent,
                            trackable agricultural ecosystem.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        {roles.map((role) => {
                            const Icon = role.icon;
                            return (
                                <div key={role.value} className="bg-white bg-opacity-10 rounded-lg p-4 backdrop-blur-sm">
                                    <Icon className="h-8 w-8 mb-2" />
                                    <h3 className="font-semibold text-lg">{role.label}</h3>
                                    <p className="text-sm opacity-90">{role.description}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Right side - Login/Register form */}
            <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
                <div className="max-w-md w-full space-y-8">
                    <div className="text-center">
                        <div className="lg:hidden mb-6">
                            <Sprout className="h-12 w-12 mx-auto text-agri-green-600 mb-2" />
                        </div>
                        <h2 className="text-3xl font-bold text-gray-900">
                            {isLogin ? 'Sign in to your account' : 'Create your account'}
                        </h2>
                        <p className="mt-2 text-gray-600">
                            {isLogin ? 'Welcome back to Agri Supply Chain' : 'Join the agricultural revolution'}
                        </p>
                    </div>

                    <form className="space-y-6" onSubmit={handleSubmit}>
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                                {error}
                            </div>
                        )}

                        {!isLogin && (
                            <div>
                                <label className="form-label">Full Name</label>
                                <input
                                    name="name"
                                    type="text"
                                    required={!isLogin}
                                    className="form-input"
                                    placeholder="Enter your full name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                />
                            </div>
                        )}

                        <div>
                            <label className="form-label">Email Address</label>
                            <input
                                name="email"
                                type="email"
                                required
                                className="form-input"
                                placeholder="Enter your email"
                                value={formData.email}
                                onChange={handleInputChange}
                            />
                        </div>

                        <div>
                            <label className="form-label">Password</label>
                            <div className="relative">
                                <input
                                    name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    className="form-input pr-10"
                                    placeholder="Enter your password"
                                    value={formData.password}
                                    onChange={handleInputChange}
                                />
                                <button
                                    type="button"
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-5 w-5 text-gray-400" />
                                    ) : (
                                        <Eye className="h-5 w-5 text-gray-400" />
                                    )}
                                </button>
                            </div>
                        </div>

                        {!isLogin && (
                            <>
                                <div>
                                    <label className="form-label">Role</label>
                                    <select
                                        name="role"
                                        className="form-input"
                                        value={formData.role}
                                        onChange={handleInputChange}
                                    >
                                        {roles.map(role => (
                                            <option key={role.value} value={role.value}>
                                                {role.label} - {role.description}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {selectedRole && (
                                    <div className={`${selectedRole.color} bg-opacity-10 border border-current border-opacity-20 rounded-lg p-4`}>
                                        <div className="flex items-center">
                                            <selectedRole.icon className={`h-6 w-6 mr-3 ${selectedRole.color.replace('bg-', 'text-')}`} />
                                            <div>
                                                <h4 className="font-semibold">{selectedRole.label}</h4>
                                                <p className="text-sm opacity-80">{selectedRole.description}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <label className="form-label">Location (Optional)</label>
                                    <input
                                        name="location"
                                        type="text"
                                        className="form-input"
                                        placeholder="City, State"
                                        value={formData.location}
                                        onChange={handleInputChange}
                                    />
                                </div>
                            </>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full btn-primary flex items-center justify-center"
                        >
                            {loading ? (
                                <div className="loading-spinner h-5 w-5 border-white"></div>
                            ) : (
                                isLogin ? 'Sign In' : 'Create Account'
                            )}
                        </button>

                        <div className="text-center">
                            <button
                                type="button"
                                onClick={() => setIsLogin(!isLogin)}
                                className="text-agri-green-600 hover:text-agri-green-500 font-medium"
                            >
                                {isLogin ? 'Need an account? Sign up' : 'Already have an account? Sign in'}
                            </button>
                        </div>
                    </form>

                    {/* Demo credentials */}
                    <div className="bg-gray-50 rounded-lg p-4 mt-6">
                        <h4 className="font-semibold text-gray-700 mb-2">Demo Credentials:</h4>
                        <div className="text-sm text-gray-600 space-y-1">
                            <p><strong>Farmer:</strong> farmer@demo.com / password</p>
                            <p><strong>Retailer:</strong> retailer@demo.com / password</p>
                            <p><strong>Distributor:</strong> distributor@demo.com / password</p>
                            <p><strong>Consumer:</strong> consumer@demo.com / password</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;