import { google } from "googleapis";
import { Readable } from "stream";
import "dotenv/config";

const auth = new google.auth.GoogleAuth({
  credentials: {
    type: "service_account",
    project_id: process.env.GOOGLE_PROJECT_ID,
    private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    client_id: process.env.GOOGLE_CLIENT_ID,
    auth_uri: process.env.GOOGLE_AUTH_URI,
    token_uri: process.env.GOOGLE_TOKEN_URI,
    auth_provider_x509_cert_url: process.env.GOOGLE_AUTH_PROVIDER_X509_CERT_URL,
    client_x509_cert_url: process.env.GOOGLE_CLIENT_X509_CERT_URL,
  },
  scopes: ["https://www.googleapis.com/auth/drive.file"],
});

const drive = google.drive({ version: "v3", auth });

async function uploadFile(file) {
  try {
    // Convert buffer to stream
    const bufferStream = new Readable();
    bufferStream.push(file.buffer);
    bufferStream.push(null);

    const response = await drive.files.create({
      requestBody: {
        name: file.originalname,
        mimeType: file.mimetype,
      },
      media: {
        mimeType: file.mimetype,
        body: bufferStream, // Use stream here!
      },
    });

    // Make the file publicly accessible
    await drive.permissions.create({
      fileId: response.data.id,
      requestBody: {
        role: "reader",
        type: "anyone",
      },
    });

    // Get the web view link
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
}

async function deleteFile(fileId) {
  try {
    await drive.files.delete({
      fileId: fileId,
    });
    return true;
  } catch (error) {
    console.error("Error deleting file from Google Drive:", error);
    throw error;
  }
}

export { uploadFile, deleteFile };
