import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import guestMiddleware from "../middleware/guestMiddleware.js";
import {
    addToWishlist,
    getWishlist,
    removeFromWishlist,
    checkWishlist
} from "../controllers/wishlistController.js";
 
const router = express.Router();
 
router.get("/", authMiddleware, guestMiddleware, getWishlist);
router.post("/", authMiddleware, guestMiddleware, addToWishlist);
router.get("/check/:propertyId", authMiddleware, guestMiddleware, checkWishlist);
router.delete("/:id", authMiddleware, guestMiddleware, removeFromWishlist);
 
export default router;
