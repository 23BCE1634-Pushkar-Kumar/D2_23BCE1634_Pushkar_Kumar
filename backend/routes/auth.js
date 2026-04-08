const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { connectDB } = require("../utils/db");
const User = require("../models/User");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

// Register new user
router.post("/register", async (req, res) => {
    try {
        const { name, email, password, role, location } = req.body;

        // Validation
        if (!name || !email || !password || !role) {
            return res.status(400).json({
                error: "Name, email, password, and role are required"
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                error: "Password must be at least 6 characters long"
            });
        }

        const db = await connectDB();
        const userModel = new User(db);

        // Check if user already exists
        const existingUser = await userModel.findByEmail(email);
        if (existingUser) {
            return res.status(400).json({ error: "User with this email already exists" });
        }

        // Hash password
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Create user
        const result = await userModel.createUser({
            name,
            email,
            password: hashedPassword,
            role,
            location
        });

        res.status(201).json({
            success: true,
            message: "User created successfully",
            userId: result.insertedId
        });

    } catch (error) {
        console.error("Registration error:", error);
        res.status(500).json({ error: error.message || "Internal server error" });
    }
});

// Login user
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: "Email and password are required" });
        }

        const db = await connectDB();
        const userModel = new User(db);

        // Find user
        const user = await userModel.findByEmail(email);
        if (!user) {
            return res.status(401).json({ error: "Invalid email or password" });
        }

        // Check password
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ error: "Invalid email or password" });
        }

        // Check if user is active
        if (!user.isActive) {
            return res.status(401).json({ error: "Account has been deactivated" });
        }

        // Generate JWT token
        const token = jwt.sign(
            {
                id: user._id,
                email: user.email,
                role: user.role,
                name: user.name
            },
            process.env.JWT_SECRET,
            { expiresIn: "24h" }
        );

        res.json({
            success: true,
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                location: user.location
            }
        });

    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Get current user profile
router.get("/profile", authenticateToken, async (req, res) => {
    try {
        const db = await connectDB();
        const userModel = new User(db);

        const user = await userModel.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        res.json({
            success: true,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                location: user.location,
                createdAt: user.createdAt
            }
        });

    } catch (error) {
        console.error("Profile error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Update user profile
router.put("/profile", authenticateToken, async (req, res) => {
    try {
        const { name, location } = req.body;
        const db = await connectDB();
        const userModel = new User(db);

        const updateData = {};
        if (name) updateData.name = name;
        if (location) updateData.location = location;

        await userModel.updateUser(req.user.id, updateData);

        res.json({
            success: true,
            message: "Profile updated successfully"
        });

    } catch (error) {
        console.error("Profile update error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Verify token (useful for frontend auth checks)
router.get("/verify", authenticateToken, (req, res) => {
    res.json({
        success: true,
        user: {
            id: req.user.id,
            email: req.user.email,
            role: req.user.role,
            name: req.user.name
        }
    });
});

module.exports = router;