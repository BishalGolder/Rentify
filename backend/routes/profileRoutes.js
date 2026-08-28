import express from "express";

import authMiddleware from "../middleware/authMiddleware.js";
import adminMiddleware from "../middleware/adminMiddleware.js";

import {
    createProfile,
    getMyProfile,
    updateProfile,
    deleteProfile,
    changeRole,
    getAllUsers
} from "../controllers/profileController.js";

const router = express.Router();

router.post("/", authMiddleware, createProfile);

router.get("/me", authMiddleware, getMyProfile);

router.put("/me", authMiddleware, updateProfile);

router.delete("/me", authMiddleware, deleteProfile);

router.get("/admin/users", authMiddleware, adminMiddleware, getAllUsers);

router.put("/:id/role", authMiddleware, adminMiddleware, changeRole);

export default router;