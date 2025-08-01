import Contact from "../models/contact.model.js";
import User from "../models/user.model.js";
import bcrypt from "bcryptjs";

// Create a new contact submission
export const createContact = async (req, res) => {
  try {
    const { name, email, message, userId } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ message: "All fields are required." });
    }
    const contact = new Contact({ name, email, message, userId });
    await contact.save();
    res.status(201).json({ message: "Contact submission received." });
  } catch (error) {
    res.status(500).json({
      message: "Server error submitting contact form.",
      error: error.message,
    });
  }
};

// Get all contact submissions (admin only)
export const getAllContacts = async (req, res) => {
  try {
    const contacts = await Contact.find().sort({ createdAt: -1 });
    res.json(contacts);
  } catch (error) {
    res.status(500).json({
      message: "Server error fetching contacts.",
      error: error.message,
    });
  }
};

// Update contact status
export const updateContactStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ message: "Status is required." });
    }
    const contact = await Contact.findById(id);
    if (!contact) {
      return res.status(404).json({ message: "Contact not found." });
    }
    contact.status = status;
    await contact.save();
    res.json({ message: "Status updated.", contact });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Server error updating status.", error: error.message });
  }
};

// Delete a contact request (admin only, password confirmation)
export const deleteContactRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ message: "Password is required." });
    }
    // Find admin user
    const adminUser = await User.findById(req.user._id);
    if (!adminUser || !adminUser.role.includes("admin")) {
      return res.status(403).json({ message: "Unauthorized." });
    }
    // Check password
    const isMatch = await bcrypt.compare(password, adminUser.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Incorrect password." });
    }
    // Delete contact request
    const deleted = await Contact.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ message: "Contact request not found." });
    }
    res.json({ message: "Contact request deleted." });
  } catch (error) {
    res.status(500).json({
      message: "Server error deleting contact request.",
      error: error.message,
    });
  }
};
