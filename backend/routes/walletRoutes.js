import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import guestMiddleware from "../middleware/guestMiddleware.js";
import adminMiddleware from "../middleware/adminMiddleware.js";
import {
    requestRecharge,
    getMyRechargeRequests,
    getMyTransactions,
    getAllPendingRequests,
    approveRecharge,
    rejectRecharge
} from "../controllers/walletController.js";
 
const router = express.Router();
 
router.post("/recharge-requests", authMiddleware, guestMiddleware, requestRecharge);
router.get("/recharge-requests", authMiddleware, guestMiddleware, getMyRechargeRequests);
router.get("/transactions", authMiddleware, guestMiddleware, getMyTransactions);
 
router.get("/admin/recharge-requests", authMiddleware, adminMiddleware, getAllPendingRequests);
router.put("/admin/recharge-requests/:id/approve", authMiddleware, adminMiddleware, approveRecharge);
router.put("/admin/recharge-requests/:id/reject", authMiddleware, adminMiddleware, rejectRecharge);
 
export default router;
