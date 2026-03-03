import React, { useState, useEffect } from 'react';
import { User, MapPin, Save, ArrowLeft } from 'lucide-react';
import api from '../utils/api';

const Settings = ({ user, onBack }) => {
    const [name, setName] = useState(user?.name || '');
    const [location, setLocation] = useState(user?.location || '');
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        // Try loading latest profile from API
        const load = async () => {
            try {
                const res = await api.getProfile();
                if (res.success) {
                    setName(res.user.name || '');
                    setLocation(res.user.location || '');
                }
            } catch { }
        };
        load();
    }, []);

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage('');
        setError('');
        try {
            const res = await api.updateProfile({ name, location });
            if (res.success) {
                // Update local storage user
                const stored = JSON.parse(localStorage.getItem('user') || '{}');
                const updated = { ...stored, name, location };
                localStorage.setItem('user', JSON.stringify(updated));
                setMessage('Profile updated successfully');
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="bg-white border-b">
                <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center">
                        <button onClick={onBack} className="mr-3 text-gray-600 hover:text-gray-800">
                            <ArrowLeft className="h-5 w-5" />
                        </button>
                        <h1 className="text-xl font-semibold text-gray-900">Settings</h1>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 py-8">
                <div className="card">
                    <div className="card-header">
                        <h2 className="text-lg font-semibold text-gray-900">Profile</h2>
                        <p className="text-sm text-gray-600">Update your name and location</p>
                    </div>

                    {message && (
                        <div className="mb-4 p-3 rounded bg-green-50 border border-green-200 text-green-800 text-sm">{message}</div>
                    )}
                    {error && (
                        <div className="mb-4 p-3 rounded bg-red-50 border border-red-200 text-red-800 text-sm">{error}</div>
                    )}

                    <form onSubmit={handleSave} className="space-y-4">
                        <div>
                            <label className="form-label">Full Name</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="form-input pl-10"
                                    placeholder="Your name"
                                    required
                                />
                                <User className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            </div>
                        </div>

                        <div>
                            <label className="form-label">Location</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={location}
                                    onChange={(e) => setLocation(e.target.value)}
                                    className="form-input pl-10"
                                    placeholder="City, State"
                                />
                                <MapPin className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            </div>
                            <p className="text-xs text-gray-500 mt-1">Used to personalize weather and logistics suggestions.</p>
                        </div>

                        <button type="submit" disabled={saving} className="btn-primary flex items-center">
                            {saving ? <div className="loading-spinner h-4 w-4 mr-2"></div> : <Save className="h-4 w-4 mr-2" />}
                            Save Changes
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Settings;
