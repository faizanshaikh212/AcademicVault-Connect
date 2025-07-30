import express from "express";
import {
  accessChat,
  fetchChats,
  createGroupChat,
  getMessages,
} from "../controllers/chat.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

// All these routes are protected
router.route("/").post(protect, accessChat);
router.route("/").get(protect, fetchChats);
router.route("/group").post(protect, createGroupChat);
router.route("/:chatId/messages").get(protect, getMessages);

export default router;
