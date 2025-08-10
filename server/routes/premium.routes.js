/**
 * Premium Routes Module
 * Handles premium subscription requests and management
 * @module routes/premium
 */

import express from "express";
import { submitPremiumRequest } from "../controllers/premium.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

/**
 * @route POST /api/premium/request-premium
 * @description Submit a request for premium account status
 * @access Private
 * @body {Object} requestData - Premium request details including payment info
 * @returns {Object} Created premium request
 */
router.post("/request-premium", protect, submitPremiumRequest);

export default router;
