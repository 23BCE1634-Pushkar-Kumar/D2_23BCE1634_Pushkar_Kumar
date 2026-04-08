// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title AuctionContract
 * @dev Smart contract for managing crop auctions in the agricultural supply chain
 */
contract AuctionContract is Ownable, ReentrancyGuard {
    
    struct Auction {
        uint256 id;
        address farmer;
        string crop;
        string variety;
        uint256 quantity;
        uint256 basePrice;
        uint256 currentHighestBid;
        address currentHighestBidder;
        string qualityGrade;
        uint256 qualityConfidence;
        uint256 startTime;
        uint256 endTime;
        bool isActive;
        bool isFinalized;
        string description;
        string[] imageHashes;
    }

    struct Bid {
        address bidder;
        uint256 amount;
        uint256 timestamp;
    }

    mapping(uint256 => Auction) public auctions;
    mapping(uint256 => Bid[]) public auctionBids;
    mapping(address => uint256[]) public farmerAuctions;
    mapping(address => uint256[]) public bidderAuctions;
    
    uint256 private _auctionIdCounter;
    uint256 public constant AUCTION_DURATION = 24 hours;
    uint256 public constant MIN_BID_INCREMENT = 0.01 ether;

    event AuctionCreated(
        uint256 indexed auctionId,
        address indexed farmer,
        string crop,
        uint256 quantity,
        uint256 basePrice,
        string qualityGrade
    );

    event BidPlaced(
        uint256 indexed auctionId,
        address indexed bidder,
        uint256 amount,
        uint256 timestamp
    );

    event AuctionFinalized(
        uint256 indexed auctionId,
        address indexed winner,
        uint256 winningBid
    );

    event AuctionCancelled(uint256 indexed auctionId);

    modifier onlyActiveBid(uint256 auctionId) {
        require(auctions[auctionId].isActive, "Auction is not active");
        require(block.timestamp <= auctions[auctionId].endTime, "Auction has ended");
        _;
    }

    modifier onlyAuctionOwner(uint256 auctionId) {
        require(auctions[auctionId].farmer == msg.sender, "Only auction owner can perform this action");
        _;
    }

    constructor() Ownable(msg.sender) {}

    /**
     * @dev Create a new auction
     */
    function createAuction(
        string memory _crop,
        string memory _variety,
        uint256 _quantity,
        uint256 _basePrice,
        string memory _qualityGrade,
        uint256 _qualityConfidence,
        string memory _description,
        string[] memory _imageHashes
    ) external returns (uint256) {
        require(bytes(_crop).length > 0, "Crop name cannot be empty");
        require(_quantity > 0, "Quantity must be greater than 0");
        require(_basePrice > 0, "Base price must be greater than 0");

        uint256 auctionId = _auctionIdCounter++;
        
        auctions[auctionId] = Auction({
            id: auctionId,
            farmer: msg.sender,
            crop: _crop,
            variety: _variety,
            quantity: _quantity,
            basePrice: _basePrice,
            currentHighestBid: _basePrice,
            currentHighestBidder: address(0),
            qualityGrade: _qualityGrade,
            qualityConfidence: _qualityConfidence,
            startTime: block.timestamp,
            endTime: block.timestamp + AUCTION_DURATION,
            isActive: true,
            isFinalized: false,
            description: _description,
            imageHashes: _imageHashes
        });

        farmerAuctions[msg.sender].push(auctionId);

        emit AuctionCreated(auctionId, msg.sender, _crop, _quantity, _basePrice, _qualityGrade);
        
        return auctionId;
    }

    /**
     * @dev Place a bid on an auction
     */
    function placeBid(uint256 auctionId) 
        external 
        payable 
        onlyActiveBid(auctionId)
        nonReentrant 
    {
        Auction storage auction = auctions[auctionId];
        
        require(msg.sender != auction.farmer, "Farmer cannot bid on own auction");
        require(msg.value >= auction.currentHighestBid + MIN_BID_INCREMENT, "Bid too low");

        // Refund previous highest bidder
        if (auction.currentHighestBidder != address(0)) {
            payable(auction.currentHighestBidder).transfer(auction.currentHighestBid);
        }

        auction.currentHighestBid = msg.value;
        auction.currentHighestBidder = msg.sender;

        // Record the bid
        auctionBids[auctionId].push(Bid({
            bidder: msg.sender,
            amount: msg.value,
            timestamp: block.timestamp
        }));

        // Track bidder auctions
        if (bidderAuctions[msg.sender].length == 0 || 
            bidderAuctions[msg.sender][bidderAuctions[msg.sender].length - 1] != auctionId) {
            bidderAuctions[msg.sender].push(auctionId);
        }

        emit BidPlaced(auctionId, msg.sender, msg.value, block.timestamp);
    }

    /**
     * @dev Finalize an auction (can be called by anyone after auction ends)
     */
    function finalizeAuction(uint256 auctionId) external nonReentrant {
        Auction storage auction = auctions[auctionId];
        
        require(auction.isActive, "Auction is not active");
        require(block.timestamp > auction.endTime, "Auction has not ended yet");
        require(!auction.isFinalized, "Auction already finalized");

        auction.isActive = false;
        auction.isFinalized = true;

        if (auction.currentHighestBidder != address(0)) {
            // Transfer payment to farmer
            payable(auction.farmer).transfer(auction.currentHighestBid);
            
            emit AuctionFinalized(auctionId, auction.currentHighestBidder, auction.currentHighestBid);
        }
    }

    /**
     * @dev Cancel an auction (only by farmer, only if no bids)
     */
    function cancelAuction(uint256 auctionId) 
        external 
        onlyAuctionOwner(auctionId) 
        nonReentrant 
    {
        Auction storage auction = auctions[auctionId];
        
        require(auction.isActive, "Auction is not active");
        require(auction.currentHighestBidder == address(0), "Cannot cancel auction with bids");

        auction.isActive = false;
        auction.isFinalized = true;

        emit AuctionCancelled(auctionId);
    }

    /**
     * @dev Get auction details
     */
    function getAuction(uint256 auctionId) 
        external 
        view 
        returns (Auction memory) 
    {
        return auctions[auctionId];
    }

    /**
     * @dev Get all bids for an auction
     */
    function getAuctionBids(uint256 auctionId) 
        external 
        view 
        returns (Bid[] memory) 
    {
        return auctionBids[auctionId];
    }

    /**
     * @dev Get auctions created by a farmer
     */
    function getFarmerAuctions(address farmer) 
        external 
        view 
        returns (uint256[] memory) 
    {
        return farmerAuctions[farmer];
    }

    /**
     * @dev Get auctions where user has placed bids
     */
    function getBidderAuctions(address bidder) 
        external 
        view 
        returns (uint256[] memory) 
    {
        return bidderAuctions[bidder];
    }

    /**
     * @dev Get total number of auctions
     */
    function getTotalAuctions() external view returns (uint256) {
        return _auctionIdCounter;
    }

    /**
     * @dev Get active auctions
     */
    function getActiveAuctions() external view returns (uint256[] memory) {
        uint256[] memory activeAuctions = new uint256[](_auctionIdCounter);
        uint256 count = 0;
        
        for (uint256 i = 0; i < _auctionIdCounter; i++) {
            if (auctions[i].isActive && block.timestamp <= auctions[i].endTime) {
                activeAuctions[count] = i;
                count++;
            }
        }
        
        // Resize array to actual count
        uint256[] memory result = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = activeAuctions[i];
        }
        
        return result;
    }
}