const mongoose = require("mongoose");

const adventureSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },
    image: {
        type: String,
        required: true,
        trim: true
    },
    alt: {
        type: String,
        required: true,
        trim: true
    },
    location: {
        type: String,
        required: true,
        enum: ["indoor", "outdoor"]
    },
    category: {
        type: String,
        required: true,
        trim: true
    },
    budget: {
        type: String,
        required: true,
        enum: ["free", "low", "medium"]
    },
    price: {
        type: String,
        required: true,
        trim: true
    },
    duration: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    link: {
        type: String,
        required: true,
        trim: true
    }
}, {
    collection: "adventures"
});

module.exports = mongoose.model("Adventure", adventureSchema);
