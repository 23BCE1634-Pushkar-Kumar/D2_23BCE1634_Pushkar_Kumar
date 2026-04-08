# Agri Supply Chain Prototype – Functional Overview and Blockchain Touchpoints

This document is a concise, pitch-ready rundown of what the prototype does today, how the pieces fit together, and exactly where blockchain is used versus traditional APIs.

## 1) What the platform does (end-to-end)

- Authentication & Roles
  - Users can register/login and use role-based dashboards: Farmer, Retailer, Distributor, Consumer.
  - JWT-based auth with profiles (name, location) managed via a Settings page.

- Crop Quality Assessment (AI)
  - Farmers upload a set of crop images; backend calls Roboflow classification.
  - System aggregates predictions to compute a final quality grade and confidence.

- Auctions (Sell-side → Buy-side)
  - Farmers create auctions (crop, variety, quantity, base price, quality grade).
  - Retailers browse open auctions and place bids.
  - Farmers close/finalize auctions.

- Shipments & GPS Tracking (Logistics)
  - Distributor creates shipments that move auctioned goods.
  - ESP32 devices (or authenticated endpoints) push GPS updates.
  - Frontend map (Leaflet) shows live truck location, history, ETA, and telemetry.

- Consumer Experience (E‑commerce flavor)
  - Shop view lists produce available (from REST or demo inventory), cart, checkout (local orders for prototype), orders list, and live tracking per order.
  - QR scanning lets a consumer pull shipment/product details and see live tracking.

## 2) System architecture (at a glance)

- Frontend: React + Vite + Tailwind + Leaflet
  - Role-based dashboards with REST API calls and optional blockchain proxy calls.
  - Direct wallet interactions are available via ethers in hooks (not the primary flow).

- Backend: Node/Express + MongoDB
  - REST APIs for auth, auctions, shipments, tracking, weather (mock), classification (Roboflow callout).
  - Blockchain proxy routes use ethers.js to talk to deployed smart contracts.

- Blockchain: Hardhat + EVM contracts
  - AuctionContract: on-chain auctions.
  - TrackingContract: shipment lifecycle + on-chain GPS log.
  - ProvenanceContract: product creation and stage history by QR.

## 3) Traditional API vs Blockchain – exact touchpoints

Traditional (REST + MongoDB)
- Auth: POST /api/auth/register, POST /api/auth/login, GET/PUT /api/auth/profile
- Auctions (Primary app flow):
  - POST /api/auctions/create (farmer)
  - GET /api/auctions/open
  - GET /api/auctions/:id
  - POST /api/auctions/:id/bid (retailer)
  - GET /api/auctions/farmer/my-auctions
  - GET /api/auctions/retailer/my-bids
  - PUT /api/auctions/:id/close (farmer)
- Tracking & Telemetry (ESP32 → REST → MongoDB):
  - POST /api/tracker/:truckId  (public endpoint for IoT)
  - POST /api/tracker/:truckId/location (auth distributor)
  - GET /api/tracker/:truckId/latest
  - GET /api/tracker/:truckId/history (auth distributor/consumer)
  - GET /api/tracker/:truckId/eta (auth distributor/consumer)
- Shipments (DB model):
  - POST /api/shipments/create
  - PUT /api/shipments/:id/status
  - GET /api/shipments/qr/:qrCode
  - GET /api/shipments/truck/:truckId
  - GET /api/shipments/my-shipments
- Weather (demo):
  - GET /api/weather/current
  - GET /api/weather/crop-advice
- AI Classification (Roboflow):
  - POST /api/auctions/classify-images (multi-image quality assessment)

Blockchain (via backend proxy using ethers.js)
- Route base: /api/blockchain
- Auctions on-chain:
  - POST /api/blockchain/auction/create → AuctionContract.createAuction
  - GET  /api/blockchain/auction/:id → AuctionContract.getAuction
  - POST /api/blockchain/auction/:id/bid → AuctionContract.placeBid
  - GET  /api/blockchain/auctions/active → AuctionContract.getActiveAuctions
- Tracking on-chain:
  - POST /api/blockchain/tracking/shipment → TrackingContract.createShipment
  - POST /api/blockchain/tracking/location → TrackingContract.updateLocation
  - GET  /api/blockchain/tracking/shipment/:id/history → TrackingContract.getTrackingHistory
- Provenance on-chain:
  - POST /api/blockchain/provenance/product → ProvenanceContract.createProduct
  - GET  /api/blockchain/provenance/qr/:qrHash → ProvenanceContract.getProductByQR + getProductHistory

Direct wallet hooks (optional)
- Frontend contains ethers-based hooks (e.g., useAuction, useProvenance) for MetaMask interaction, but the main prototype path goes through the backend proxy.

## 4) Why blockchain here? (business story)

- Transparent Auctions: On-chain auctions eliminate disputes about bids and end-times; anyone can verify outcomes.
- Tamper-proof Tracking: GPS location updates and events can be immutably recorded, making route deviations or tampering auditable.
- Product Provenance: Each product’s QR code links to on-chain data (origin, quality, stages), building consumer trust.

In the prototype, critical checkpoints are demonstrated on-chain (create auction, bid, create shipment, update GPS on-chain, create product and read by QR) while the day‑to‑day high‑throughput reads (lists, maps) use REST/MongoDB for speed and cost. This hybrid approach is realistic for deployments.

## 5) User journeys (pitch-friendly)

- Farmer
  - Upload crop images, get AI quality grade.
  - Create an auction (REST, with optional blockchain mirror).
  - View and close auctions; receive payment once finalized (on-chain in future extensions).

- Retailer
  - Browse open auctions; place bids.
  - Track bids and wins; initiate shipment with distributor.

- Distributor
  - Create shipments; push GPS data from truck (ESP32 → REST or on-chain route).
  - Operations dashboard shows live map, history, and ETAs.

- Consumer
  - Shop for produce, add to cart, checkout (prototype-local orders).
  - Scan QR to view product provenance and shipment; see live tracking.

## 6) Live tracking and QR in the UI (what’s visible now)

- Live map shows current truck location, history polyline, ETA, and telemetry (speed, engine temp, fuel, battery; mocked where needed).
- Tracking view also shows product panels: Product Details, Farmer Details, Quality Tests.
- QR scanner pulls shipment by QR and falls back to a realistic mock if backend lacks it—great for demos without data seeding.

## 7) Deployment/dev assumptions

- Hardhat local network at http://127.0.0.1:8545; contract addresses and ABIs loaded from blockchain/artifacts and blockchain/contract-addresses.json.
- Backend reads BLOCKCHAIN_RPC_URL and PRIVATE_KEY (falls back to Hardhat defaults) to write to contracts.
- MongoDB configured via MONGO_URI; see init-mongo.js.

## 8) What’s next (clear roadmap)

- Persist Orders: Add Order model and endpoints; link orders → shipmentId → blockchain tracking.
- Unify Auction IDs: Map Mongo auction IDs to on-chain IDs; show both in UI.
- Product Provenance in Consumer UI: Add dedicated view reading /api/blockchain/provenance/qr/:qrHash.
- Event-Driven Updates: Listen to contract events (AuctionCreated, BidPlaced, ShipmentCreated) to update UI in real-time.
- Payments: Integrate settlement flow on-chain when auctions finalize.

---

Elevator Summary:
This prototype digitizes the agri supply chain from farmer to consumer, with AI-backed quality grading, transparent auctions, verifiable logistics, and consumer‑grade tracking via QR. Blockchain is used at the trust-critical points (auctions, tracking, provenance) while REST handles fast operational reads—resulting in a practical, demo‑ready, and scalable architecture.