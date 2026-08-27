import express from "express";

import authMiddleware from "../middleware/authMiddleware.js";
import hostMiddleware from "../middleware/hostMiddleware.js";

import {
    getUnavailableRanges,
    createUnavailableRange,
    deleteUnavailableRange
} from "../controllers/availabilityController.js";

const router = express.Router();


/*
=====================================================
GET UNAVAILABLE RANGES FOR A PROPERTY (PUBLIC)
=====================================================
*/

router.get("/:propertyId", getUnavailableRanges);


/*
=====================================================
CREATE UNAVAILABILITY BLOCK (host only)
=====================================================

Host decides, per property, which dates to mark
unavailable. Entirely optional — hosts don't have to
block anything for guests to be able to book.
=====================================================
*/

router.post("/", authMiddleware, hostMiddleware, createUnavailableRange);


/*
=====================================================
REMOVE UNAVAILABILITY BLOCK (host only)
=====================================================
*/

router.delete("/:id", authMiddleware, hostMiddleware, deleteUnavailableRange);


export default router;
