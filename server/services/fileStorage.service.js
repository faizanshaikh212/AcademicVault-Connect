/**
 * File Storage Service
 * Handles local file storage operations
 */

import localStorageService from "./localStorage.service.js";

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
      return await localStorageService.getFileInfo(fileId, category);
    } catch (error) {
      console.error("Error getting file info:", error);
      throw error;
    }
  }
}

export default new FileStorageService();
