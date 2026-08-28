import express from "express";

import authMiddleware from "../middleware/authMiddleware.js";
import adminMiddleware from "../middleware/adminMiddleware.js";

import {
    createReport,
    getMyReports,
    getAllReportsForAdmin,
    updateReportByAdmin
} from "../controllers/reportController.js";


const router = express.Router();


/*
=====================================================
CREATE REPORT
POST /api/reports
=====================================================
*/
router.post(
    "/",
    authMiddleware,
    createReport
);


/*
=====================================================
GET LOGGED-IN USER'S REPORTS
GET /api/reports/my-reports
=====================================================
*/
router.get(
    "/my-reports",
    authMiddleware,
    getMyReports
);


/*
=====================================================
GET ALL REPORTS (ADMIN)
GET /api/reports/admin/all
=====================================================
*/
router.get(
    "/admin/all",
    authMiddleware,
    adminMiddleware,
    getAllReportsForAdmin
);


/*
=====================================================
UPDATE REPORT (ADMIN)
PUT /api/reports/admin/:id
=====================================================
*/
router.put(
    "/admin/:id",
    authMiddleware,
    adminMiddleware,
    updateReportByAdmin
);


export default router;