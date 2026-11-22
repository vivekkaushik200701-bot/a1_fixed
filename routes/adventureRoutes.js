const express = require("express");
const router = express.Router();

const Adventure = require("../models/Adventure");

// 1. CREATE - Add a new adventure
router.post("/", async (req, res) => {
    try {
        const adventure = await Adventure.create(req.body);

        res.status(201).json({
            success: true,
            message: "Adventure created successfully",
            data: adventure
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

// 2. READ - Get all adventures
router.get("/", async (req, res) => {
    try {
        const adventures = await Adventure.find();

        res.status(200).json({
            success: true,
            data: adventures
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// READ - Get one adventure by ID
router.get("/:id", async (req, res) => {
    try {
        if (!/^[0-9a-fA-F]{24}$/.test(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid adventure ID"
            });
        }

        const adventure = await Adventure.findById(req.params.id);

        if (!adventure) {
            return res.status(404).json({
                success: false,
                message: "Adventure not found"
            });
        }

        res.status(200).json({
            success: true,
            data: adventure
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// 3. UPDATE - Update an adventure
router.put("/:id", async (req, res) => {
    try {
        if (!/^[0-9a-fA-F]{24}$/.test(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid adventure ID"
            });
        }

        const adventure = await Adventure.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true
            }
        );

        if (!adventure) {
            return res.status(404).json({
                success: false,
                message: "Adventure not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Adventure updated successfully",
            data: adventure
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

// 4. DELETE - Delete an adventure
router.delete("/:id", async (req, res) => {
    try {
        if (!/^[0-9a-fA-F]{24}$/.test(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid adventure ID"
            });
        }

        const adventure = await Adventure.findByIdAndDelete(
            req.params.id
        );

        if (!adventure) {
            return res.status(404).json({
                success: false,
                message: "Adventure not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Adventure deleted successfully"
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

module.exports = router;
