import express from "express";
import {
  createContact,
  getAllContacts,
  updateContactStatus,
  deleteContactRequest, // add this import
} from "../controllers/contact.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import { admin } from "../middleware/admin.middleware.js";

const router = express.Router();

// Public route for submitting contact form
router.post("/", createContact);

// Admin route for viewing all contact submissions
router.get("/all", protect, admin, getAllContacts);

// PATCH route for updating contact status
router.patch("/:id/status", protect, admin, updateContactStatus);

// DELETE route for deleting a contact request
router.delete("/:id", protect, admin, deleteContactRequest);

export default router;
