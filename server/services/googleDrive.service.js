import { google } from "googleapis";
import "dotenv/config";

// Create a new instance of the drive API
const createDriveClient = () => {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      type: "service_account",
      project_id: process.env.GOOGLE_PROJECT_ID,
      private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
      private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      client_id: process.env.GOOGLE_CLIENT_ID,
      auth_uri: process.env.GOOGLE_AUTH_URI,
      token_uri: process.env.GOOGLE_TOKEN_URI,
      auth_provider_x509_cert_url:
        process.env.GOOGLE_AUTH_PROVIDER_X509_CERT_URL,
      client_x509_cert_url: process.env.GOOGLE_CLIENT_X509_CERT_URL,
    },
    scopes: ["https://www.googleapis.com/auth/drive.file"],
  });

  return google.drive({ version: "v3", auth });
};

/**
 * Upload a file to Google Drive
 * @param {Object} file - File object from multer
 * @param {string} [parentFolderId] - Optional parent folder ID
 * @returns {Promise<Object>} File metadata including ID and web links
 */
const uploadFile = async (file, parentFolderId = null) => {
  const drive = createDriveClient();

  const fileMetadata = {
    name: file.originalname,
    mimeType: file.mimetype,
  };

  if (parentFolderId) {
    fileMetadata.parents = [parentFolderId];
  }

  try {
    // Upload the file
    const response = await drive.files.create({
      requestBody: fileMetadata,
      media: {
        mimeType: file.mimetype,
        body: file.buffer,
      },
    });

    // Make the file publicly readable
    await drive.permissions.create({
      fileId: response.data.id,
      requestBody: {
        role: "reader",
        type: "anyone",
      },
    });

    // Get the file's web view link and content link
    const result = await drive.files.get({
      fileId: response.data.id,
      fields: "id, name, mimeType, webViewLink, webContentLink",
    });

    return {
      fileId: result.data.id,
      filename: result.data.name,
      mimeType: result.data.mimeType,
      webViewLink: result.data.webViewLink,
      webContentLink: result.data.webContentLink,
      size: file.size,
    };
  } catch (error) {
    console.error("Error uploading file to Google Drive:", error);
    throw error;
  }
};

/**
 * Delete a file from Google Drive
 * @param {string} fileId - Google Drive file ID
 * @returns {Promise<boolean>} Success status
 */
const deleteFile = async (fileId) => {
  const drive = createDriveClient();

  try {
    await drive.files.delete({
      fileId: fileId,
    });
    return true;
  } catch (error) {
    console.error("Error deleting file from Google Drive:", error);
    throw error;
  }
};

/**
 * Create a folder in Google Drive
 * @param {string} name - Folder name
 * @param {string} [parentFolderId] - Optional parent folder ID
 * @returns {Promise<string>} Folder ID
 */
const createFolder = async (name, parentFolderId = null) => {
  const drive = createDriveClient();

  const folderMetadata = {
    name,
    mimeType: "application/vnd.google-apps.folder",
  };

  if (parentFolderId) {
    folderMetadata.parents = [parentFolderId];
  }

  try {
    const response = await drive.files.create({
      requestBody: folderMetadata,
      fields: "id",
    });

    return response.data.id;
  } catch (error) {
    console.error("Error creating folder in Google Drive:", error);
    throw error;
  }
};

/**
 * Get the Google Docs Viewer URL for a file
 * @param {string} fileId - Google Drive file ID
 * @returns {string} Google Docs Viewer URL
 */
const getViewerUrl = (fileId) => {
  return `https://docs.google.com/gview?url=https://drive.google.com/uc?id=${fileId}&embedded=true`;
};

export { uploadFile, deleteFile, createFolder, getViewerUrl };
