# 🌾 Agri Supply Chain - Blockchain Platform

A comprehensive agricultural supply chain platform with **blockchain integration**, **smart contracts**, **GPS tracking**, **QR code provenance**, and **decentralized auctions**.

## 🏗️ Architecture

```
Platform Components:
├── 🔗 Blockchain (Hardhat + Solidity)
│   ├── AuctionContract - Decentralized crop auctions
│   ├── TrackingContract - GPS shipment tracking  
│   └── ProvenanceContract - Product lifecycle management
├── 🗄️ Backend (Node.js + Express + MongoDB)
│   ├── ethers.js blockchain integration
│   └── QR code generation & validation
└── 🖥️ Frontend (React + Vite)
    ├── Blockchain hooks (wallet connection)
    ├── QR scanner/generator components
    └── Real-time GPS tracking UI
```

## � Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (for user data)
- Git

### One-Command Setup
```powershell
# Clone and setup (Windows PowerShell)
git clone <your-repo>
cd agri-supply-chain
.\setup-blockchain.ps1
```

### Manual Setup
```bash
# Install blockchain dependencies
cd blockchain && npm install

# Install backend dependencies  
cd ../backend && npm install ethers qrcode

# Install frontend dependencies
cd ../frontend && npm install ethers qrcode jsqr

# Copy environment files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

## 🔧 Development Workflow

### 1. Start Blockchain Network
```bash
cd blockchain
npx hardhat node
```
*Starts local Ethereum network on http://127.0.0.1:8545 (Chain ID: 31337)*

### 2. Deploy Smart Contracts
```bash
cd blockchain  
npx hardhat run scripts/deploy.js --network localhost
```
*Deploys AuctionContract, TrackingContract, ProvenanceContract*

### 3. Start Backend API
```bash
cd backend
npm run dev
```
*API server on http://localhost:5000*

### 4. Start Frontend
```bash
cd frontend  
npm run dev
```
*React app on http://localhost:3000*

## � Key Features

### 🏺 **Decentralized Auctions**
- Create crop auctions with quality assessments
- Real-time bidding with automatic finalization
- Transparent pricing and farmer verification

### 🛰️ **GPS Tracking**
- Precise shipment location tracking (6 decimal precision)
- Emergency brake detection and alerts
- Real-time delivery status updates

### 🏷️ **QR Code Provenance**
- End-to-end product lifecycle tracking
- 7-stage verification (Farming → Retail)
- Immutable quality certifications

### 💳 **Wallet Integration**
- MetaMask connection
- Multi-signature support
- Gas optimization

## 🔐 Smart Contracts

### AuctionContract.sol
```solidity
// Core Functions:
createAuction(cropType, quantity, basePrice, duration)
placeBid(auctionId, bidAmount)  
finalizeAuction(auctionId)
getActiveAuctions()
```

### TrackingContract.sol  
```solidity
// Core Functions:
createShipment(productId, destination, estimatedDelivery)
updateLocation(shipmentId, latitude, longitude)
markDelivered(shipmentId)
getTrackingHistory(shipmentId)
```

### ProvenanceContract.sol
```solidity
// Core Functions: 
createProduct(farmerId, productType, harvestDate)
addStageRecord(productId, stage, location, evidence)
getProductByQR(qrCode)
getCertifications(productId)
```

## 🌐 API Endpoints

### Blockchain Integration
```bash
POST /api/blockchain/auction/create     # Create new auction
GET  /api/blockchain/auction/active     # Get active auctions
POST /api/blockchain/tracking/update    # Update GPS location
GET  /api/blockchain/tracking/:id       # Get tracking history
POST /api/blockchain/provenance/stage   # Add provenance stage
GET  /api/blockchain/qr/:code          # Get QR product info
```

### Traditional Features  
```bash
POST /api/auth/register                 # User registration
POST /api/auth/login                    # User authentication  
GET  /api/products                      # Product catalog
POST /api/orders                        # Order management
```
## 🦊 MetaMask Configuration

```javascript
Network Name: Hardhat Local
RPC URL: http://127.0.0.1:8545
Chain ID: 31337
Currency: ETH
```

## 📊 Testing

```bash
# Smart contract tests
cd blockchain
npx hardhat test

# Backend API tests  
cd backend
npm test

# Frontend component tests
cd frontend  
npm test
```

## 🔍 Debugging

### Common Issues
1. **Contract not deployed**: Run deployment script first
2. **MetaMask connection failed**: Check network configuration
3. **GPS precision errors**: Ensure coordinates × 10^6 format
4. **QR code generation**: Verify backend qrcode dependency

### Logs & Monitoring
```bash
# Blockchain logs
cd blockchain && npx hardhat console

# Backend logs
cd backend && tail -f logs/app.log

# Frontend dev tools
# Open browser DevTools → Console
```

## 🚀 Production Deployment

### Environment Variables
```bash
# Backend (.env)
BLOCKCHAIN_RPC_URL=https://mainnet.infura.io/v3/YOUR_KEY
PRIVATE_KEY=0x... 
MONGODB_URI=mongodb://localhost:27017/agri-supply-chain

# Frontend (.env)  
VITE_API_URL=https://your-api.com
VITE_BLOCKCHAIN_RPC=https://mainnet.infura.io/v3/YOUR_KEY
```

### Deployment Steps
1. Deploy contracts to mainnet/testnet
2. Update contract addresses in environment
3. Configure production MongoDB
4. Deploy backend to cloud service
5. Build and deploy frontend

## 🛡️ Security

- **Smart Contract Auditing**: Uses OpenZeppelin standards
- **ReentrancyGuard**: Prevents reentrancy attacks  
- **Access Control**: Role-based permissions
- **Data Validation**: Input sanitization on all endpoints

## 📄 License

MIT License - Build the future of agriculture! 🌱
## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

**Built with ❤️ for sustainable agriculture and blockchain innovation** 🌾⛓️

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **OpenWeatherMap** for weather data API
- **OpenStreetMap** for mapping data
- **Leaflet** for interactive maps
- **MongoDB** for database solutions
- **React** and **Node.js** communities

## 📞 Support

For support, email support@agrihub.com or join our Slack channel.

## 🗺️ Roadmap

- [ ] **Blockchain Integration** for supply chain transparency
- [ ] **IoT Sensor Integration** for real-time crop monitoring
- [ ] **AI-powered Price Prediction** using machine learning
- [ ] **Mobile Apps** for Android and iOS
- [ ] **Payment Gateway Integration** for seamless transactions
- [ ] **Multi-language Support** for global adoption
- [ ] **Advanced Analytics Dashboard** with business intelligence
- [ ] **Third-party Integrations** (weather, logistics, payment)

---

Built with ❤️ for the agricultural community by [AGrihub Team](https://github.com/agrihub)