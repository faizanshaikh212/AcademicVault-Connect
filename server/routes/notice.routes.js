import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import {
  listNotices,
  listTeacherNotices,
  createNotice,
  getNotice,
  deleteNotice,
} from "../controllers/notice.controller.js";
import {
  multiUploadMiddleware,
  multiUploadHandler,
} from "../middleware/fileUpload.middleware.js";

const router = express.Router();

router.get("/notices", listNotices);
router.get("/notices/teacher", protect, listTeacherNotices);
router.post(
  "/notices",
  protect,
  multiUploadMiddleware,
  multiUploadHandler,
  createNotice
);
router.get("/notices/:id", getNotice);
router.delete("/notices/:id", protect, deleteNotice);

export default router;
