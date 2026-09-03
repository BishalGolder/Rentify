import express from "express";

import authMiddleware from "../middleware/authMiddleware.js";
import guestMiddleware from "../middleware/guestMiddleware.js";
import hostOrAdminMiddleware from "../middleware/hostOrAdminMiddleware.js";
import adminMiddleware from "../middleware/adminMiddleware.js";

import {
    createCoupon,
    getMyCoupons,
    getAllCouponsForAdmin,
    updateCoupon,
    deleteCoupon,
    validateCoupon
} from "../controllers/couponController.js";

const router = express.Router();


/*
    Host or Admin — create a coupon
*/
router.post("/", authMiddleware, hostOrAdminMiddleware, createCoupon);


/*
    Host or Admin — coupons they personally created
*/
router.get("/mine", authMiddleware, hostOrAdminMiddleware, getMyCoupons);


/*
    Admin — every coupon on the platform
*/
router.get("/admin/all", authMiddleware, adminMiddleware, getAllCouponsForAdmin);


/*
    Guest — validate/preview a coupon before booking
*/
router.post("/validate", authMiddleware, guestMiddleware, validateCoupon);


/*
    Host or Admin — update / delete a coupon
    (ownership, or admin override, is enforced in the controller)
*/
router.put("/:id", authMiddleware, hostOrAdminMiddleware, updateCoupon);
router.delete("/:id", authMiddleware, hostOrAdminMiddleware, deleteCoupon);


export default router;
