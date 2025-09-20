import express from "express";
import { protect as auth } from "../middleware/auth.middleware.js";
import { admin } from "../middleware/admin.middleware.js";
import teacher from "../middleware/teacher.middleware.js";
import * as noticeController from "../controllers/notice.controller.js";
import { Notice } from "../models/notice.model.js";

const noticeRouter = express.Router();

// Public endpoints
noticeRouter.get("/notices", noticeController.getPublishedNotices);

// Teacher/Admin endpoints for all notices - MUST come before /:id route
noticeRouter.get("/notices/all", async (req, res) => {
    try {
        console.log("Simple notices endpoint called");
        const notices = await Notice.find().sort({ createdAt: -1 });
        console.log("Found notices:", notices.length);
        res.json(notices);
    } catch (error) {
        console.error("Error in simple notices endpoint:", error);
        res.status(500).json({ message: "Failed to fetch notices", error: error.message });
    }
});

noticeRouter.get("/notices/:id", noticeController.getNoticeById);

// Teacher and Admin can create notices
noticeRouter.post("/notices/create", [auth, teacher], noticeController.createNotice);

// Update & delete (auth + admin or teacher who is author) - for simplicity allow admin only for now
noticeRouter.put("/notices/:id", [auth, admin], noticeController.updateNotice);
noticeRouter.delete("/notices/:id", [auth, admin], noticeController.deleteNotice);

export { noticeRouter as default };
