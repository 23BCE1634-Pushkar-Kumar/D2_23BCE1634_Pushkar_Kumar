// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title TrackingContract
 * @dev Smart contract for GPS tracking and supply chain monitoring
 */
contract TrackingContract is Ownable {
    
    struct GPSLocation {
        uint256 timestamp;
        int256 latitude;    // Multiplied by 10^6 for precision
        int256 longitude;   // Multiplied by 10^6 for precision
        uint256 speed;      // km/h
        string location;    // Human readable location
        bool emergencyBrake;
        string additionalData;
    }

    struct Shipment {
        uint256 shipmentId;
        uint256 auctionId;
        address farmer;
        address distributor;
        address retailer;
        string truckId;
        uint256 startTime;
        uint256 expectedDeliveryTime;
        uint256 actualDeliveryTime;
        bool isDelivered;
        bool isActive;
        string productDetails;
    }

    mapping(uint256 => Shipment) public shipments;
    mapping(uint256 => GPSLocation[]) public shipmentTrackingHistory;
    mapping(string => uint256[]) public truckShipments;
    mapping(address => uint256[]) public distributorShipments;
    
    uint256 private _shipmentIdCounter;

    event ShipmentCreated(
        uint256 indexed shipmentId,
        uint256 indexed auctionId,
        address indexed distributor,
        string truckId
    );

    event LocationUpdated(
        uint256 indexed shipmentId,
        string indexed truckId,
        int256 latitude,
        int256 longitude,
        uint256 timestamp
    );

    event EmergencyAlert(
        uint256 indexed shipmentId,
        string indexed truckId,
        int256 latitude,
        int256 longitude,
        uint256 timestamp
    );

    event ShipmentDelivered(
        uint256 indexed shipmentId,
        address indexed retailer,
        uint256 deliveryTime
    );

    modifier onlyShipmentParticipant(uint256 shipmentId) {
        Shipment memory shipment = shipments[shipmentId];
        require(
            msg.sender == shipment.farmer || 
            msg.sender == shipment.distributor || 
            msg.sender == shipment.retailer ||
            msg.sender == owner(),
            "Not authorized for this shipment"
        );
        _;
    }

    modifier onlyActiveShipment(uint256 shipmentId) {
        require(shipments[shipmentId].isActive, "Shipment is not active");
        _;
    }

    constructor() Ownable(msg.sender) {}

    /**
     * @dev Create a new shipment
     */
    function createShipment(
        uint256 _auctionId,
        address _farmer,
        address _retailer,
        string memory _truckId,
        uint256 _expectedDeliveryTime,
        string memory _productDetails
    ) external returns (uint256) {
        require(_farmer != address(0), "Invalid farmer address");
        require(_retailer != address(0), "Invalid retailer address");
        require(bytes(_truckId).length > 0, "Truck ID cannot be empty");

        uint256 shipmentId = _shipmentIdCounter++;
        
        shipments[shipmentId] = Shipment({
            shipmentId: shipmentId,
            auctionId: _auctionId,
            farmer: _farmer,
            distributor: msg.sender,
            retailer: _retailer,
            truckId: _truckId,
            startTime: block.timestamp,
            expectedDeliveryTime: _expectedDeliveryTime,
            actualDeliveryTime: 0,
            isDelivered: false,
            isActive: true,
            productDetails: _productDetails
        });

        truckShipments[_truckId].push(shipmentId);
        distributorShipments[msg.sender].push(shipmentId);

        emit ShipmentCreated(shipmentId, _auctionId, msg.sender, _truckId);
        
        return shipmentId;
    }

    /**
     * @dev Update GPS location for a shipment (called by ESP32 or authorized users)
     */
    function updateLocation(
        uint256 _shipmentId,
        int256 _latitude,
        int256 _longitude,
        uint256 _speed,
        string memory _location,
        bool _emergencyBrake,
        string memory _additionalData
    ) external onlyActiveShipment(_shipmentId) {
        
        GPSLocation memory newLocation = GPSLocation({
            timestamp: block.timestamp,
            latitude: _latitude,
            longitude: _longitude,
            speed: _speed,
            location: _location,
            emergencyBrake: _emergencyBrake,
            additionalData: _additionalData
        });

        shipmentTrackingHistory[_shipmentId].push(newLocation);

        emit LocationUpdated(_shipmentId, shipments[_shipmentId].truckId, _latitude, _longitude, block.timestamp);

        if (_emergencyBrake) {
            emit EmergencyAlert(_shipmentId, shipments[_shipmentId].truckId, _latitude, _longitude, block.timestamp);
        }
    }

    /**
     * @dev Mark shipment as delivered
     */
    function markDelivered(uint256 _shipmentId) 
        external 
        onlyShipmentParticipant(_shipmentId)
        onlyActiveShipment(_shipmentId)
    {
        Shipment storage shipment = shipments[_shipmentId];
        
        require(!shipment.isDelivered, "Shipment already delivered");
        
        shipment.isDelivered = true;
        shipment.isActive = false;
        shipment.actualDeliveryTime = block.timestamp;

        emit ShipmentDelivered(_shipmentId, shipment.retailer, block.timestamp);
    }

    /**
     * @dev Get shipment details
     */
    function getShipment(uint256 _shipmentId) 
        external 
        view 
        returns (Shipment memory) 
    {
        return shipments[_shipmentId];
    }

    /**
     * @dev Get full tracking history for a shipment
     */
    function getTrackingHistory(uint256 _shipmentId) 
        external 
        view 
        returns (GPSLocation[] memory) 
    {
        return shipmentTrackingHistory[_shipmentId];
    }

    /**
     * @dev Get latest location for a shipment
     */
    function getLatestLocation(uint256 _shipmentId) 
        external 
        view 
        returns (GPSLocation memory) 
    {
        GPSLocation[] memory history = shipmentTrackingHistory[_shipmentId];
        require(history.length > 0, "No tracking data available");
        
        return history[history.length - 1];
    }

    /**
     * @dev Get shipments for a truck
     */
    function getTruckShipments(string memory _truckId) 
        external 
        view 
        returns (uint256[] memory) 
    {
        return truckShipments[_truckId];
    }

    /**
     * @dev Get active shipments for a distributor
     */
    function getDistributorShipments(address _distributor) 
        external 
        view 
        returns (uint256[] memory) 
    {
        return distributorShipments[_distributor];
    }

    /**
     * @dev Get shipments by auction ID
     */
    function getShipmentByAuction(uint256 _auctionId) 
        external 
        view 
        returns (uint256[] memory) 
    {
        uint256[] memory matchingShipments = new uint256[](_shipmentIdCounter);
        uint256 count = 0;
        
        for (uint256 i = 0; i < _shipmentIdCounter; i++) {
            if (shipments[i].auctionId == _auctionId) {
                matchingShipments[count] = i;
                count++;
            }
        }
        
        // Resize array
        uint256[] memory result = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = matchingShipments[i];
        }
        
        return result;
    }

    /**
     * @dev Get total shipments count
     */
    function getTotalShipments() external view returns (uint256) {
        return _shipmentIdCounter;
    }

    /**
     * @dev Calculate estimated delivery time based on distance and current location
     */
    function getEstimatedDeliveryTime(uint256 _shipmentId) 
        external 
        view 
        returns (uint256) 
    {
        // This is a simplified calculation
        // In a real scenario, you'd integrate with mapping services
        GPSLocation[] memory history = shipmentTrackingHistory[_shipmentId];
        if (history.length == 0) {
            return shipments[_shipmentId].expectedDeliveryTime;
        }
        
        // Return expected delivery time for now
        // Can be enhanced with actual distance/speed calculations
        return shipments[_shipmentId].expectedDeliveryTime;
    }
}