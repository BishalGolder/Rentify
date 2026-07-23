import express from "express";

import authMiddleware from "../middleware/authMiddleware.js";

import {
    createProperty,
    getAllProperties,
    getPropertyById,
    getHostProperties,
    updateProperty,
    deleteProperty
} from "../controllers/propertyController.js";

const router = express.Router();

/*
    Public Routes
*/
router.get("/", getAllProperties);

router.get("/host/my-properties", authMiddleware, getHostProperties);

router.get("/:id", getPropertyById);

router.post("/", authMiddleware, createProperty);

router.put("/:id", authMiddleware, updateProperty);

router.delete("/:id", authMiddleware, deleteProperty);

export default router;