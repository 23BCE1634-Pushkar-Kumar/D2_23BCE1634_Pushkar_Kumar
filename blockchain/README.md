# 🔗 Blockchain Integration Guide

This document explains how to set up and use the blockchain features in the Agri Supply Chain Platform.

## 📋 Overview

The platform integrates with Ethereum blockchain using Hardhat for local development, providing:

- **Smart Contracts**: Auction, GPS Tracking, and Product Provenance
- **Decentralized Auctions**: Transparent bidding with automatic finalization
- **Supply Chain Tracking**: Immutable GPS logging and product journey
- **QR Code Verification**: Scan products to verify authenticity and trace origin

## 🛠️ Setup Instructions

### 1. Install Blockchain Dependencies

```bash
# Install blockchain packages
cd blockchain/
npm install

# Install backend dependencies
cd ../backend/
npm install ethers qrcode

# Install frontend dependencies
cd ../frontend/
npm install ethers qrcode jsqr
```

### 2. Start Hardhat Local Network

```bash
cd blockchain/
npx hardhat node
```

This starts a local Ethereum network on `http://127.0.0.1:8545`

### 3. Deploy Smart Contracts

```bash
# Deploy contracts to local network
cd blockchain/
npx hardhat run scripts/deploy.js --network localhost
```

This creates a `contract-addresses.json` file with deployed contract addresses.

### 4. Configure Environment Variables

Copy the example environment files and update them:

```bash
# Backend environment
cp backend/.env.example backend/.env

# Frontend environment
cp frontend/.env.example frontend/.env
```

Update the `.env` files with your configuration.

### 5. Configure MetaMask (Optional)

Add the Hardhat network to MetaMask:

- **Network Name**: Hardhat Local
- **RPC URL**: http://127.0.0.1:8545
- **Chain ID**: 31337
- **Currency Symbol**: ETH

Import a test account using one of the private keys from the Hardhat node output.

## 📦 Smart Contracts

### AuctionContract.sol

Handles decentralized crop auctions:

- **Functions**:
  - `createAuction()` - Create new auction
  - `placeBid()` - Place bid on auction
  - `finalizeAuction()` - Finalize auction after end time
  - `getActiveAuctions()` - Get all active auctions

- **Events**:
  - `AuctionCreated` - New auction created
  - `BidPlaced` - Bid placed on auction
  - `AuctionFinalized` - Auction completed

### TrackingContract.sol

Manages GPS tracking and shipments:

- **Functions**:
  - `createShipment()` - Create shipment record
  - `updateLocation()` - Update GPS coordinates
  - `markDelivered()` - Mark shipment as delivered
  - `getTrackingHistory()` - Get full GPS history

- **Events**:
  - `ShipmentCreated` - New shipment started
  - `LocationUpdated` - GPS location updated
  - `EmergencyAlert` - Emergency brake detected

### ProvenanceContract.sol

Tracks complete product lifecycle:

- **Functions**:
  - `createProduct()` - Create product record
  - `addStageRecord()` - Add supply chain stage
  - `transferToDistributor()` - Transfer ownership
  - `getProductByQR()` - Get product by QR code

- **Stages**:
  - FARMING → HARVESTED → PROCESSED → PACKAGED → IN_TRANSIT → DELIVERED → RETAIL

## 🎯 Usage Examples

### Creating an Auction (Frontend)

```javascript
import { useAuction } from './hooks/useAuction';

const { createAuction } = useAuction();

const auctionData = {
  crop: 'Tomatoes',
  variety: 'Roma',
  quantity: 1000,
  basePrice: '0.1', // ETH
  qualityGrade: 'Grade A',
  qualityConfidence: 95,
  description: 'Fresh organic tomatoes',
  imageHashes: ['QmHash1', 'QmHash2']
};

const result = await createAuction(auctionData);
console.log('Auction ID:', result.auctionId);
```

### GPS Tracking (Backend Integration)

```javascript
// ESP32 posts to: POST /api/tracker/:truckId/location
// Backend automatically updates blockchain via TrackingContract
const locationData = {
  shipmentId: 1,
  latitude: 40.748817,
  longitude: -73.985428,
  speed: 60,
  location: 'Highway I-95'
};
```

### QR Code Scanning (Frontend)

```jsx
import QRScanner from './components/QR/QRScanner';
import ProductTrace from './components/QR/ProductTrace';

const [qrData, setQrData] = useState(null);

<QRScanner
  isOpen={scannerOpen}
  onScan={(data) => {
    if (data.type === 'agri-product') {
      setQrData(data.hash);
    }
  }}
  onClose={() => setScannerOpen(false)}
/>

{qrData && <ProductTrace qrCodeHash={qrData} />}
```

## 🔌 API Endpoints

### Blockchain Routes

- `GET /api/blockchain/addresses` - Get contract addresses
- `GET /api/blockchain/abis` - Get contract ABIs
- `POST /api/blockchain/auction/create` - Create auction on blockchain
- `POST /api/blockchain/auction/:id/bid` - Place bid
- `GET /api/blockchain/auctions/active` - Get active auctions
- `POST /api/blockchain/tracking/shipment` - Create shipment
- `POST /api/blockchain/tracking/location` - Update GPS location
- `POST /api/blockchain/provenance/product` - Create product
- `GET /api/blockchain/provenance/qr/:hash` - Get product by QR

## 🧪 Testing

### Run Contract Tests

```bash
cd blockchain/
npx hardhat test
```

### Test Contract Interactions

```bash
cd blockchain/
npx hardhat run scripts/interact.js --network localhost
```

This script tests:
- Creating auctions
- Placing bids
- Creating shipments
- Updating GPS locations
- Creating provenance records
- QR code lookups

## 📱 QR Code System

### QR Code Data Structure

```json
{
  "type": "agri-product",
  "hash": "0x1234567890abcdef...",
  "verifyUrl": "http://localhost:5173/verify/0x1234...",
  "timestamp": 1234567890
}
```

### QR Code Generation

Products automatically generate QR codes that contain:
- Product hash for blockchain lookup
- Verification URL for consumers
- Timestamp of generation

### QR Code Scanning

Consumers can scan QR codes to:
- View complete product journey
- Verify authenticity
- Check quality assessments
- See GPS tracking history
- Verify certifications

## 🔐 Security Considerations

1. **Private Keys**: Never commit private keys to version control
2. **Smart Contract Auditing**: Test thoroughly before mainnet deployment
3. **Access Control**: Use role-based permissions in contracts
4. **Input Validation**: Validate all inputs on blockchain and backend
5. **Rate Limiting**: Implement rate limiting on API endpoints

## 🚀 Production Deployment

### Testnet Deployment

1. Configure testnet RPC URL (Goerli, Sepolia)
2. Get testnet ETH from faucets
3. Deploy contracts: `npx hardhat run scripts/deploy.js --network goerli`
4. Update environment variables with testnet addresses

### Mainnet Deployment

1. **WARNING**: Mainnet deployment costs real ETH
2. Use a secure wallet/hardware wallet
3. Audit contracts thoroughly
4. Deploy with production configuration
5. Verify contracts on Etherscan

## 🆘 Troubleshooting

### Common Issues

1. **MetaMask Connection Issues**:
   - Ensure Hardhat network is added to MetaMask
   - Check RPC URL is correct (http://127.0.0.1:8545)
   - Import test account private key

2. **Contract Not Found**:
   - Ensure contracts are deployed (`npx hardhat run scripts/deploy.js`)
   - Check `contract-addresses.json` exists
   - Verify backend can read contract addresses

3. **Transaction Failures**:
   - Check account has sufficient ETH for gas
   - Ensure correct network is selected
   - Verify contract parameters are correct

4. **QR Code Scanning Issues**:
   - Ensure camera permissions are granted
   - Check QR code format is correct
   - Verify jsQR library is loaded

### Getting Help

- Check Hardhat documentation: https://hardhat.org/
- Ethereum development guides: https://ethereum.org/developers/
- Open issues on the project GitHub repository

## 📊 Monitoring

### Blockchain Events

Monitor smart contract events for:
- New auctions created
- Bids placed
- GPS locations updated
- Emergency alerts
- Product transfers

### Performance Metrics

Track:
- Transaction confirmation times
- Gas usage per transaction
- Contract call success rates
- QR code scan rates
- User wallet connection rates

## 🔄 Upgrades

### Contract Upgrades

Smart contracts are immutable once deployed. For upgrades:
1. Deploy new contract versions
2. Migrate data if necessary
3. Update frontend to use new addresses
4. Maintain backward compatibility

### Frontend Updates

The React hooks and components can be updated independently:
- Update blockchain interaction logic
- Add new contract methods
- Enhance QR code features
- Improve user experience

---

🎉 **You're now ready to use the full blockchain-enabled Agri Supply Chain Platform!**

For questions or issues, please refer to the main README.md or open an issue on GitHub.