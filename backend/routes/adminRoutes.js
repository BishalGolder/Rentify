import express from "express";

import authMiddleware from "../middleware/authMiddleware.js";
import adminMiddleware from "../middleware/adminMiddleware.js";

import {
    getAdminSummary
} from "../controllers/adminController.js";


const router = express.Router();


/*
=====================================================
ADMIN DASHBOARD SUMMARY
GET /api/admin/summary
=====================================================
*/
router.get(
    "/summary",
    authMiddleware,
    adminMiddleware,
    getAdminSummary
);


export default router;