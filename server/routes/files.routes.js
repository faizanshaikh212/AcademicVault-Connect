/**
 * File serving routes
 * Handles serving uploaded files from local storage
 */

import express from "express";
import path from "path";
import fs from "fs/promises";
import { fileURLToPath } from "url";
import cors from "cors";

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Enable CORS for file routes
router.use(
  cors({
    origin: true,
    credentials: false,
    optionsSuccessStatus: 200,
  })
);

// FIXED: Simplified headers for file viewing
router.use((req, res, next) => {
  // Basic CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Range");

  // Prevent MIME type sniffing
  res.setHeader("X-Content-Type-Options", "nosniff");

  // Allow cross-origin resource access
  res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");

  next();
});

// View files in browser
router.get("/view/:filePath(*)", async (req, res) => {
  try {
    const filePath = decodeURIComponent(req.params.filePath);
    const fullPath = path.join(__dirname, "..", "..", "LocalStorage", filePath);

    // Security check: ensure the file is within the uploads directory
    const uploadsDir = path.join(__dirname, "..", "..", "LocalStorage");
    const resolvedPath = path.resolve(fullPath);
    const resolvedUploadsDir = path.resolve(uploadsDir);

    if (!resolvedPath.startsWith(resolvedUploadsDir)) {
      return res.status(403).json({ error: "Access denied" });
    }

    // Check if file exists
    try {
      await fs.access(fullPath);
    } catch (error) {
      return res.status(404).json({ error: "File not found" });
    }

    // Get file stats and set content type
    const stats = await fs.stat(fullPath);
    const fileName = path.basename(fullPath);
    const ext = path.extname(fileName).toLowerCase();

    const contentTypes = {
      ".pdf": "application/pdf",
      ".doc": "application/msword",
      ".docx":
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ".ppt": "application/vnd.ms-powerpoint",
      ".pptx":
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      ".txt": "text/plain",
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
    };

    // FIXED: Set proper headers for inline viewing
    const contentType = contentTypes[ext] || "application/octet-stream";
    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Length", stats.size);

    // CRITICAL FIX: For PDFs and viewable files, use inline disposition
    if ([".pdf", ".txt", ".jpg", ".jpeg", ".png"].includes(ext)) {
      res.setHeader("Content-Disposition", `inline; filename="${fileName}"`);
    } else {
      // For documents that browsers can't display natively, still try inline first
      res.setHeader("Content-Disposition", `inline; filename="${fileName}"`);
    }

    // Set cache control headers
    res.setHeader("Cache-Control", "public, max-age=3600");

    // FIXED: Set proper CORS headers for viewing
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Range");
    res.setHeader(
      "Access-Control-Expose-Headers",
      "Content-Length, Content-Range, Accept-Ranges"
    );

    // Remove conflicting Cross-Origin headers that might cause about:blank
    // res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
    // res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");

    // Stream the file
    const fileStream = await fs.readFile(fullPath);
    res.send(fileStream);
  } catch (error) {
    console.error("Error serving file:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Serve uploaded files for download (force download)
router.get("/download/:filePath(*)", async (req, res) => {
  try {
    const filePath = decodeURIComponent(req.params.filePath);
    const fullPath = path.join(__dirname, "..", "..", "LocalStorage", filePath);

    // Security check: ensure the file is within the uploads directory
    const uploadsDir = path.join(__dirname, "..", "..", "LocalStorage");
    const resolvedPath = path.resolve(fullPath);
    const resolvedUploadsDir = path.resolve(uploadsDir);

    if (!resolvedPath.startsWith(resolvedUploadsDir)) {
      return res.status(403).json({ error: "Access denied" });
    }

    // Check if file exists
    try {
      await fs.access(fullPath);
    } catch (error) {
      return res.status(404).json({ error: "File not found" });
    }

    // Get file stats
    const stats = await fs.stat(fullPath);
    const fileName = path.basename(fullPath);

    // Set appropriate headers for DOWNLOAD
    res.setHeader("Content-Length", stats.size);
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    res.setHeader("Accept-Ranges", "bytes");

    // Determine content type based on file extension
    const ext = path.extname(fileName).toLowerCase();
    const contentTypes = {
      ".pdf": "application/pdf",
      ".doc": "application/msword",
      ".docx":
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ".ppt": "application/vnd.ms-powerpoint",
      ".pptx":
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      ".txt": "text/plain",
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
    };

    res.setHeader(
      "Content-Type",
      contentTypes[ext] || "application/octet-stream"
    );

    // Stream the file
    const fileStream = await fs.readFile(fullPath);
    res.send(fileStream);
  } catch (error) {
    console.error("Error serving file:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
