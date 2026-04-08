const { ObjectId } = require("mongodb");

class User {
    constructor(db) {
        this.collection = db.collection("users");
    }

    async createUser(userData) {
        const { name, email, password, role, location } = userData;

        // Validate role
        const validRoles = ["farmer", "retailer", "distributor", "consumer"];
        if (!validRoles.includes(role)) {
            throw new Error("Invalid role specified");
        }

        const user = {
            name,
            email: email.toLowerCase(),
            password, // Should be hashed before calling this
            role,
            location: location || null,
            createdAt: new Date(),
            updatedAt: new Date(),
            isActive: true
        };

        return await this.collection.insertOne(user);
    }

    async findByEmail(email) {
        return await this.collection.findOne({ email: email.toLowerCase() });
    }

    async findById(userId) {
        return await this.collection.findOne({ _id: new ObjectId(userId) });
    }

    async updateUser(userId, updateData) {
        return await this.collection.updateOne(
            { _id: new ObjectId(userId) },
            { $set: { ...updateData, updatedAt: new Date() } }
        );
    }

    async getUsersByRole(role) {
        return await this.collection.find({ role, isActive: true }).toArray();
    }
}

module.exports = User;