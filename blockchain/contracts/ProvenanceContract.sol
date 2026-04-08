// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title ProvenanceContract (Simplified)
 * @dev Smart contract for tracking basic supply chain provenance
 */
contract ProvenanceContract is Ownable {
    
    enum Stage {
        FARMING,
        HARVESTED,
        PROCESSED,
        PACKAGED,
        IN_TRANSIT,
        DELIVERED,
        RETAIL
    }

    struct Product {
        uint256 productId;
        address farmer;
        string crop;
        uint256 quantity;
        string location;
        uint256 harvestDate;
        string qrCode;
        bool isActive;
    }

    struct StageRecord {
        Stage stage;
        address actor;
        uint256 timestamp;
        string location;
        string notes;
    }

    // Storage
    mapping(uint256 => Product) public products;
    mapping(uint256 => StageRecord[]) public productStages;
    mapping(string => uint256) public qrCodeToProduct;
    mapping(address => uint256[]) public userProducts;
    
    uint256 private _productCounter;

    // Events
    event ProductCreated(uint256 indexed productId, address indexed farmer, string crop, string qrCode);
    event StageAdded(uint256 indexed productId, Stage stage, address actor, string location);

    constructor() Ownable(msg.sender) {}

    /**
     * @dev Create a new product
     */
    function createProduct(
        string memory _crop,
        uint256 _quantity,
        string memory _location,
        string memory _qrCode
    ) external returns (uint256) {
        require(bytes(_crop).length > 0, "Crop name required");
        require(_quantity > 0, "Quantity must be > 0");
        require(qrCodeToProduct[_qrCode] == 0, "QR code already exists");

        uint256 productId = ++_productCounter;
        
        products[productId] = Product({
            productId: productId,
            farmer: msg.sender,
            crop: _crop,
            quantity: _quantity,
            location: _location,
            harvestDate: block.timestamp,
            qrCode: _qrCode,
            isActive: true
        });

        qrCodeToProduct[_qrCode] = productId;
        userProducts[msg.sender].push(productId);

        // Add farming stage
        _addStage(productId, Stage.FARMING, _location, "Product created");

        emit ProductCreated(productId, msg.sender, _crop, _qrCode);
        return productId;
    }

    /**
     * @dev Add a stage to product history
     */
    function addStage(
        uint256 _productId,
        Stage _stage,
        string memory _location,
        string memory _notes
    ) external {
        require(products[_productId].isActive, "Product not found");
        _addStage(_productId, _stage, _location, _notes);
        emit StageAdded(_productId, _stage, msg.sender, _location);
    }

    /**
     * @dev Internal function to add stage
     */
    function _addStage(
        uint256 _productId,
        Stage _stage,
        string memory _location,
        string memory _notes
    ) internal {
        productStages[_productId].push(StageRecord({
            stage: _stage,
            actor: msg.sender,
            timestamp: block.timestamp,
            location: _location,
            notes: _notes
        }));
    }

    /**
     * @dev Get product by QR code
     */
    function getProductByQR(string memory _qrCode) external view returns (
        uint256 productId,
        address farmer,
        string memory crop,
        uint256 quantity,
        string memory location,
        uint256 harvestDate
    ) {
        uint256 id = qrCodeToProduct[_qrCode];
        require(id != 0, "QR code not found");
        
        Product memory product = products[id];
        return (
            product.productId,
            product.farmer,
            product.crop,
            product.quantity,
            product.location,
            product.harvestDate
        );
    }

    /**
     * @dev Get product stages
     */
    function getProductStages(uint256 _productId) external view returns (StageRecord[] memory) {
        require(products[_productId].isActive, "Product not found");
        return productStages[_productId];
    }

    /**
     * @dev Get user products
     */
    function getUserProducts(address _user) external view returns (uint256[] memory) {
        return userProducts[_user];
    }

    /**
     * @dev Get total products count
     */
    function getTotalProducts() external view returns (uint256) {
        return _productCounter;
    }
}