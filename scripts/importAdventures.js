const fs = require("node:fs/promises");
const path = require("node:path");
const projectRoot = path.resolve(__dirname, "..");
require("dotenv").config({ path: path.join(projectRoot, ".env") });

const mongoose = require("mongoose");
const { connectDatabase } = require("../config/database");
const Adventure = require("../models/Adventure");

async function importAdventures() {
    try {
        if (!process.env.MONGODB_URI) {
            throw new Error("MONGODB_URI is required to import adventures.");
        }

        const source = await fs.readFile(
            path.join(projectRoot, "adventures.json"),
            "utf8"
        );
        const adventures = JSON.parse(source);

        if (!Array.isArray(adventures)) {
            throw new Error("adventures.json must contain an array.");
        }

        await connectDatabase(process.env.MONGODB_URI);

        const operations = [];
        const seenNames = new Set();

        for (const record of adventures) {
            const adventure = new Adventure(record);
            await adventure.validate();

            if (seenNames.has(adventure.name)) {
                continue;
            }

            seenNames.add(adventure.name);
            operations.push({
                updateOne: {
                    filter: { name: adventure.name },
                    update: { $setOnInsert: adventure.toObject() },
                    upsert: true
                }
            });
        }

        const result = operations.length
            ? await Adventure.bulkWrite(operations, { ordered: true })
            : { upsertedCount: 0 };

        console.log(
            `Adventure import complete: ${result.upsertedCount} inserted, ` +
            `${operations.length - result.upsertedCount} already present.`
        );
    } finally {
        await mongoose.disconnect();
    }
}

if (require.main === module) {
    importAdventures().catch((error) => {
        console.error("Adventure import failed:", error.message);
        process.exitCode = 1;
    });
}

module.exports = { importAdventures };
