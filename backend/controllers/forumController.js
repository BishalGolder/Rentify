import * as ForumModel from "../models/forumModel.js";

const CATEGORIES = ["general", "tips", "host-help", "guest-help", "announcements"];


/*
=====================================================
CREATE THREAD
=====================================================
*/

export const createThread = async (req, res) => {

    try {

        const authorId = req.user.id;

        let { title, body, category, property_id } = req.body;

        if (!title || !title.trim()) {
            return res.status(400).json({ message: "A title is required." });
        }

        if (!body || !body.trim()) {
            return res.status(400).json({ message: "Post content is required." });
        }

        if (category && !CATEGORIES.includes(category)) {
            return res.status(400).json({ message: `category must be one of: ${CATEGORIES.join(", ")}` });
        }

        const threadData = {
            author_id: authorId,
            title: title.trim(),
            body: body.trim(),
            category: category || "general",
            property_id: property_id || null
        };

        const { data, error } = await ForumModel.createThread(threadData, req.supabase);

        if (error) {
            return res.status(400).json({ message: error.message });
        }

        return res.status(201).json({ message: "Thread created.", thread: data });

    } catch (error) {

        console.error("Create Thread Error:", error);
        return res.status(500).json({ message: "Failed to create thread." });

    }

};


/*
=====================================================
GET THREADS (public, optionally filtered by category)
=====================================================
*/

export const getThreads = async (req, res) => {

    try {

        const { category } = req.query;

        if (category && !CATEGORIES.includes(category)) {
            return res.status(400).json({ message: `category must be one of: ${CATEGORIES.join(", ")}` });
        }

        const { data, error } = await ForumModel.getThreads(category || null);

        if (error) {
            return res.status(400).json({ message: error.message });
        }

        return res.json(data || []);

    } catch (error) {

        console.error("Get Threads Error:", error);
        return res.status(500).json({ message: "Failed to load discussions." });

    }

};


/*
=====================================================
GET A SINGLE THREAD + ITS REPLIES (public)
=====================================================
*/

export const getThreadById = async (req, res) => {

    try {

        const { id } = req.params;

        const { data: thread, error: threadError } = await ForumModel.getThreadById(id);

        if (threadError) {
            return res.status(400).json({ message: threadError.message });
        }

        if (!thread) {
            return res.status(404).json({ message: "Discussion not found." });
        }

        const { data: replies, error: repliesError } = await ForumModel.getRepliesForThread(id);

        if (repliesError) {
            return res.status(400).json({ message: repliesError.message });
        }

        return res.json({ thread, replies: replies || [] });

    } catch (error) {

        console.error("Get Thread Error:", error);
        return res.status(500).json({ message: "Failed to load discussion." });

    }

};


/*
=====================================================
ADD A REPLY
=====================================================
*/

export const addReply = async (req, res) => {

    try {

        const authorId = req.user.id;
        const { id } = req.params;
        const { body } = req.body;

        if (!body || !body.trim()) {
            return res.status(400).json({ message: "Reply content is required." });
        }

        const { data: thread, error: threadError } = await ForumModel.getThreadById(id, req.supabase);

        if (threadError) {
            return res.status(400).json({ message: threadError.message });
        }

        if (!thread) {
            return res.status(404).json({ message: "Discussion not found." });
        }

        const { data, error } = await ForumModel.addReply(id, authorId, body.trim(), req.supabase);

        if (error) {
            return res.status(400).json({ message: error.message });
        }

        return res.status(201).json({ message: "Reply posted.", reply: data });

    } catch (error) {

        console.error("Add Reply Error:", error);
        return res.status(500).json({ message: "Failed to post reply." });

    }

};


/*
=====================================================
DELETE THREAD (author, or admin for any thread)
=====================================================
*/

export const deleteThread = async (req, res) => {

    try {

        const { id } = req.params;

        const { data: profile } = await req.supabase
            .from("profiles")
            .select("role")
            .eq("id", req.user.id)
            .single();

        let result;

        if (profile?.role === "admin") {

            const { serviceSupabase } = await import("../config/supabaseClient.js");

            result = await ForumModel.adminDeleteThread(id, serviceSupabase);

        } else {

            result = await ForumModel.deleteThread(id, req.user.id, req.supabase);

        }

        if (result.error) {
            return res.status(400).json({ message: result.error.message });
        }

        if (!result.data) {
            return res.status(404).json({ message: "Discussion not found, or you don't have permission to delete it." });
        }

        return res.json({ message: "Discussion deleted.", thread: result.data });

    } catch (error) {

        console.error("Delete Thread Error:", error);
        return res.status(500).json({ message: "Failed to delete discussion." });

    }

};


/*
=====================================================
DELETE REPLY (author, or admin for any reply)
=====================================================
*/

export const deleteReply = async (req, res) => {

    try {

        const { replyId } = req.params;

        const { data: profile } = await req.supabase
            .from("profiles")
            .select("role")
            .eq("id", req.user.id)
            .single();

        let result;

        if (profile?.role === "admin") {

            const { serviceSupabase } = await import("../config/supabaseClient.js");

            result = await ForumModel.adminDeleteReply(replyId, serviceSupabase);

        } else {

            result = await ForumModel.deleteReply(replyId, req.user.id, req.supabase);

        }

        if (result.error) {
            return res.status(400).json({ message: result.error.message });
        }

        if (!result.data) {
            return res.status(404).json({ message: "Reply not found, or you don't have permission to delete it." });
        }

        return res.json({ message: "Reply deleted.", reply: result.data });

    } catch (error) {

        console.error("Delete Reply Error:", error);
        return res.status(500).json({ message: "Failed to delete reply." });

    }

};
