/**
 * File Storage Service
 * Handles local file storage operations
 */

import localStorageService from "./localStorage.service.js";
import { cloudinary } from "../config/cloudinary.js";

// Helper to check if a fileId is a cloudinary resource (we prefix cloudinary ids)
const CLOUDINARY_PREFIX = "cloudinary:";

class FileStorageService {
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
      // If it's an image, upload to Cloudinary
      if (mimeType && mimeType.startsWith("image/")) {
        console.log("Uploading image to Cloudinary...");

        // Create a data URI from buffer
        const dataUri = `data:${mimeType};base64,${fileBuffer.toString(
          "base64"
        )}`;

        // Build upload options - keep generic transformations; detailed per-request
        // transformations are handled by multer-storage-cloudinary when used directly.
        const uploadOptions = {
          folder: metadata.folder || "academic-vault",
          resource_type: "image",
          use_filename: false,
          unique_filename: true,
          overwrite: false,
          context: {
            original_filename: fileName,
            category: category,
            ...metadata,
          },
        };

        const result = await cloudinary.uploader.upload(dataUri, uploadOptions);

        return {
          fileId: `${CLOUDINARY_PREFIX}${result.public_id}`,
          fileName: fileName,
          fileSize: result.bytes,
          mimeType: mimeType,
          publicUrl: result.secure_url,
          downloadUrl: result.secure_url,
          remote: true,
          storageType: "cloudinary",
          raw: result,
        };
      }

      // Fallback: non-image files continue to use local storage
      console.log("Uploading to local storage...");
      const result = await localStorageService.uploadFile(
        fileBuffer,
        fileName,
        mimeType,
        category,
        metadata
      );
      console.log("Local storage upload successful");
      return { ...result, storageType: "local" };
    } catch (error) {
      console.error("Local storage upload failed:", error);
      throw error;
    }
  }

  /**
   * Delete file from local storage
   */
  async deleteFile(fileId, category = "notes") {
    try {
      // If this is a cloudinary fileId (prefixed), delete via Cloudinary
      if (typeof fileId === "string" && fileId.startsWith(CLOUDINARY_PREFIX)) {
        const publicId = fileId.replace(CLOUDINARY_PREFIX, "");
        try {
          const res = await cloudinary.uploader.destroy(publicId, {
            resource_type: "image",
            invalidate: true,
          });
          return res.result === "ok" || res.result === "not found";
        } catch (err) {
          console.error("Error deleting cloudinary resource:", err);
          throw err;
        }
      }

      return await localStorageService.deleteFile(fileId, category);
    } catch (error) {
      console.error("Error deleting file:", error);
      throw error;
    }
  }

  /**
   * Get file info from local storage
   */
  async getFileInfo(fileId, category = "notes") {
    try {
      // Cloudinary stored files are prefixed with CLOUDINARY_PREFIX
      if (typeof fileId === "string" && fileId.startsWith(CLOUDINARY_PREFIX)) {
        const publicId = fileId.replace(CLOUDINARY_PREFIX, "");
        try {
          const res = await cloudinary.api.resource(publicId, {
            resource_type: "image",
          });

          return {
            fileId: fileId,
            fileName: res.original_filename || publicId,
            fileSize: res.bytes,
            publicUrl: res.secure_url,
            downloadUrl: res.secure_url,
            mimeType: res.format ? `image/${res.format}` : "image",
            storageType: "cloudinary",
            raw: res,
          };
        } catch (err) {
          // If resource not found, return null
          if (err.http_code === 404) return null;
          throw err;
        }
      }

      return await localStorageService.getFileInfo(fileId, category);
    } catch (error) {
      console.error("Error getting file info:", error);
      throw error;
    }
  }
}

export default new FileStorageService();
