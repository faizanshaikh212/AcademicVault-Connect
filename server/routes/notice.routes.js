import express from "express";
import { protect as auth } from "../middleware/auth.middleware.js";
import { admin } from "../middleware/admin.middleware.js";
import TeacherMiddleware from "../middleware/teacher.middleware.js";
import * as noticeController from "../controllers/notice.controller.js";

const noticeRouter = express.Router();

// Public endpoints
noticeRouter.get("/notices", noticeController.getPublishedNotices);
noticeRouter.get("/notices/:id", noticeController.getNoticeById);

// Admin endpoints for all notices
noticeRouter.get("/notices/all", [auth, admin], noticeController.getAllNotices);

// Teacher and Admin can create notices
noticeRouter.post("/notices/create", [auth, TeacherMiddleware], noticeController.createNotice);

// Update & delete (auth + admin or teacher who is author) - for simplicity allow admin only for now
noticeRouter.put("/notices/:id", [auth, admin], noticeController.updateNotice);
noticeRouter.delete("/notices/:id", [auth, admin], noticeController.deleteNotice);

export { noticeRouter as default };
