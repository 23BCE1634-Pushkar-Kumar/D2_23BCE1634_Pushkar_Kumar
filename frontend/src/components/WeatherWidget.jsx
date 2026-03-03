import React, { useState, useEffect } from 'react';
import { Cloud, Thermometer, Droplets, Wind, Eye, Sun } from 'lucide-react';
import api from '../utils/api';

const WeatherWidget = ({ location = "28.61,77.20", crop = null }) => {
    const [weather, setWeather] = useState(null);
    const [cropAdvice, setCropAdvice] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchWeatherData();
        if (crop) {
            fetchCropAdvice();
        }
    }, [location, crop]);

    const fetchWeatherData = async () => {
        try {
            const [lat, lon] = location.split(',');
            const response = await api.getCurrentWeather(parseFloat(lat), parseFloat(lon));
            setWeather(response.weather);
        } catch (err) {
            setError('Failed to fetch weather data');
            console.error('Weather error:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchCropAdvice = async () => {
        try {
            const [lat, lon] = location.split(',');
            const response = await api.getCropAdvice(crop, parseFloat(lat), parseFloat(lon));
            setCropAdvice(response.advice);
        } catch (err) {
            console.error('Crop advice error:', err);
        }
    };

    const getWeatherIcon = (description) => {
        const desc = description?.toLowerCase() || '';
        if (desc.includes('sunny')) return <Sun className="h-8 w-8 text-yellow-500" />;
        if (desc.includes('cloud')) return <Cloud className="h-8 w-8 text-gray-500" />;
        if (desc.includes('rain')) return <Droplets className="h-8 w-8 text-blue-500" />;
        return <Cloud className="h-8 w-8 text-gray-500" />;
    };

    if (loading) {
        return (
            <div className="card">
                <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
                    <div className="h-8 bg-gray-200 rounded w-full"></div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="card">
                <div className="text-red-500">
                    <Cloud className="h-8 w-8 mb-2" />
                    <p>{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="card">
            <div className="card-header">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <Cloud className="h-5 w-5 mr-2" />
                    Weather Information
                </h3>
            </div>

            {weather && (
                <div className="space-y-4">
                    {/* Current Weather */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            {getWeatherIcon(weather.current.description)}
                            <div>
                                <p className="text-2xl font-bold text-gray-900">
                                    {weather.current.temperature}°C
                                </p>
                                <p className="text-sm text-gray-600 capitalize">
                                    {weather.current.description}
                                </p>
                            </div>
                        </div>
                        <div className="text-right text-sm text-gray-600">
                            <p>{weather.location.city}</p>
                            <p>{new Date(weather.timestamp).toLocaleTimeString()}</p>
                        </div>
                    </div>

                    {/* Weather Details */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="flex items-center space-x-2">
                            <Droplets className="h-4 w-4 text-blue-500" />
                            <span className="text-sm">
                                <span className="font-medium">{weather.current.humidity}%</span>
                                <span className="text-gray-500 block">Humidity</span>
                            </span>
                        </div>

                        <div className="flex items-center space-x-2">
                            <Wind className="h-4 w-4 text-gray-500" />
                            <span className="text-sm">
                                <span className="font-medium">{weather.current.windSpeed} km/h</span>
                                <span className="text-gray-500 block">Wind Speed</span>
                            </span>
                        </div>

                        <div className="flex items-center space-x-2">
                            <Thermometer className="h-4 w-4 text-red-500" />
                            <span className="text-sm">
                                <span className="font-medium">{weather.current.pressure} hPa</span>
                                <span className="text-gray-500 block">Pressure</span>
                            </span>
                        </div>

                        <div className="flex items-center space-x-2">
                            <Eye className="h-4 w-4 text-purple-500" />
                            <span className="text-sm">
                                <span className="font-medium">{weather.current.visibility} km</span>
                                <span className="text-gray-500 block">Visibility</span>
                            </span>
                        </div>
                    </div>

                    {/* Weather Alerts */}
                    {weather.alerts && weather.alerts.length > 0 && (
                        <div className="mt-4">
                            <h4 className="font-medium text-gray-900 mb-2">Weather Alerts</h4>
                            <div className="space-y-2">
                                {weather.alerts.map((alert, index) => (
                                    <div
                                        key={index}
                                        className={`p-3 rounded-lg border ${alert.severity === 'high' ? 'bg-red-50 border-red-200 text-red-800' :
                                            alert.severity === 'medium' ? 'bg-yellow-50 border-yellow-200 text-yellow-800' :
                                                'bg-blue-50 border-blue-200 text-blue-800'
                                            }`}
                                    >
                                        <p className="text-sm font-medium">{alert.type.replace('_', ' ').toUpperCase()}</p>
                                        <p className="text-sm">{alert.message}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* 3-Day Forecast */}
                    <div className="mt-4">
                        <h4 className="font-medium text-gray-900 mb-3">3-Day Forecast</h4>
                        <div className="grid grid-cols-3 gap-4">
                            {weather.forecast.map((day, index) => (
                                <div key={index} className="text-center p-3 bg-gray-50 rounded-lg">
                                    <p className="text-sm font-medium text-gray-900">{day.day}</p>
                                    {getWeatherIcon(day.description)}
                                    <p className="text-xs text-gray-600 mt-1 capitalize">{day.description}</p>
                                    <div className="flex justify-center space-x-2 mt-2 text-sm">
                                        <span className="font-medium">{day.high}°</span>
                                        <span className="text-gray-500">{day.low}°</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Crop-specific Advice */}
                    {crop && cropAdvice && (
                        <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4">
                            <h4 className="font-medium text-green-900 mb-2">
                                Advice for {crop.charAt(0).toUpperCase() + crop.slice(1)}
                            </h4>
                            <div className="space-y-2 text-sm text-green-800">
                                <p><strong>Watering:</strong> {cropAdvice.wateringAdvice}</p>
                                <p><strong>Temperature:</strong> {cropAdvice.temperatureAlert}</p>
                                <div>
                                    <strong>General Tips:</strong>
                                    <ul className="list-disc list-inside mt-1 space-y-1">
                                        {cropAdvice.generalTips.map((tip, index) => (
                                            <li key={index}>{tip}</li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default WeatherWidget;