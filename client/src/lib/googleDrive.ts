import api from "@/services/api";

interface DriveUploadResponse {
  fileId: string;
  webContentLink: string;
  webViewLink: string;
  mimeType: string;
  size: number;
  name: string;
}

/**
 * Uploads a file to Google Drive through our backend service
 */
export async function uploadToDrive(file: File): Promise<DriveUploadResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const { data } = await api.post<DriveUploadResponse>(
    "/upload/drive",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return data;
}

/**
 * Gets the view URL for a Google Drive file
 * If it's a viewable type (PDF, DOCX, images), returns Google Docs Viewer URL
 * Otherwise returns direct download link
 */
export function getFileViewUrl(fileId: string, mimeType: string): string {
  // List of mimeTypes that can be previewed
  const previewableMimeTypes = [
    // PDF
    "application/pdf",
    // Microsoft Office
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    // Images
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    // Text
    "text/plain",
    // Google Docs
    "application/vnd.google-apps.document",
    "application/vnd.google-apps.spreadsheet",
    "application/vnd.google-apps.presentation",
  ];

  if (previewableMimeTypes.includes(mimeType)) {
    return `https://docs.google.com/gview?url=https://drive.google.com/uc?id=${fileId}&embedded=true`;
  }

  // For non-previewable files, return the direct download link
  return `https://drive.google.com/uc?id=${fileId}&export=download`;
}

/**
 * Checks if a file can be previewed
 */
export function isFilePreviewable(mimeType: string): boolean {
  return getFileViewUrl("", mimeType).includes("gview");
}

/**
 * Gets a human-readable file size
 */
export function getHumanFileSize(bytes: number): string {
  const units = ["B", "KB", "MB", "GB"];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(1)} ${units[unitIndex]}`;
}
