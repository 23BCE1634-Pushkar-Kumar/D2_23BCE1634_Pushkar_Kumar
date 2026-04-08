# 🚀 Quick Start Guide

Follow these simple steps to get the Agri Supply Chain Platform running on your local machine.

## Prerequisites

Make sure you have these installed:
- **Node.js** (v16 or higher) - [Download here](https://nodejs.org/)
- **MongoDB** (v5.0 or higher) - [Download here](https://www.mongodb.com/try/download/community)
- **Git** - [Download here](https://git-scm.com/)

## Step 1: Clone the Repository

```bash
git clone https://github.com/yourusername/agri-supply-chain.git
cd agri-supply-chain
```

## Step 2: Setup MongoDB

### Option A: Local MongoDB
1. Install and start MongoDB on your system
2. MongoDB will run on `mongodb://localhost:27017`

### Option B: MongoDB Atlas (Cloud)
1. Create a free account at [MongoDB Atlas](https://cloud.mongodb.com)
2. Create a new cluster
3. Get your connection string

### Option C: Docker MongoDB
```bash
docker run -d -p 27017:27017 --name agri-mongo mongo:6.0
```

## Step 3: Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your settings (see below)
# Start the server
npm start
```

### Backend Environment Setup
Edit `backend/.env`:
```env
MONGO_URI=mongodb://localhost:27017/agriSupplyChain
JWT_SECRET=your-super-secret-jwt-key
PORT=5000
OPENWEATHER_API_KEY=your-api-key-here
```

## Step 4: Frontend Setup

```bash
# Open new terminal
cd frontend

# Install dependencies  
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your settings
# Start the development server
npm run dev
```

### Frontend Environment Setup
Edit `frontend/.env`:
```env
VITE_API_URL=http://localhost:5000/api
VITE_OPENWEATHER_API_KEY=your-api-key-here
VITE_APP_NAME=Agri Supply Chain Platform
```

## Step 5: Get API Keys (Optional)

### OpenWeather API (for weather features)
1. Visit [OpenWeatherMap](https://openweathermap.org/api)
2. Create free account
3. Get your API key
4. Add to both `.env` files

## Step 6: Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000
- **API Docs**: http://localhost:5000/api

## Step 7: Test with Demo Accounts

| Role | Email | Password |
|------|--------|----------|
| Farmer | farmer@demo.com | password |
| Retailer | retailer@demo.com | password |
| Distributor | distributor@demo.com | password |
| Consumer | consumer@demo.com | password |

## 🐳 Docker Quick Start (Alternative)

If you prefer Docker:

```bash
# Clone and navigate
git clone https://github.com/yourusername/agri-supply-chain.git
cd agri-supply-chain

# Start all services
docker-compose up -d

# Access at http://localhost:3000
```

## ⚡ Development Commands

### Backend
```bash
npm start        # Start production server
npm run dev      # Start with auto-reload
npm test         # Run tests
```

### Frontend
```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
```

## 🔧 Troubleshooting

### Common Issues:

**Port already in use:**
```bash
# Change ports in .env files
# Backend: PORT=5001
# Frontend: VITE_DEV_SERVER_PORT=5174
```

**MongoDB connection failed:**
- Make sure MongoDB is running
- Check connection string in `backend/.env`
- Try: `mongodb://127.0.0.1:27017/agriSupplyChain`

**API calls failing:**
- Ensure backend is running on port 5000
- Check `VITE_API_URL` in `frontend/.env`
- Verify CORS settings

**Missing dependencies:**
```bash
# Clear caches and reinstall
rm -rf node_modules package-lock.json
npm install
```

## 📱 Testing GPS Features

Send test GPS data:
```bash
curl -X POST http://localhost:5000/api/tracker/truck001/location \
  -H "Content-Type: application/json" \
  -d '{
    "lat": 28.6139,
    "lon": 77.2090,
    "speed": 45,
    "heading": 180
  }'
```

## 🎯 Next Steps

1. **Explore Features**: Login with different roles and test features
2. **Customize**: Modify components and styling to fit your needs  
3. **Deploy**: Follow deployment guide in main README
4. **Integrate**: Connect real GPS devices and payment systems

## 💡 Tips

- Use **Farmer** account to create auctions
- Use **Retailer** account to place bids
- Use **Distributor** account to track shipments
- Use **Consumer** account to scan QR codes
- All roles have different dashboard features

---

**Need help?** Check the main [README.md](./README.md) for detailed documentation or create an issue on GitHub.

Happy coding! 🌾