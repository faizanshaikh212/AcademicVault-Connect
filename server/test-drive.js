import * as dotenv from "dotenv";
dotenv.config();

import { google } from "googleapis";

// Log environment variables first
console.log("Environment variables loaded:");
console.log("GOOGLE_PROJECT_ID:", process.env.GOOGLE_PROJECT_ID);
console.log("GOOGLE_CLIENT_EMAIL:", process.env.GOOGLE_CLIENT_EMAIL);

// Create auth client
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
    auth_provider_x509_cert_url: process.env.GOOGLE_AUTH_PROVIDER_X509_CERT_URL,
    client_x509_cert_url: process.env.GOOGLE_CLIENT_X509_CERT_URL,
  },
  scopes: ["https://www.googleapis.com/auth/drive.file"],
});

// Create Drive client
const drive = google.drive({ version: "v3", auth });

// Test folder creation
async function testDrive() {
  try {
    console.log("Creating test folder...");
    const response = await drive.files.create({
      requestBody: {
        name: "test-folder",
        mimeType: "application/vnd.google-apps.folder",
      },
      fields: "id",
    });
    console.log("Created folder with ID:", response.data.id);
    return response.data.id;
  } catch (error) {
    console.error("Error details:", error.response?.data || error.message);
    throw error;
  }
}

testDrive()
  .then((folderId) => console.log("Success! Folder ID:", folderId))
  .catch((error) => console.error("Failed:", error));
