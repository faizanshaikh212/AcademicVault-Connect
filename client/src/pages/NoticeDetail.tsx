import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import noticeService from "@/services/notice.service";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { format } from "date-fns";
// import { getHumanFileSize } from "@/lib/files";
import { FileText, Download, ExternalLink } from "lucide-react";
import ReactMarkdown from "react-markdown";

const NoticeDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [notice, setNotice] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [showFileViewer, setShowFileViewer] = useState(false);

  useEffect(() => {
    const fetchNotice = async () => {
      try {
        const { data } = await noticeService.getNoticeById(id!);
        setNotice(data);
      } catch (error) {
        console.error("Error fetching notice:", error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchNotice();
    }
  }, [id]);

  const openFileViewer = (file: any) => {
    setSelectedFile(file);
    setShowFileViewer(true);
  };

  const getViewerUrl = (file: any) => {
    if (file.webViewLink) return file.webViewLink;
    const fileId = file.fileId;
    return `https://docs.google.com/gview?url=https://drive.google.com/uc?id=${fileId}&embedded=true`;
  };

  const isViewableFile = (mimeType: string) => {
    const viewableTypes = [
      "application/pdf",
      "text/plain",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.google-apps.document",
      "image/",
    ];
    return viewableTypes.some((type) => mimeType.startsWith(type));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-900 dark:border-white border-t-transparent" />
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!notice) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Notice not found</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Cover Image */}
      <div className="mb-8">
        <img
          src={notice.coverImage?.url || "placeholderimage1234567890.png"}
          alt={notice.title}
          className="w-full h-64 object-cover rounded-lg"
        />
      </div>

      {/* Title and Metadata */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">{notice.title}</h1>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {format(new Date(notice.createdAt), "MMMM d, yyyy 'at' h:mm a")}
        </div>
      </div>

      {/* Description */}
      <div className="prose dark:prose-invert max-w-none mb-8">
        <ReactMarkdown>{notice.description}</ReactMarkdown>
      </div>

      {/* Attachments */}
      {notice.attachments && notice.attachments.length > 0 && (
        <div className="border rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-4">Attachments</h2>
          <div className="space-y-2">
            {notice.attachments.map((file: any, index: number) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5" />
                  <span>{file.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  {isViewableFile(file.mimeType) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openFileViewer(file)}
                    >
                      View
                    </Button>
                  )}
                  <a
                    href={file.webContentLink}
                    download
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4" />
                    </Button>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* File Viewer Dialog */}
      <Dialog open={showFileViewer} onOpenChange={setShowFileViewer}>
        <div className="h-[80vh] flex flex-col">
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="text-lg font-semibold">{selectedFile?.name}</h3>
            <div className="flex items-center gap-2">
              <a
                href={selectedFile?.webContentLink}
                download
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </a>
              <a
                href={selectedFile?.webViewLink}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="outline" size="sm">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open in New Tab
                </Button>
              </a>
            </div>
          </div>
          <div className="flex-1 bg-gray-100 dark:bg-gray-900">
            {isViewableFile(selectedFile?.mimeType) ? (
              selectedFile?.mimeType.startsWith("image/") ? (
                <img
                  src={selectedFile.webContentLink}
                  alt={selectedFile.name}
                  className="w-full h-full object-contain"
                />
              ) : (
                <iframe
                  src={getViewerUrl(selectedFile)}
                  className="w-full h-full"
                />
              )
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <FileText className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                  <p>No preview available for this file type</p>
                  <a
                    href={selectedFile?.webContentLink}
                    download
                    className="mt-4 inline-block"
                  >
                    <Button>
                      <Download className="h-4 w-4 mr-2" />
                      Download File
                    </Button>
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </Dialog>
    </div>
  );
};

export default NoticeDetail;
