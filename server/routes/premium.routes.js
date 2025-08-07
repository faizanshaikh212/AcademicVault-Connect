import express from "express";
import { submitPremiumRequest } from "../controllers/premium.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/request-premium", protect, submitPremiumRequest);

export default router;
