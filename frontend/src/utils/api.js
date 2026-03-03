import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

class ApiService {
    constructor() {
        this.api = axios.create({
            baseURL: API_BASE_URL,
            timeout: 10000,
            headers: {
                'Content-Type': 'application/json',
            },
        });

        // Request interceptor to add auth token
        this.api.interceptors.request.use(
            (config) => {
                const token = localStorage.getItem('token');
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                }
                return config;
            },
            (error) => {
                return Promise.reject(error);
            }
        );

        // Response interceptor to handle auth errors
        this.api.interceptors.response.use(
            (response) => response,
            (error) => {
                if (error.response?.status === 401) {
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    window.location.href = '/';
                }
                return Promise.reject(error);
            }
        );
    }

    // Auth methods
    async register(userData) {
        const response = await this.api.post('/auth/register', userData);
        return response.data;
    }

    async login(credentials) {
        const response = await this.api.post('/auth/login', credentials);
        if (response.data.success) {
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.user));
        }
        return response.data;
    }

    async getProfile() {
        const response = await this.api.get('/auth/profile');
        return response.data;
    }

    async updateProfile(userData) {
        const response = await this.api.put('/auth/profile', userData);
        return response.data;
    }

    // Auction methods
    async createAuction(auctionData) {
        const response = await this.api.post('/auctions/create', auctionData);
        return response.data;
    }

    async classifyImages(formData) {
        const response = await this.api.post('/auctions/classify-images', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
            timeout: 60000, // 60 seconds for image processing
        });
        return response.data;
    }

    async getOpenAuctions() {
        const response = await this.api.get('/auctions/open');
        return response.data;
    }

    async getAuction(auctionId) {
        const response = await this.api.get(`/auctions/${auctionId}`);
        return response.data;
    }

    async placeBid(auctionId, bidAmount) {
        const response = await this.api.post(`/auctions/${auctionId}/bid`, { bidAmount });
        return response.data;
    }

    async getFarmerAuctions() {
        const response = await this.api.get('/auctions/farmer/my-auctions');
        return response.data;
    }

    async getRetailerBids() {
        const response = await this.api.get('/auctions/retailer/my-bids');
        return response.data;
    }

    async closeAuction(auctionId, winnerId = null) {
        const response = await this.api.put(`/auctions/${auctionId}/close`, { winnerId });
        return response.data;
    }

    // GPS Tracking methods
    async recordLocation(truckId, locationData) {
        const response = await this.api.post(`/tracker/${truckId}/location`, locationData);
        return response.data;
    }

    async getLatestLocation(truckId) {
        const response = await this.api.get(`/tracker/${truckId}/latest`);
        return response.data;
    }

    async getLocationHistory(truckId, hours = 24) {
        const response = await this.api.get(`/tracker/${truckId}/history?hours=${hours}`);
        return response.data;
    }

    async getActiveTrucks() {
        const response = await this.api.get('/tracker/active-trucks');
        return response.data;
    }

    async calculateETA(truckId, destinationLat, destinationLon) {
        const response = await this.api.get(`/tracker/${truckId}/eta?destinationLat=${destinationLat}&destinationLon=${destinationLon}`);
        return response.data;
    }

    // Shipment methods
    async createShipment(shipmentData) {
        const response = await this.api.post('/shipments/create', shipmentData);
        return response.data;
    }

    async updateShipmentStatus(shipmentId, status, note = '') {
        const response = await this.api.put(`/shipments/${shipmentId}/status`, { status, note });
        return response.data;
    }

    async getShipmentByQR(qrCode) {
        const response = await this.api.get(`/shipments/qr/${qrCode}`);
        return response.data;
    }

    async getShipmentsByTruck(truckId) {
        const response = await this.api.get(`/shipments/truck/${truckId}`);
        return response.data;
    }

    async getMyShipments() {
        const response = await this.api.get('/shipments/my-shipments');
        return response.data;
    }

    // Weather methods
    async getCurrentWeather(lat, lon) {
        const response = await this.api.get(`/weather/current?lat=${lat}&lon=${lon}`);
        return response.data;
    }

    async getCropAdvice(crop, lat, lon) {
        const response = await this.api.get(`/weather/crop-advice?crop=${crop}&lat=${lat}&lon=${lon}`);
        return response.data;
    }

    // Utility methods
    logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/';
    }

    getStoredUser() {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    }

    getToken() {
        return localStorage.getItem('token');
    }

    isAuthenticated() {
        return !!this.getToken();
    }

    // Blockchain methods
    async createBlockchainAuction(auctionData) {
        const response = await this.api.post('/blockchain/auction/create', auctionData);
        return response.data;
    }

    async getBlockchainAuctions() {
        const response = await this.api.get('/blockchain/auctions/active');
        return response.data;
    }

    async createBlockchainShipment(shipmentData) {
        const response = await this.api.post('/blockchain/tracking/create', shipmentData);
        return response.data;
    }

    async updateGPSLocation(shipmentId, locationData) {
        const response = await this.api.post(`/blockchain/tracking/${shipmentId}/location`, locationData);
        return response.data;
    }

    async createBlockchainProduct(productData) {
        const response = await this.api.post('/blockchain/provenance/create', productData);
        return response.data;
    }

    async getProductByQR(qrCode) {
        const response = await this.api.get(`/blockchain/qr/${qrCode}`);
        return response.data;
    }

    async placeBlockchainBid(bidData) {
        const { auctionId, ...bidPayload } = bidData;
        const response = await this.api.post(`/blockchain/auction/${auctionId}/bid`, bidPayload);
        return response.data;
    }
}

export default new ApiService();