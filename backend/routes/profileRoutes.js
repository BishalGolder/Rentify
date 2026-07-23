import express from "express";

import authMiddleware from "../middleware/authMiddleware.js";

import {
    createProfile,
    getMyProfile,
    updateProfile,
    deleteProfile,
    changeRole
} from "../controllers/profileController.js";

const router = express.Router();

router.post("/", authMiddleware, createProfile);

router.get("/me", authMiddleware, getMyProfile);

router.put("/me", authMiddleware, updateProfile);

router.delete("/me", authMiddleware, deleteProfile);

router.put("/:id/role", authMiddleware, changeRole);

export default router;