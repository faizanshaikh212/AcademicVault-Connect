/**
 * Local Storage Service
 * Handles file uploads to local filesystem as fallback when Google Drive fails
 */

import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class LocalStorageService {
  constructor() {
    this.uploadsDir = path.join(__dirname, "..", "..", "LocalStorage");
    this.baseUrl = process.env.BASE_URL || "http://localhost:5001";
    this.initializeDirectories();
  }

  async initializeDirectories() {
    try {
      // Create main uploads directory
      await fs.mkdir(this.uploadsDir, { recursive: true });

      // Create category subdirectories
      const categories = ["notes", "questionPapers", "syllabus", "timetables"];
      for (const category of categories) {
        await fs.mkdir(path.join(this.uploadsDir, category), {
          recursive: true,
        });
      }
    } catch (error) {
      console.error("Error creating upload directories:", error);
    }
  }

  /**
   * Upload file to local storage
   */
  async uploadFile(
    fileBuffer,
    fileName,
    mimeType,
    category = "notes",
    metadata = {}
  ) {
    try {
      // Create category directory if it doesn't exist
      const categoryDir = path.join(this.uploadsDir, category);
      await fs.mkdir(categoryDir, { recursive: true });

      // Create course subdirectory if specified
      let targetDir = categoryDir;
      if (metadata.course) {
        const courseDir = path.join(
          categoryDir,
          this.sanitizeFileName(metadata.course)
        );
        await fs.mkdir(courseDir, { recursive: true });
        targetDir = courseDir;
      }

      // Generate unique filename
      const timestamp = Date.now();
      const sanitizedFileName = this.sanitizeFileName(fileName);
      const uniqueFileName = `${timestamp}-${sanitizedFileName}`;
      const filePath = path.join(targetDir, uniqueFileName);

      // Write file to disk
      await fs.writeFile(filePath, fileBuffer);

      // Generate URLs
      const relativePath = path
        .relative(this.uploadsDir, filePath)
        .replace(/\\/g, "/");
      const publicUrl = `${this.baseUrl}/api/files/view/${encodeURIComponent(
        relativePath
      )}`;
      const downloadUrl = `${
        this.baseUrl
      }/api/files/download/${encodeURIComponent(relativePath)}`;

      // Get file stats
      const stats = await fs.stat(filePath);

      return {
        fileId: uniqueFileName,
        fileName: sanitizedFileName,
        fileSize: stats.size,
        mimeType: mimeType,
        publicUrl: publicUrl,
        downloadUrl: downloadUrl,
        localPath: filePath,
      };
    } catch (error) {
      console.error("Error uploading file to local storage:", error);
      throw error;
    }
  }

  /**
   * Delete file from local storage
   */
  async deleteFile(fileId, category = "notes") {
    try {
      // Find file by searching in category directory
      const categoryDir = path.join(this.uploadsDir, category);
      const files = await this.findFileRecursively(categoryDir, fileId);

      if (files.length > 0) {
        await fs.unlink(files[0]);
        return true;
      }

      return false;
    } catch (error) {
      console.error("Error deleting file from local storage:", error);
      throw error;
    }
  }

  /**
   * Get file info
   */
  async getFileInfo(fileId, category = "notes") {
    try {
      const categoryDir = path.join(this.uploadsDir, category);
      const files = await this.findFileRecursively(categoryDir, fileId);

      if (files.length > 0) {
        const filePath = files[0];
        const stats = await fs.stat(filePath);
        const relativePath = path
          .relative(this.uploadsDir, filePath)
          .replace(/\\/g, "/");

        return {
          fileId: fileId,
          fileName: path.basename(filePath),
          fileSize: stats.size,
          publicUrl: `${this.baseUrl}/api/files/download/${encodeURIComponent(
            relativePath
          )}`,
          downloadUrl: `${this.baseUrl}/api/files/download/${encodeURIComponent(
            relativePath
          )}`,
          localPath: filePath,
        };
      }

      return null;
    } catch (error) {
      console.error("Error getting file info:", error);
      throw error;
    }
  }

  /**
   * Find file recursively in directory
   */
  async findFileRecursively(dir, fileName) {
    const results = [];

    try {
      const items = await fs.readdir(dir, { withFileTypes: true });

      for (const item of items) {
        const fullPath = path.join(dir, item.name);

        if (item.isDirectory()) {
          const subResults = await this.findFileRecursively(fullPath, fileName);
          results.push(...subResults);
        } else if (item.name.includes(fileName)) {
          results.push(fullPath);
        }
      }
    } catch (error) {
      // Directory doesn't exist or can't be read
    }

    return results;
  }

  /**
   * Sanitize filename for safe storage
   */
  sanitizeFileName(fileName) {
    try {
      // Ensure we always operate on a string
      if (fileName === null || fileName === undefined) {
        fileName = "file";
      }
      if (typeof fileName !== "string") {
        // Attempt to stringify objects/numbers safely
        if (typeof fileName === "object") {
          try {
            fileName = JSON.stringify(fileName);
          } catch (e) {
            fileName = String(fileName);
          }
        } else {
          fileName = String(fileName);
        }
      }

      return fileName
        .replace(/[^a-zA-Z0-9.-]/g, "_")
        .replace(/_{2,}/g, "_")
        .replace(/^_|_$/g, "");
    } catch (err) {
      // Fallback to a safe filename in case of unexpected errors
      return "file";
    }
  }

  /**
   * Create folder structure
   */
  async createFolder(folderName, parentPath = "") {
    try {
      const folderPath = path.join(
        this.uploadsDir,
        parentPath,
        this.sanitizeFileName(folderName)
      );
      await fs.mkdir(folderPath, { recursive: true });
      return folderPath;
    } catch (error) {
      console.error("Error creating folder:", error);
      throw error;
    }
  }
}

export default new LocalStorageService();
