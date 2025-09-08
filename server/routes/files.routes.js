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
router.use(cors());

// Add security headers middleware
router.use((req, res, next) => {
  // Allow cross-origin resource access
  res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
  // Allow cross-origin isolation
  res.setHeader("Cross-Origin-Embedder-Policy", "credentialless");
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  // Prevent MIME type sniffing
  res.setHeader("X-Content-Type-Options", "nosniff");
  // Set permissive CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Range");
  res.setHeader(
    "Access-Control-Expose-Headers",
    "Content-Range, Accept-Ranges"
  );
  // Set Content-Security-Policy
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self' blob: data:; frame-ancestors 'self'; object-src 'self' blob:;"
  );
  // Set referrer policy
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  // Set CSP
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; img-src 'self' data: blob:; object-src 'self' blob:; frame-ancestors 'self'"
  );
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

    res.setHeader(
      "Content-Type",
      contentTypes[ext] || "application/octet-stream"
    );
    res.setHeader("Content-Length", stats.size);
    // For viewing, we don't set Content-Disposition to "attachment"

    // Set cache control headers
    res.setHeader("Cache-Control", "public, max-age=3600"); // Cache for 1 hour

    // Set Access-Control-Allow headers
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
    res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");

    // Stream the file
    const fileStream = await fs.readFile(fullPath);
    res.send(fileStream);
  } catch (error) {
    console.error("Error serving file:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Serve uploaded files for download
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

    // Set appropriate headers
    res.setHeader("Content-Length", stats.size);
    res.setHeader("Content-Disposition", `inline; filename="${fileName}"`);
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
