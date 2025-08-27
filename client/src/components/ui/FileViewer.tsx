import React from "react";
import { Button } from "./Button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./Dialog";
import { Download, ExternalLink } from "lucide-react";

interface FileViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  file: {
    name: string;
    mimeType: string;
    url: string;
  };
}

const FileViewer: React.FC<FileViewerProps> = ({
  open,
  onOpenChange,
  file,
}) => {
  const isViewable = (mimeType: string) => {
    const viewableTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "text/plain",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // DOCX
      "application/vnd.openxmlformats-officedocument.presentationml.presentation", // PPTX
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // XLSX
      "application/vnd.google-apps.document", // Google Docs
      "application/vnd.google-apps.presentation", // Google Slides
      "application/vnd.google-apps.spreadsheet", // Google Sheets
    ];
    return viewableTypes.includes(mimeType);
  };

  const isImage = (mimeType: string) => {
    return mimeType.startsWith("image/");
  };

  const getGoogleViewerUrl = (fileUrl: string) => {
    return `https://docs.google.com/gview?url=${encodeURIComponent(
      fileUrl
    )}&embedded=true`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {file.name}
          </DialogTitle>
        </DialogHeader>

        {isViewable(file.mimeType) ? (
          <div className="flex-1 h-full min-h-0 overflow-hidden">
            {isImage(file.mimeType) ? (
              <img
                src={file.url}
                alt={file.name}
                className="w-full h-full object-contain"
              />
            ) : (
              <iframe
                src={getGoogleViewerUrl(file.url)}
                title={file.name}
                className="w-full h-full border-0"
              />
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-4 py-12">
            <p className="text-lg text-gray-600 dark:text-gray-400">
              No preview available for this file type
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              Please download the file to view it
            </p>
          </div>
        )}

        <DialogFooter>
          <div className="flex justify-end gap-2 w-full">
            <Button
              variant="outline"
              onClick={() => window.open(file.url, "_blank")}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Open in New Tab
            </Button>
            <Button asChild>
              <a
                href={file.url}
                download={file.name}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </a>
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FileViewer;
