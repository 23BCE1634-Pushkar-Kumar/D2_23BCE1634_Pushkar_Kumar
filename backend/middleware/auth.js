const jwt = require("jsonwebtoken");

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: "Access token required" });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: "Invalid or expired token" });
        }
        req.user = user;
        next();
    });
}

function authorizeRoles(allowedRoles) {
    return function (req, res, next) {
        const token = req.headers.authorization?.split(" ")[1];

        if (!token) {
            return res.status(401).json({ error: "No authorization token provided" });
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = decoded;

            if (!allowedRoles.includes(decoded.role)) {
                return res.status(403).json({
                    error: "Access denied. Insufficient permissions for this role.",
                    requiredRoles: allowedRoles,
                    userRole: decoded.role
                });
            }

            next();
        } catch (err) {
            return res.status(401).json({ error: "Invalid or expired token" });
        }
    };
}

module.exports = { authenticateToken, authorizeRoles };