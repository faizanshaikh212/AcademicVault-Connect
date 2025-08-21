import express from "express";
import { protect as auth } from "../middleware/auth.middleware.js";
import { admin } from "../middleware/admin.middleware.js";
import {
  getPageBySlug,
  getAllPages,
  updatePage,
} from "../controllers/page.controller.js";

const pageRouter = express.Router();

// Public routes
pageRouter.get("/pages/:slug", getPageBySlug);

// Admin routes
pageRouter.get("/pages", [auth, admin], getAllPages);
pageRouter.put("/pages/:slug", [auth, admin], updatePage);

export default pageRouter;
