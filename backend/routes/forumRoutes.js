import express from "express";

import authMiddleware from "../middleware/authMiddleware.js";

import {
    createThread,
    getThreads,
    getThreadById,
    addReply,
    deleteThread,
    deleteReply
} from "../controllers/forumController.js";

const router = express.Router();


/*
    Public — browse discussions
*/
router.get("/threads", getThreads);
router.get("/threads/:id", getThreadById);


/*
    Any logged-in user — start a discussion / reply
*/
router.post("/threads", authMiddleware, createThread);
router.post("/threads/:id/replies", authMiddleware, addReply);


/*
    Author (or admin) — moderate
*/
router.delete("/threads/:id", authMiddleware, deleteThread);
router.delete("/replies/:replyId", authMiddleware, deleteReply);


export default router;
