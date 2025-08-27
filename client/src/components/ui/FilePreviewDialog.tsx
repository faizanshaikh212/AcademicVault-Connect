import React from "react";
import { Dialog } from "./Dialog";
import { Button } from "./Button";
import { Download, ExternalLink, X } from "lucide-react";

interface FilePreviewDialogProps {
  file: {
    url: string;
    mimeType: string;
    name: string;
    downloadUrl?: string;
  };
  onClose: () => void;
}

export function FilePreviewDialog({ file, onClose }: FilePreviewDialogProps) {
  const isImage = file.mimeType.startsWith("image/");
  const isViewableDocument = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "text/plain",
  ].includes(file.mimeType);

  const getGoogleViewerUrl = () => {
    if (isImage) return file.url;
    return `https://docs.google.com/gview?url=${encodeURIComponent(
      file.url
    )}&embedded=true`;
  };

  const handleDownload = () => {
    window.open(file.downloadUrl || file.url, "_blank");
  };

  const handleOpenInNewTab = () => {
    window.open(getGoogleViewerUrl(), "_blank");
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg w-full max-w-4xl mx-4">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b dark:border-gray-800">
            <h2 className="text-lg font-semibold truncate">{file.name}</h2>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleDownload}
                title="Download"
              >
                <Download className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleOpenInNewTab}
                title="Open in new tab"
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                title="Close"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="p-4">
            {isImage ? (
              <img
                src={file.url}
                alt={file.name}
                className="max-w-full mx-auto"
                style={{ maxHeight: "calc(100vh - 200px)" }}
              />
            ) : isViewableDocument ? (
              <iframe
                src={getGoogleViewerUrl()}
                title={file.name}
                className="w-full bg-white"
                style={{ height: "calc(100vh - 200px)" }}
                frameBorder="0"
              />
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  No preview available for this file type
                </p>
                <Button onClick={handleDownload}>Download File</Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </Dialog>
  );
}
