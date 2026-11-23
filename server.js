
const express = require("express");
const fs = require("node:fs/promises");
const path = require("node:path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const mongoose = require("mongoose");
const connectDB = require("./mongodb");
const Adventure = require("./models/Adventure");
const adventureRoutes = require("./routes/adventureRoutes");

const app = express();
const root = __dirname;
const dataFile = path.join(root, "contact-submissions.json");
const suggestionsFile = path.join(root, "suggestions.json");
const port = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: "16kb" }));
app.use("/api/adventures", (req, res, next) => {
    if (mongoose.connection.readyState !== 1) {
        return res.status(503).json({ error: "MongoDB is not connected." });
    }

    next();
}, adventureRoutes);

// Protect private project files from being accessed through the browser.
app.use((req, res, next) => {
    const blockedFiles = [
        "server.js",
        "server-old.js",
        "contact-submissions.json",
        "package.json",
        "package-lock.json"
    ];

    if (blockedFiles.includes(path.basename(req.path))) {
        return res.status(404).json({ error: "Not found" });
    }

    next();
});

// Serve frontend files such as HTML, CSS and JavaScript.
app.use(express.static(root));

// Queue writes to avoid overwriting simultaneous submissions.
let writeQueue = Promise.resolve();

async function saveSubmission(entry) {
    const task = writeQueue.catch(() => {}).then(async () => {
        let entries;

        try {
            entries = JSON.parse(await fs.readFile(dataFile, "utf8"));
        } catch (error) {
            if (error.code !== "ENOENT") throw error;
            entries = [];
        }

        if (!Array.isArray(entries)) {
            throw new Error("Invalid submissions file");
        }

        entries.push(entry);

        await fs.writeFile(
            dataFile,
            JSON.stringify(entries, null, 2) + "\n"
        );
    });

    writeQueue = task;
    return task;
}
// Save suggestions to suggestions.json.
let suggestionWriteQueue = Promise.resolve();

async function saveSuggestion(entry) {
    const task = suggestionWriteQueue.catch(() => {}).then(async () => {
        let entries;

        try {
            entries = JSON.parse(
                await fs.readFile(suggestionsFile, "utf8")
            );
        } catch (error) {
            if (error.code !== "ENOENT") throw error;
            entries = [];
        }

        if (!Array.isArray(entries)) {
            throw new Error("Invalid suggestions file");
        }

        entries.push(entry);

        await fs.writeFile(
            suggestionsFile,
            JSON.stringify(entries, null, 2) + "\n"
        );
    });

    suggestionWriteQueue = task;
    return task;
}

// GET: Fetch all contact submissions.
app.get("/api/contact", async (req, res) => {
    try {
        const entries = JSON.parse(
            await fs.readFile(dataFile, "utf8")
        );

        if (!Array.isArray(entries)) {
            throw new Error("Invalid submissions file");
        }

        res.json(entries);
    } catch (error) {
        if (error.code === "ENOENT") {
            return res.json([]);
        }

        res.status(500).json({ error: "Unable to fetch messages." });
    }
});
// GET: Fetch all adventure suggestions.
app.get("/api/suggestions", async (req, res) => {
    try {
        const entries = JSON.parse(
            await fs.readFile(suggestionsFile, "utf8")
        );

        if (!Array.isArray(entries)) {
            throw new Error("Invalid suggestions file");
        }

        res.json(entries);
    } catch (error) {
        if (error.code === "ENOENT") {
            return res.json([]);
        }

        res.status(500).json({
            error: "Unable to fetch suggestions."
        });
    }
});

// POST: Save a new contact submission.
app.post("/api/contact", async (req, res) => {
    const { name, email, subject, message } = req.body || {};

    const subjects = [
        "General Inquiry",
        "Support",
        "Feedback",
        "Adventure Suggestion"
    ];

    if (
        typeof name !== "string" ||
        !name.trim() ||
        name.length > 150 ||
        typeof email !== "string" ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ||
        email.length > 254 ||
        typeof subject !== "string" ||
        !subjects.includes(subject) ||
        typeof message !== "string" ||
        !message.trim() ||
        message.length > 5000
    ) {
        return res.status(400).json({
            error: "Please enter valid contact details."
        });
    }

    const entry = {
        name: name.trim(),
        email: email.trim(),
        subject,
        message: message.trim(),
        submittedAt: new Date().toISOString()
    };

    try {
        await saveSubmission(entry);

        res.status(201).json({
            success: true,
            message: "Contact message saved."
        });
    } catch (error) {
        res.status(500).json({
            error: "Unable to save message."
        });
    }
});
// POST: Save a new adventure suggestion.
app.post("/api/suggestions", async (req, res) => {
    const {
        activity,
        category,
        description,
        duration = "",
        budget = ""
    } = req.body || {};

    const categories = [
        "Outdoors",
        "Creative",
        "Food",
        "Relaxation",
        "Social",
        "Other"
    ];

    const budgets = [
        "",
        "Free",
        "Under $20",
        "$20-$50",
        "Over $50"
    ];

    if (
        typeof activity !== "string" ||
        !activity.trim() ||
        activity.trim().length > 80 ||
        typeof category !== "string" ||
        !categories.includes(category) ||
        typeof description !== "string" ||
        !description.trim() ||
        description.trim().length > 500 ||
        typeof duration !== "string" ||
        duration.trim().length > 40 ||
        typeof budget !== "string" ||
        !budgets.includes(budget)
    ) {
        return res.status(400).json({
            error: "Please enter a valid adventure suggestion."
        });
    }

    const entry = {
        activity: activity.trim(),
        category,
        description: description.trim(),
        duration: duration.trim(),
        budget,
        createdAt: new Date().toISOString()
    };

    try {
        await saveSuggestion(entry);

        res.status(201).json({
            success: true,
            message: "Suggestion saved."
        });
    } catch (error) {
        res.status(500).json({
            error: "Unable to save suggestion."
        });
    }
});

// GET: Fetch weather for a city using Open-Meteo.
app.get("/api/weather", async (req, res) => {
    const city = req.query.city;

    if (
        typeof city !== "string" ||
        city.trim().length < 2 ||
        city.trim().length > 80
    ) {
        return res.status(400).json({
            error: "Please enter a valid city name."
        });
    }

    try {
        // Step 1: Convert city name into geographical coordinates.
        const geoUrl = new URL(
            "https://geocoding-api.open-meteo.com/v1/search"
        );

        geoUrl.searchParams.set("name", city.trim());
        geoUrl.searchParams.set("count", "1");
        geoUrl.searchParams.set("language", "en");

        const geoResponse = await fetch(geoUrl);
        
        if (!geoResponse.ok) {
            throw new Error("Location service unavailable.");
        }

        const geoData = await geoResponse.json();
        const location = geoData.results?.[0];

        if (!location) {
            return res.status(404).json({
                error: "City not found. Try another city."
            });
        }

        // Step 2: Get weather using the coordinates.
        const weatherUrl = new URL(
            "https://api.open-meteo.com/v1/forecast"
        );

        weatherUrl.searchParams.set("latitude", location.latitude);
        weatherUrl.searchParams.set("longitude", location.longitude);
        weatherUrl.searchParams.set(
            "current",
            "temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m"
        );
        weatherUrl.searchParams.set("timezone", "auto");

        const weatherResponse = await fetch(weatherUrl);

        if (!weatherResponse.ok) {
            throw new Error("Weather service unavailable.");
        }

        const weatherData = await weatherResponse.json();

        // Step 3: Send useful weather information to frontend.
        res.json({
            city: location.name,
            country: location.country,
            current: weatherData.current,
            units: weatherData.current_units
        });

    } catch (error) {
        console.error("Weather API error:", error.message);

        res.status(502).json({
            error: "Unable to retrieve weather right now."
        });
    }
});

async function startServer() {
    await connectDB();

    try {
        const collectionName = Adventure.collection.collectionName;
        const collectionExists = await mongoose.connection.db
            .listCollections({ name: collectionName }, { nameOnly: true })
            .hasNext();

        if (!collectionExists) {
            await Adventure.createCollection();
        }
    } catch (error) {
        console.error("Unable to prepare the adventures collection:", error.message);
        process.exitCode = 1;
        return;
    }

    app.listen(port, () => {
        console.log(`Server running at http://localhost:${port}`);
    });
}

if (require.main === module) {
    startServer();
}

module.exports = { app, startServer };
