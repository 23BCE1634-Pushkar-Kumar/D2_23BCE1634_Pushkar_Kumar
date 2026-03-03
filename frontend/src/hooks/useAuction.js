import { useState, useEffect } from 'react';
import { getContract, getReadOnlyContract, formatEth, parseEth, getWalletInfo } from '../blockchain/wallet';

export const useAuction = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [auctions, setAuctions] = useState([]);
    const [activeAuctions, setActiveAuctions] = useState([]);

    /**
     * Create a new auction
     */
    const createAuction = async (auctionData) => {
        setLoading(true);
        setError(null);

        try {
            const {
                crop,
                variety,
                quantity,
                basePrice,
                qualityGrade,
                qualityConfidence,
                description,
                imageHashes
            } = auctionData;

            const contract = getContract('AuctionContract');
            const basePriceWei = parseEth(basePrice);

            const tx = await contract.createAuction(
                crop,
                variety || '',
                quantity,
                basePriceWei,
                qualityGrade || 'Ungraded',
                qualityConfidence || 0,
                description || '',
                imageHashes || []
            );

            const receipt = await tx.wait();

            // Extract auction ID from event logs
            const auctionCreatedEvent = receipt.logs.find(log => {
                try {
                    return contract.interface.parseLog(log).name === 'AuctionCreated';
                } catch {
                    return false;
                }
            });

            let auctionId = null;
            if (auctionCreatedEvent) {
                const parsed = contract.interface.parseLog(auctionCreatedEvent);
                auctionId = Number(parsed.args.auctionId);
            }

            setLoading(false);
            return {
                success: true,
                auctionId,
                transactionHash: tx.hash,
                blockNumber: receipt.blockNumber
            };
        } catch (err) {
            console.error('Error creating auction:', err);
            setError(err.message);
            setLoading(false);
            throw err;
        }
    };

    /**
     * Place a bid on an auction
     */
    const placeBid = async (auctionId, bidAmount) => {
        setLoading(true);
        setError(null);

        try {
            const contract = getContract('AuctionContract');
            const bidAmountWei = parseEth(bidAmount);

            const tx = await contract.placeBid(auctionId, {
                value: bidAmountWei
            });

            const receipt = await tx.wait();

            setLoading(false);
            return {
                success: true,
                transactionHash: tx.hash,
                blockNumber: receipt.blockNumber
            };
        } catch (err) {
            console.error('Error placing bid:', err);
            setError(err.message);
            setLoading(false);
            throw err;
        }
    };

    /**
     * Get auction details by ID
     */
    const getAuction = async (auctionId) => {
        try {
            const contract = await getReadOnlyContract('AuctionContract');
            const auction = await contract.getAuction(auctionId);

            return {
                id: Number(auction.id),
                farmer: auction.farmer,
                crop: auction.crop,
                variety: auction.variety,
                quantity: Number(auction.quantity),
                basePrice: formatEth(auction.basePrice),
                currentHighestBid: formatEth(auction.currentHighestBid),
                currentHighestBidder: auction.currentHighestBidder,
                qualityGrade: auction.qualityGrade,
                qualityConfidence: Number(auction.qualityConfidence),
                startTime: Number(auction.startTime),
                endTime: Number(auction.endTime),
                isActive: auction.isActive,
                isFinalized: auction.isFinalized,
                description: auction.description,
                imageHashes: auction.imageHashes
            };
        } catch (err) {
            console.error('Error fetching auction:', err);
            throw err;
        }
    };

    /**
     * Get all active auctions
     */
    const getActiveAuctions = async () => {
        setLoading(true);
        try {
            const contract = await getReadOnlyContract('AuctionContract');
            const activeAuctionIds = await contract.getActiveAuctions();

            const auctionsData = await Promise.all(
                activeAuctionIds.map(async (id) => {
                    const auction = await getAuction(Number(id));
                    return auction;
                })
            );

            setActiveAuctions(auctionsData);
            setLoading(false);
            return auctionsData;
        } catch (err) {
            console.error('Error fetching active auctions:', err);
            setError(err.message);
            setLoading(false);
            return [];
        }
    };

    /**
     * Get farmer's auctions
     */
    const getFarmerAuctions = async (farmerAddress) => {
        setLoading(true);
        try {
            const contract = await getReadOnlyContract('AuctionContract');
            const { address } = getWalletInfo();
            const farmer = farmerAddress || address;

            if (!farmer) {
                throw new Error('Farmer address not available');
            }

            const auctionIds = await contract.getFarmerAuctions(farmer);

            const auctionsData = await Promise.all(
                auctionIds.map(async (id) => {
                    const auction = await getAuction(Number(id));
                    return auction;
                })
            );

            setAuctions(auctionsData);
            setLoading(false);
            return auctionsData;
        } catch (err) {
            console.error('Error fetching farmer auctions:', err);
            setError(err.message);
            setLoading(false);
            return [];
        }
    };

    /**
     * Get bidder's auctions
     */
    const getBidderAuctions = async (bidderAddress) => {
        setLoading(true);
        try {
            const contract = await getReadOnlyContract('AuctionContract');
            const { address } = getWalletInfo();
            const bidder = bidderAddress || address;

            if (!bidder) {
                throw new Error('Bidder address not available');
            }

            const auctionIds = await contract.getBidderAuctions(bidder);

            const auctionsData = await Promise.all(
                auctionIds.map(async (id) => {
                    const auction = await getAuction(Number(id));
                    return auction;
                })
            );

            setLoading(false);
            return auctionsData;
        } catch (err) {
            console.error('Error fetching bidder auctions:', err);
            setError(err.message);
            setLoading(false);
            return [];
        }
    };

    /**
     * Get auction bids
     */
    const getAuctionBids = async (auctionId) => {
        try {
            const contract = await getReadOnlyContract('AuctionContract');
            const bids = await contract.getAuctionBids(auctionId);

            return bids.map(bid => ({
                bidder: bid.bidder,
                amount: formatEth(bid.amount),
                timestamp: Number(bid.timestamp)
            }));
        } catch (err) {
            console.error('Error fetching auction bids:', err);
            throw err;
        }
    };

    /**
     * Finalize auction
     */
    const finalizeAuction = async (auctionId) => {
        setLoading(true);
        setError(null);

        try {
            const contract = getContract('AuctionContract');
            const tx = await contract.finalizeAuction(auctionId);
            const receipt = await tx.wait();

            setLoading(false);
            return {
                success: true,
                transactionHash: tx.hash,
                blockNumber: receipt.blockNumber
            };
        } catch (err) {
            console.error('Error finalizing auction:', err);
            setError(err.message);
            setLoading(false);
            throw err;
        }
    };

    /**
     * Cancel auction
     */
    const cancelAuction = async (auctionId) => {
        setLoading(true);
        setError(null);

        try {
            const contract = getContract('AuctionContract');
            const tx = await contract.cancelAuction(auctionId);
            const receipt = await tx.wait();

            setLoading(false);
            return {
                success: true,
                transactionHash: tx.hash,
                blockNumber: receipt.blockNumber
            };
        } catch (err) {
            console.error('Error cancelling auction:', err);
            setError(err.message);
            setLoading(false);
            throw err;
        }
    };

    /**
     * Check if auction is ended
     */
    const isAuctionEnded = (auction) => {
        return Date.now() / 1000 > auction.endTime;
    };

    /**
     * Get time remaining for auction
     */
    const getTimeRemaining = (auction) => {
        const now = Date.now() / 1000;
        const timeLeft = auction.endTime - now;

        if (timeLeft <= 0) return null;

        const hours = Math.floor(timeLeft / 3600);
        const minutes = Math.floor((timeLeft % 3600) / 60);

        return { hours, minutes, seconds: Math.floor(timeLeft % 60) };
    };

    return {
        loading,
        error,
        auctions,
        activeAuctions,
        createAuction,
        placeBid,
        getAuction,
        getActiveAuctions,
        getFarmerAuctions,
        getBidderAuctions,
        getAuctionBids,
        finalizeAuction,
        cancelAuction,
        isAuctionEnded,
        getTimeRemaining
    };
};