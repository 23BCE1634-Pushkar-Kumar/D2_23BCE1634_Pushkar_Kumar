const express = require("express");
const { authorizeRoles } = require("../middleware/auth");

const router = express.Router();

// Get weather data (mock implementation - replace with real weather API)
router.get("/current", authorizeRoles(["farmer", "retailer", "distributor"]), async (req, res) => {
    try {
        const { lat, lon } = req.query;

        if (!lat || !lon) {
            return res.status(400).json({ error: "Latitude and longitude are required" });
        }

        // Mock weather data - in production, integrate with OpenWeatherMap or similar
        const mockWeatherData = {
            location: {
                lat: parseFloat(lat),
                lon: parseFloat(lon),
                city: "Sample City"
            },
            current: {
                temperature: Math.floor(Math.random() * 20) + 15, // 15-35°C
                humidity: Math.floor(Math.random() * 40) + 40,    // 40-80%
                windSpeed: Math.floor(Math.random() * 15) + 5,    // 5-20 km/h
                description: ["sunny", "partly cloudy", "cloudy", "light rain"][Math.floor(Math.random() * 4)],
                pressure: Math.floor(Math.random() * 50) + 1000,  // 1000-1050 hPa
                visibility: Math.floor(Math.random() * 5) + 5,    // 5-10 km
                uvIndex: Math.floor(Math.random() * 10) + 1       // 1-10
            },
            forecast: [
                {
                    day: "Today",
                    high: Math.floor(Math.random() * 20) + 20,
                    low: Math.floor(Math.random() * 10) + 10,
                    description: "sunny"
                },
                {
                    day: "Tomorrow",
                    high: Math.floor(Math.random() * 20) + 20,
                    low: Math.floor(Math.random() * 10) + 10,
                    description: "partly cloudy"
                },
                {
                    day: "Day 3",
                    high: Math.floor(Math.random() * 20) + 20,
                    low: Math.floor(Math.random() * 10) + 10,
                    description: "light rain"
                }
            ],
            alerts: [],
            timestamp: new Date()
        };

        // Add weather alerts for farming
        if (mockWeatherData.current.temperature > 30) {
            mockWeatherData.alerts.push({
                type: "high_temperature",
                message: "High temperature alert - consider irrigation",
                severity: "medium"
            });
        }

        if (mockWeatherData.current.description.includes("rain")) {
            mockWeatherData.alerts.push({
                type: "rain",
                message: "Rain expected - plan harvesting accordingly",
                severity: "low"
            });
        }

        res.json({
            success: true,
            weather: mockWeatherData
        });

    } catch (error) {
        console.error("Weather API error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Get crop-specific weather advice
router.get("/crop-advice", authorizeRoles(["farmer"]), async (req, res) => {
    try {
        const { crop, lat, lon } = req.query;

        if (!crop) {
            return res.status(400).json({ error: "Crop type is required" });
        }

        // Mock crop-specific advice based on weather
        const cropAdvice = {
            wheat: {
                wateringAdvice: "Water early morning or late evening",
                temperatureAlert: "Optimal temperature range: 15-25°C",
                generalTips: ["Monitor for rust diseases", "Check soil moisture regularly"]
            },
            rice: {
                wateringAdvice: "Maintain constant water level in fields",
                temperatureAlert: "Optimal temperature range: 20-30°C",
                generalTips: ["Watch for blast disease", "Ensure proper drainage"]
            },
            corn: {
                wateringAdvice: "Deep watering twice a week",
                temperatureAlert: "Optimal temperature range: 18-27°C",
                generalTips: ["Monitor for corn borer", "Side-dress with nitrogen"]
            },
            tomato: {
                wateringAdvice: "Water at soil level to avoid leaf diseases",
                temperatureAlert: "Optimal temperature range: 18-24°C",
                generalTips: ["Stake plants early", "Watch for blight symptoms"]
            }
        };

        const advice = cropAdvice[crop.toLowerCase()] || {
            wateringAdvice: "Water based on soil moisture levels",
            temperatureAlert: "Monitor temperature for optimal growth",
            generalTips: ["Regular monitoring recommended", "Consult local agricultural extension"]
        };

        res.json({
            success: true,
            crop,
            advice,
            timestamp: new Date()
        });

    } catch (error) {
        console.error("Crop advice error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

module.exports = router;