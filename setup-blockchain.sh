#!/bin/bash
# Complete Setup Script for Agri Supply Chain Blockchain Platform

echo "🌾 Setting up Agri Supply Chain Blockchain Platform..."

# Create main project structure if it doesn't exist
echo "📁 Setting up project structure..."

# Install dependencies for all components
echo "📦 Installing dependencies..."

# Backend dependencies
echo "Installing backend dependencies..."
cd backend/
npm install ethers qrcode
cd ..

# Frontend dependencies  
echo "Installing frontend dependencies..."
cd frontend/
npm install ethers qrcode jsqr
cd ..

# Blockchain dependencies (already installed)
echo "Blockchain dependencies already installed ✅"

# Copy environment files
echo "⚙️ Setting up environment files..."

# Backend .env
if [ ! -f "backend/.env" ]; then
    cp backend/.env.example backend/.env
    echo "Created backend/.env from template"
else
    echo "backend/.env already exists"
fi

# Frontend .env
if [ ! -f "frontend/.env" ]; then
    cp frontend/.env.example frontend/.env
    echo "Created frontend/.env from template"
else
    echo "frontend/.env already exists"
fi

echo "🎯 Setup complete! Next steps:"
echo ""
echo "1. 🔗 Start Hardhat blockchain:"
echo "   cd blockchain/"
echo "   npx hardhat node"
echo ""
echo "2. 📜 Deploy smart contracts:"
echo "   cd blockchain/"
echo "   npx hardhat run scripts/deploy.js --network localhost"
echo ""
echo "3. 🗄️ Start backend server:"
echo "   cd backend/"
echo "   npm run dev"
echo ""
echo "4. 🖥️ Start frontend:"
echo "   cd frontend/"
echo "   npm run dev"
echo ""
echo "5. 🦊 Configure MetaMask (optional):"
echo "   - Network: Hardhat Local"
echo "   - RPC: http://127.0.0.1:8545"
echo "   - Chain ID: 31337"
echo ""
echo "📖 For detailed instructions, see blockchain/README.md"
echo ""
echo "🎉 Ready to build the future of agriculture!"