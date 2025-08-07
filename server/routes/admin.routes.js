import express from "express";
import {
  getAllUsers,
  updateUserRole,
  getDashboardStats,
  getRoleRequests,
  handleRoleRequest,
  getPremiumUsers,
  createUser,
  updateUser,
  deleteUser,
  renewPremium,
  revokePremium,
  deletePremiumRequest,
} from "../controllers/admin.controller.js";
import {
  getAllPremiumRequests,
  updatePremiumRequestStatus,
} from "../controllers/premium.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import { admin } from "../middleware/admin.middleware.js";

const router = express.Router();

// All routes in this file are protected and require admin access
router.use(protect, admin);

// Dashboard and stats
router.get("/stats", getDashboardStats);

// User management
router.get("/users", getAllUsers);
router.post("/users", createUser);
router.put("/users/:id", updateUser);
router.delete("/users/:id", deleteUser);
router.put("/users/:id/role", updateUserRole);

// Premium users
router.get("/premium-users", getPremiumUsers);
router.post("/users/:id/renew-premium", renewPremium);
router.post("/users/:id/revoke-premium", revokePremium);

// Role requests
router.get("/rolerequests", getRoleRequests);
router.post("/rolerequests/:id", handleRoleRequest);

// Premium requests
router.get("/premium-requests", getAllPremiumRequests);
router.put("/premium-requests/:id", updatePremiumRequestStatus);
router.delete("/premium-requests/:id", deletePremiumRequest);

export default router;
