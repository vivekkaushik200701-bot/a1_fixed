const mongoose = require("mongoose");

async function connectDatabase(uri) {
    if (!uri) {
        throw new Error("MONGODB_URI is required to connect to MongoDB.");
    }

    return mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
}

module.exports = { connectDatabase };
