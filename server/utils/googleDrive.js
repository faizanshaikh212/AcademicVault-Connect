const { google } = require("googleapis");

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

// Upload a file to Google Drive
const uploadFile = async (fileObject) => {
  const drive = createDriveClient();

  try {
    const response = await drive.files.create({
      requestBody: {
        name: fileObject.originalname,
        mimeType: fileObject.mimetype,
      },
      media: {
        mimeType: fileObject.mimetype,
        body: fileObject.buffer,
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

    // Get the file's web view link
    const result = await drive.files.get({
      fileId: response.data.id,
      fields: "id, name, mimeType, webViewLink, webContentLink",
    });

    return result.data;
  } catch (error) {
    console.error("Error uploading file to Google Drive:", error);
    throw error;
  }
};

// Delete a file from Google Drive
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

module.exports = {
  uploadFile,
  deleteFile,
};
