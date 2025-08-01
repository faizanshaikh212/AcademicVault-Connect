import express from "express";
import {
  getAllUsers,
  updateUserRole,
  getDashboardStats,
  getRoleRequests,
  handleRoleRequest,
} from "../controllers/admin.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import { admin } from "../middleware/admin.middleware.js";

const router = express.Router();

// All routes in this file are protected and require admin access
router.use(protect, admin);

router.get("/stats", getDashboardStats);
router.get("/users", getAllUsers);
router.put("/users/:id/role", updateUserRole);
router.get("/rolerequests", getRoleRequests);
router.post("/rolerequests/:id", handleRoleRequest);

export default router;
