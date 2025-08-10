/**
 * Contact Routes Module
 * Handles contact form submissions and admin management
 * Includes both public and admin routes
 * @module routes/contact
 */

import express from "express";
import {
  createContact,
  getAllContacts,
  updateContactStatus,
  deleteContactRequest,
} from "../controllers/contact.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import { admin } from "../middleware/admin.middleware.js";

const router = express.Router();

/**
 * @route POST /api/contact
 * @description Submit a new contact form
 * @access Public
 * @body {Object} contactData - Contact form data including name, email, message
 * @returns {Object} Created contact request
 */
router.post("/", createContact);

/**
 * @route GET /api/contact/all
 * @description Get all contact form submissions (admin only)
 * @access Private/Admin
 * @returns {Array<Object>} Array of contact submissions
 */
router.get("/all", protect, admin, getAllContacts);

/**
 * @route PATCH /api/contact/:id/status
 * @description Update status of a contact request (admin only)
 * @access Private/Admin
 * @param {string} id - Contact request ID
 * @body {string} status - New status for the contact request
 * @returns {Object} Updated contact request
 */
router.patch("/:id/status", protect, admin, updateContactStatus);

/**
 * @route DELETE /api/contact/:id
 * @description Delete a contact request (admin only)
 * @access Private/Admin
 * @param {string} id - Contact request ID
 * @returns {Object} Success message
 */
router.delete("/:id", protect, admin, deleteContactRequest);

export default router;
