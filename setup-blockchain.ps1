# Complete Setup Script for Agri Supply Chain Blockchain Platform
# PowerShell version

Write-Host "🌾 Setting up Agri Supply Chain Blockchain Platform..." -ForegroundColor Green

# Check if we're in the right directory
if (!(Test-Path "backend") -or !(Test-Path "frontend") -or !(Test-Path "blockchain")) {
    Write-Host "❌ Please run this script from the project root directory" -ForegroundColor Red
    exit 1
}

# Install dependencies for all components
Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow

# Backend dependencies
Write-Host "Installing backend dependencies..."
Set-Location backend
npm install ethers qrcode
Set-Location ..

# Frontend dependencies  
Write-Host "Installing frontend dependencies..."
Set-Location frontend
npm install ethers qrcode jsqr
Set-Location ..

# Copy environment files
Write-Host "⚙️ Setting up environment files..." -ForegroundColor Yellow

# Backend .env
if (!(Test-Path "backend/.env")) {
    Copy-Item "backend/.env.example" "backend/.env"
    Write-Host "Created backend/.env from template"
} else {
    Write-Host "backend/.env already exists"
}

# Frontend .env
if (!(Test-Path "frontend/.env")) {
    Copy-Item "frontend/.env.example" "frontend/.env"
    Write-Host "Created frontend/.env from template"
} else {
    Write-Host "frontend/.env already exists"
}

Write-Host ""
Write-Host "🎯 Setup complete! Next steps:" -ForegroundColor Green
Write-Host ""
Write-Host "1. 🔗 Start Hardhat blockchain:" -ForegroundColor Cyan
Write-Host "   cd blockchain"
Write-Host "   npx hardhat node"
Write-Host ""
Write-Host "2. 📜 Deploy smart contracts (in new terminal):" -ForegroundColor Cyan
Write-Host "   cd blockchain"
Write-Host "   npx hardhat run scripts/deploy.js --network localhost"
Write-Host ""
Write-Host "3. 🗄️ Start backend server (in new terminal):" -ForegroundColor Cyan
Write-Host "   cd backend"
Write-Host "   npm run dev"
Write-Host ""
Write-Host "4. 🖥️ Start frontend (in new terminal):" -ForegroundColor Cyan
Write-Host "   cd frontend"
Write-Host "   npm run dev"
Write-Host ""
Write-Host "5. 🦊 Configure MetaMask (optional):" -ForegroundColor Cyan
Write-Host "   - Network: Hardhat Local"
Write-Host "   - RPC: http://127.0.0.1:8545"
Write-Host "   - Chain ID: 31337"
Write-Host ""
Write-Host "📖 For detailed instructions, see blockchain/README.md" -ForegroundColor Yellow
Write-Host ""
Write-Host "🎉 Ready to build the future of agriculture!" -ForegroundColor Green