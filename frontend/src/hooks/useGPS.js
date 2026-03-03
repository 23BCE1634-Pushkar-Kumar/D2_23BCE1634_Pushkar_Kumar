import { useState, useEffect } from 'react';
import { getContract, getReadOnlyContract, getWalletInfo } from '../blockchain/wallet';

export const useGPS = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [shipments, setShipments] = useState([]);
    const [trackingHistory, setTrackingHistory] = useState({});

    /**
     * Create a new shipment
     */
    const createShipment = async (shipmentData) => {
        setLoading(true);
        setError(null);

        try {
            const {
                auctionId,
                farmer,
                retailer,
                truckId,
                expectedDeliveryTime,
                productDetails
            } = shipmentData;

            const contract = getContract('TrackingContract');

            const tx = await contract.createShipment(
                auctionId,
                farmer,
                retailer,
                truckId,
                Math.floor(expectedDeliveryTime / 1000), // Convert to Unix timestamp
                productDetails || ''
            );

            const receipt = await tx.wait();

            // Extract shipment ID from event logs
            const shipmentCreatedEvent = receipt.logs.find(log => {
                try {
                    return contract.interface.parseLog(log).name === 'ShipmentCreated';
                } catch {
                    return false;
                }
            });

            let shipmentId = null;
            if (shipmentCreatedEvent) {
                const parsed = contract.interface.parseLog(shipmentCreatedEvent);
                shipmentId = Number(parsed.args.shipmentId);
            }

            setLoading(false);
            return {
                success: true,
                shipmentId,
                transactionHash: tx.hash,
                blockNumber: receipt.blockNumber
            };
        } catch (err) {
            console.error('Error creating shipment:', err);
            setError(err.message);
            setLoading(false);
            throw err;
        }
    };

    /**
     * Update GPS location for a shipment
     */
    const updateLocation = async (locationData) => {
        setLoading(true);
        setError(null);

        try {
            const {
                shipmentId,
                latitude,
                longitude,
                speed,
                location,
                emergencyBrake,
                additionalData
            } = locationData;

            const contract = getContract('TrackingContract');

            // Convert lat/lon to integers (multiply by 10^6 for precision)
            const latInt = Math.floor(latitude * 1000000);
            const lonInt = Math.floor(longitude * 1000000);

            const tx = await contract.updateLocation(
                shipmentId,
                latInt,
                lonInt,
                speed || 0,
                location || '',
                emergencyBrake || false,
                additionalData || ''
            );

            const receipt = await tx.wait();

            setLoading(false);
            return {
                success: true,
                transactionHash: tx.hash,
                blockNumber: receipt.blockNumber
            };
        } catch (err) {
            console.error('Error updating location:', err);
            setError(err.message);
            setLoading(false);
            throw err;
        }
    };

    /**
     * Mark shipment as delivered
     */
    const markDelivered = async (shipmentId) => {
        setLoading(true);
        setError(null);

        try {
            const contract = getContract('TrackingContract');
            const tx = await contract.markDelivered(shipmentId);
            const receipt = await tx.wait();

            setLoading(false);
            return {
                success: true,
                transactionHash: tx.hash,
                blockNumber: receipt.blockNumber
            };
        } catch (err) {
            console.error('Error marking shipment as delivered:', err);
            setError(err.message);
            setLoading(false);
            throw err;
        }
    };

    /**
     * Get shipment details by ID
     */
    const getShipment = async (shipmentId) => {
        try {
            const contract = await getReadOnlyContract('TrackingContract');
            const shipment = await contract.getShipment(shipmentId);

            return {
                shipmentId: Number(shipment.shipmentId),
                auctionId: Number(shipment.auctionId),
                farmer: shipment.farmer,
                distributor: shipment.distributor,
                retailer: shipment.retailer,
                truckId: shipment.truckId,
                startTime: Number(shipment.startTime),
                expectedDeliveryTime: Number(shipment.expectedDeliveryTime),
                actualDeliveryTime: Number(shipment.actualDeliveryTime),
                isDelivered: shipment.isDelivered,
                isActive: shipment.isActive,
                productDetails: shipment.productDetails
            };
        } catch (err) {
            console.error('Error fetching shipment:', err);
            throw err;
        }
    };

    /**
     * Get tracking history for a shipment
     */
    const getTrackingHistory = async (shipmentId) => {
        setLoading(true);
        try {
            const contract = await getReadOnlyContract('TrackingContract');
            const history = await contract.getTrackingHistory(shipmentId);

            const formattedHistory = history.map(location => ({
                timestamp: Number(location.timestamp),
                latitude: Number(location.latitude) / 1000000,
                longitude: Number(location.longitude) / 1000000,
                speed: Number(location.speed),
                location: location.location,
                emergencyBrake: location.emergencyBrake,
                additionalData: location.additionalData
            }));

            setTrackingHistory(prev => ({
                ...prev,
                [shipmentId]: formattedHistory
            }));

            setLoading(false);
            return formattedHistory;
        } catch (err) {
            console.error('Error fetching tracking history:', err);
            setError(err.message);
            setLoading(false);
            return [];
        }
    };

    /**
     * Get latest location for a shipment
     */
    const getLatestLocation = async (shipmentId) => {
        try {
            const contract = await getReadOnlyContract('TrackingContract');
            const location = await contract.getLatestLocation(shipmentId);

            return {
                timestamp: Number(location.timestamp),
                latitude: Number(location.latitude) / 1000000,
                longitude: Number(location.longitude) / 1000000,
                speed: Number(location.speed),
                location: location.location,
                emergencyBrake: location.emergencyBrake,
                additionalData: location.additionalData
            };
        } catch (err) {
            console.error('Error fetching latest location:', err);
            throw err;
        }
    };

    /**
     * Get shipments for a truck
     */
    const getTruckShipments = async (truckId) => {
        setLoading(true);
        try {
            const contract = await getReadOnlyContract('TrackingContract');
            const shipmentIds = await contract.getTruckShipments(truckId);

            const shipmentsData = await Promise.all(
                shipmentIds.map(async (id) => {
                    const shipment = await getShipment(Number(id));
                    return shipment;
                })
            );

            setLoading(false);
            return shipmentsData;
        } catch (err) {
            console.error('Error fetching truck shipments:', err);
            setError(err.message);
            setLoading(false);
            return [];
        }
    };

    /**
     * Get shipments for a distributor
     */
    const getDistributorShipments = async (distributorAddress) => {
        setLoading(true);
        try {
            const contract = await getReadOnlyContract('TrackingContract');
            const { address } = getWalletInfo();
            const distributor = distributorAddress || address;

            if (!distributor) {
                throw new Error('Distributor address not available');
            }

            const shipmentIds = await contract.getDistributorShipments(distributor);

            const shipmentsData = await Promise.all(
                shipmentIds.map(async (id) => {
                    const shipment = await getShipment(Number(id));
                    return shipment;
                })
            );

            setShipments(shipmentsData);
            setLoading(false);
            return shipmentsData;
        } catch (err) {
            console.error('Error fetching distributor shipments:', err);
            setError(err.message);
            setLoading(false);
            return [];
        }
    };

    /**
     * Get shipments by auction ID
     */
    const getShipmentsByAuction = async (auctionId) => {
        setLoading(true);
        try {
            const contract = await getReadOnlyContract('TrackingContract');
            const shipmentIds = await contract.getShipmentByAuction(auctionId);

            const shipmentsData = await Promise.all(
                shipmentIds.map(async (id) => {
                    const shipment = await getShipment(Number(id));
                    return shipment;
                })
            );

            setLoading(false);
            return shipmentsData;
        } catch (err) {
            console.error('Error fetching auction shipments:', err);
            setError(err.message);
            setLoading(false);
            return [];
        }
    };

    /**
     * Get estimated delivery time
     */
    const getEstimatedDeliveryTime = async (shipmentId) => {
        try {
            const contract = await getReadOnlyContract('TrackingContract');
            const estimatedTime = await contract.getEstimatedDeliveryTime(shipmentId);
            return Number(estimatedTime);
        } catch (err) {
            console.error('Error fetching estimated delivery time:', err);
            throw err;
        }
    };

    /**
     * Calculate distance between two coordinates
     */
    const calculateDistance = (lat1, lon1, lat2, lon2) => {
        const R = 6371; // Radius of the Earth in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c; // Distance in km
    };

    /**
     * Check if shipment is delayed
     */
    const isShipmentDelayed = (shipment) => {
        const now = Date.now() / 1000;
        return now > shipment.expectedDeliveryTime && !shipment.isDelivered;
    };

    /**
     * Get delivery status
     */
    const getDeliveryStatus = (shipment) => {
        if (shipment.isDelivered) return 'delivered';
        if (isShipmentDelayed(shipment)) return 'delayed';
        if (shipment.isActive) return 'in-transit';
        return 'pending';
    };

    return {
        loading,
        error,
        shipments,
        trackingHistory,
        createShipment,
        updateLocation,
        markDelivered,
        getShipment,
        getTrackingHistory,
        getLatestLocation,
        getTruckShipments,
        getDistributorShipments,
        getShipmentsByAuction,
        getEstimatedDeliveryTime,
        calculateDistance,
        isShipmentDelayed,
        getDeliveryStatus
    };
};