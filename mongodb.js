const path = require("node:path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const { connectDatabase } = require("./config/database");

const connectDB = async () => {
    try {
        const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
        await connectDatabase(uri);

        console.log("MongoDB connected successfully!");
    } catch (error) {
        console.error("MongoDB connection failed:", error.message);
        process.exit(1);
    }
};

module.exports = connectDB;
