import { useState, useEffect } from 'react';
import { getContract, getReadOnlyContract, getWalletInfo } from '../blockchain/wallet';

export const useProvenance = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [products, setProducts] = useState([]);
    const [productHistory, setProductHistory] = useState({});

    const stages = {
        0: 'FARMING',
        1: 'HARVESTED',
        2: 'PROCESSED',
        3: 'PACKAGED',
        4: 'IN_TRANSIT',
        5: 'DELIVERED',
        6: 'RETAIL'
    };

    /**
     * Create a new product record
     */
    const createProduct = async (productData) => {
        setLoading(true);
        setError(null);

        try {
            const {
                auctionId,
                crop,
                variety,
                quantity,
                qualityGrade,
                qualityConfidence,
                farmLocation,
                harvestDate,
                expiryDate,
                certifications,
                qrCodeHash
            } = productData;

            const contract = getContract('ProvenanceContract');

            const tx = await contract.createProduct(
                auctionId,
                crop,
                variety || '',
                quantity,
                qualityGrade || '',
                qualityConfidence || 0,
                farmLocation || '',
                Math.floor(harvestDate / 1000), // Convert to Unix timestamp
                Math.floor(expiryDate / 1000), // Convert to Unix timestamp
                certifications || [],
                qrCodeHash
            );

            const receipt = await tx.wait();

            // Extract product ID from event logs
            const productCreatedEvent = receipt.logs.find(log => {
                try {
                    return contract.interface.parseLog(log).name === 'ProductCreated';
                } catch {
                    return false;
                }
            });

            let productId = null;
            if (productCreatedEvent) {
                const parsed = contract.interface.parseLog(productCreatedEvent);
                productId = Number(parsed.args.productId);
            }

            setLoading(false);
            return {
                success: true,
                productId,
                transactionHash: tx.hash,
                blockNumber: receipt.blockNumber
            };
        } catch (err) {
            console.error('Error creating product:', err);
            setError(err.message);
            setLoading(false);
            throw err;
        }
    };

    /**
     * Add a stage record to product history
     */
    const addStageRecord = async (stageData) => {
        setLoading(true);
        setError(null);

        try {
            const {
                productId,
                stage,
                location,
                notes,
                evidenceHashes,
                temperature,
                humidity
            } = stageData;

            const contract = getContract('ProvenanceContract');

            const tx = await contract.addStageRecord(
                productId,
                stage,
                location || '',
                notes || '',
                evidenceHashes || [],
                temperature || '',
                humidity || ''
            );

            const receipt = await tx.wait();

            setLoading(false);
            return {
                success: true,
                transactionHash: tx.hash,
                blockNumber: receipt.blockNumber
            };
        } catch (err) {
            console.error('Error adding stage record:', err);
            setError(err.message);
            setLoading(false);
            throw err;
        }
    };

    /**
     * Mark product as harvested
     */
    const markHarvested = async (productId, location, notes, evidenceHashes) => {
        return addStageRecord({
            productId,
            stage: 1, // HARVESTED
            location,
            notes,
            evidenceHashes
        });
    };

    /**
     * Mark product as processed
     */
    const markProcessed = async (productId, location, notes, evidenceHashes, temperature) => {
        setLoading(true);
        setError(null);

        try {
            const contract = getContract('ProvenanceContract');

            const tx = await contract.markProcessed(
                productId,
                location || '',
                notes || '',
                evidenceHashes || [],
                temperature || ''
            );

            const receipt = await tx.wait();

            setLoading(false);
            return {
                success: true,
                transactionHash: tx.hash,
                blockNumber: receipt.blockNumber
            };
        } catch (err) {
            console.error('Error marking as processed:', err);
            setError(err.message);
            setLoading(false);
            throw err;
        }
    };

    /**
     * Mark product as packaged
     */
    const markPackaged = async (productId, location, notes, evidenceHashes) => {
        setLoading(true);
        setError(null);

        try {
            const contract = getContract('ProvenanceContract');

            const tx = await contract.markPackaged(
                productId,
                location || '',
                notes || '',
                evidenceHashes || []
            );

            const receipt = await tx.wait();

            setLoading(false);
            return {
                success: true,
                transactionHash: tx.hash,
                blockNumber: receipt.blockNumber
            };
        } catch (err) {
            console.error('Error marking as packaged:', err);
            setError(err.message);
            setLoading(false);
            throw err;
        }
    };

    /**
     * Transfer product to distributor
     */
    const transferToDistributor = async (productId, distributorAddress, shipmentId, notes) => {
        setLoading(true);
        setError(null);

        try {
            const contract = getContract('ProvenanceContract');

            const tx = await contract.transferToDistributor(
                productId,
                distributorAddress,
                shipmentId,
                notes || ''
            );

            const receipt = await tx.wait();

            setLoading(false);
            return {
                success: true,
                transactionHash: tx.hash,
                blockNumber: receipt.blockNumber
            };
        } catch (err) {
            console.error('Error transferring to distributor:', err);
            setError(err.message);
            setLoading(false);
            throw err;
        }
    };

    /**
     * Transfer product to retailer
     */
    const transferToRetailer = async (productId, retailerAddress, deliveryLocation, notes) => {
        setLoading(true);
        setError(null);

        try {
            const contract = getContract('ProvenanceContract');

            const tx = await contract.transferToRetailer(
                productId,
                retailerAddress,
                deliveryLocation || '',
                notes || ''
            );

            const receipt = await tx.wait();

            setLoading(false);
            return {
                success: true,
                transactionHash: tx.hash,
                blockNumber: receipt.blockNumber
            };
        } catch (err) {
            console.error('Error transferring to retailer:', err);
            setError(err.message);
            setLoading(false);
            throw err;
        }
    };

    /**
     * Mark product as available at retail
     */
    const markRetailAvailable = async (productId, retailLocation, notes) => {
        setLoading(true);
        setError(null);

        try {
            const contract = getContract('ProvenanceContract');

            const tx = await contract.markRetailAvailable(
                productId,
                retailLocation || '',
                notes || ''
            );

            const receipt = await tx.wait();

            setLoading(false);
            return {
                success: true,
                transactionHash: tx.hash,
                blockNumber: receipt.blockNumber
            };
        } catch (err) {
            console.error('Error marking retail available:', err);
            setError(err.message);
            setLoading(false);
            throw err;
        }
    };

    /**
     * Verify product quality
     */
    const verifyQuality = async (productId, newQualityGrade, newConfidence, notes) => {
        setLoading(true);
        setError(null);

        try {
            const contract = getContract('ProvenanceContract');

            const tx = await contract.verifyQuality(
                productId,
                newQualityGrade,
                newConfidence,
                notes || ''
            );

            const receipt = await tx.wait();

            setLoading(false);
            return {
                success: true,
                transactionHash: tx.hash,
                blockNumber: receipt.blockNumber
            };
        } catch (err) {
            console.error('Error verifying quality:', err);
            setError(err.message);
            setLoading(false);
            throw err;
        }
    };

    /**
     * Get product by QR code hash
     */
    const getProductByQR = async (qrCodeHash) => {
        setLoading(true);
        try {
            const contract = await getReadOnlyContract('ProvenanceContract');
            const product = await contract.getProductByQR(qrCodeHash);

            const formattedProduct = {
                productId: Number(product.productId),
                auctionId: Number(product.auctionId),
                shipmentId: Number(product.shipmentId),
                farmer: product.farmer,
                distributor: product.distributor,
                retailer: product.retailer,
                crop: product.crop,
                variety: product.variety,
                quantity: Number(product.quantity),
                qualityGrade: product.qualityGrade,
                qualityConfidence: Number(product.qualityConfidence),
                farmLocation: product.farmLocation,
                harvestDate: Number(product.harvestDate),
                expiryDate: Number(product.expiryDate),
                certifications: product.certifications,
                qrCodeHash: product.qrCodeHash,
                isActive: product.isActive
            };

            setLoading(false);
            return formattedProduct;
        } catch (err) {
            console.error('Error fetching product by QR:', err);
            setError(err.message);
            setLoading(false);
            throw err;
        }
    };

    /**
     * Get complete product history
     */
    const getProductHistory = async (productId) => {
        setLoading(true);
        try {
            const contract = await getReadOnlyContract('ProvenanceContract');
            const history = await contract.getProductHistory(productId);

            const formattedHistory = history.map(stage => ({
                stage: stages[Number(stage.stage)] || `UNKNOWN_${stage.stage}`,
                actor: stage.actor,
                timestamp: Number(stage.timestamp),
                location: stage.location,
                notes: stage.notes,
                evidenceHashes: stage.evidenceHashes,
                temperature: stage.temperature,
                humidity: stage.humidity
            }));

            setProductHistory(prev => ({
                ...prev,
                [productId]: formattedHistory
            }));

            setLoading(false);
            return formattedHistory;
        } catch (err) {
            console.error('Error fetching product history:', err);
            setError(err.message);
            setLoading(false);
            return [];
        }
    };

    /**
     * Get current stage of product
     */
    const getCurrentStage = async (productId) => {
        try {
            const contract = await getReadOnlyContract('ProvenanceContract');
            const stage = await contract.getCurrentStage(productId);
            return stages[Number(stage)] || `UNKNOWN_${stage}`;
        } catch (err) {
            console.error('Error fetching current stage:', err);
            throw err;
        }
    };

    /**
     * Get products for an actor
     */
    const getActorProducts = async (actorAddress) => {
        setLoading(true);
        try {
            const contract = await getReadOnlyContract('ProvenanceContract');
            const { address } = getWalletInfo();
            const actor = actorAddress || address;

            if (!actor) {
                throw new Error('Actor address not available');
            }

            const productIds = await contract.getActorProducts(actor);

            const productsData = await Promise.all(
                productIds.map(async (id) => {
                    const product = await getProductByQR(''); // This will need the QR hash
                    return product;
                })
            );

            setProducts(productsData);
            setLoading(false);
            return productsData;
        } catch (err) {
            console.error('Error fetching actor products:', err);
            setError(err.message);
            setLoading(false);
            return [];
        }
    };

    /**
     * Check if product is expired
     */
    const isProductExpired = async (productId) => {
        try {
            const contract = await getReadOnlyContract('ProvenanceContract');
            return await contract.isProductExpired(productId);
        } catch (err) {
            console.error('Error checking if product is expired:', err);
            throw err;
        }
    };

    /**
     * Get stage name as string
     */
    const getStageString = async (stage) => {
        try {
            const contract = await getReadOnlyContract('ProvenanceContract');
            return await contract.getStageString(stage);
        } catch (err) {
            console.error('Error getting stage string:', err);
            return stages[stage] || `UNKNOWN_${stage}`;
        }
    };

    /**
     * Get full product trace including history and current status
     */
    const getFullProductTrace = async (qrCodeHash) => {
        try {
            const product = await getProductByQR(qrCodeHash);
            const history = await getProductHistory(product.productId);
            const currentStage = await getCurrentStage(product.productId);
            const isExpired = await isProductExpired(product.productId);

            return {
                product,
                history,
                currentStage,
                isExpired,
                lastUpdated: Date.now()
            };
        } catch (err) {
            console.error('Error getting full product trace:', err);
            throw err;
        }
    };

    return {
        loading,
        error,
        products,
        productHistory,
        stages,
        createProduct,
        addStageRecord,
        markHarvested,
        markProcessed,
        markPackaged,
        transferToDistributor,
        transferToRetailer,
        markRetailAvailable,
        verifyQuality,
        getProductByQR,
        getProductHistory,
        getCurrentStage,
        getActorProducts,
        isProductExpired,
        getStageString,
        getFullProductTrace
    };
};