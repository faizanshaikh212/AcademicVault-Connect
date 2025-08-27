import React, { useState, useEffect } from "react";
import { Search, Calendar, Paperclip } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { format } from "date-fns";
import noticeService, { type Notice } from "@/services/notice.service";
import { useToast } from "@/hooks/useToast.tsx";
import { FilePreviewDialog } from "@/components/ui/FilePreviewDialog";

interface StudentNoticesProps {}

export const StudentNotices: React.FC<StudentNoticesProps> = () => {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState<{
    url: string;
    mimeType: string;
    name: string;
    downloadUrl?: string;
  } | null>(null);

  const { toast } = useToast();

  useEffect(() => {
    loadNotices();
  }, []);

  const loadNotices = async () => {
    try {
      setIsLoading(true);
      const { data } = await noticeService.getNotices({});
      setNotices(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load notices:", error);
      toast({
        title: "Error",
        description: "Failed to load notices",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredNotices = notices.filter((notice) =>
    notice.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleFileClick = (file: {
    fileUrl: string;
    mimeType: string;
    filename: string;
    driveFileId: string;
  }) => {
    setSelectedFile({
      url: file.fileUrl,
      mimeType: file.mimeType,
      name: file.filename,
      downloadUrl: `https://drive.google.com/uc?export=download&id=${file.driveFileId}`,
    });
  };

  const NoticeSkeleton = () => (
    <div className="flex flex-col gap-4 p-6 bg-white dark:bg-gray-800 rounded-lg shadow animate-pulse">
      <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
      <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
      <div className="flex gap-2">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
      </div>
    </div>
  );

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Notices</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Stay updated with important announcements and information
        </p>
      </div>

      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search notices..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="grid gap-6">
        {isLoading ? (
          Array(3)
            .fill(0)
            .map((_, i) => <NoticeSkeleton key={i} />)
        ) : filteredNotices.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-lg font-semibold mb-2">No notices found</h3>
            <p className="text-gray-500">
              {searchQuery
                ? "Try adjusting your search query"
                : "Check back later for updates"}
            </p>
          </div>
        ) : (
          filteredNotices.map((notice) => (
            <div
              key={notice._id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
            >
              {notice.coverImage &&
                notice.coverImage !== "placeholderimage1234567890.png" && (
                  <img
                    src={notice.coverImage}
                    alt={notice.title}
                    className="w-full h-48 object-cover"
                  />
                )}
              <div className="p-6">
                <div className="flex flex-wrap gap-2 mb-4">
                  {notice.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
                <h2 className="text-xl font-semibold mb-2">{notice.title}</h2>
                <div className="prose dark:prose-invert max-w-none mb-4">
                  {notice.description}
                </div>
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {format(new Date(notice.createdAt), "MMM d, yyyy")}
                  </span>
                  {notice.attachments.length > 0 && (
                    <span className="flex items-center gap-1">
                      <Paperclip className="h-4 w-4" />
                      {notice.attachments.length} attachment(s)
                    </span>
                  )}
                </div>
                {notice.attachments.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <h4 className="font-medium">Attachments:</h4>
                    <div className="grid gap-2">
                      {notice.attachments.map((file, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          className="w-full text-left flex items-center gap-2"
                          onClick={() => handleFileClick(file)}
                        >
                          <Paperclip className="h-4 w-4" />
                          <span className="truncate">{file.filename}</span>
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {selectedFile && (
        <FilePreviewDialog
          file={selectedFile}
          onClose={() => setSelectedFile(null)}
        />
      )}
    </div>
  );
};
