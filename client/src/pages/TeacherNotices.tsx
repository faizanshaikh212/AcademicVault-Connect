import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import {
  PlusCircle,
  Search,
  Filter,
  Bell,
  Calendar,
  AlertTriangle,
} from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Dialog } from "@/components/ui/Dialog";
import noticeService, { type Notice } from "@/services/notice.service";
import { NoticeForm } from "@/components/forms/NoticeForm";
import { Badge } from "@/components/ui/Badge";
import { format } from "date-fns";

export const TeacherNotices: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [notices, setNotices] = useState<Notice[]>([]);
  // courses list TODO: load from API if needed

  const loadNotices = async () => {
    try {
      const { data } = await noticeService.getTeacherNotices({});
      const payload: any = data;
      if (Array.isArray(payload)) {
        setNotices(payload);
      } else if (payload && Array.isArray(payload.notices)) {
        setNotices(payload.notices);
      } else {
        console.warn("Unexpected notices payload", payload);
        setNotices([]);
      }
    } catch (error) {
      console.error("Failed to load notices:", error);
    }
  };

  useEffect(() => {
    loadNotices();
    // TODO: Load courses from API
  }, []);

  const handleCreateNotice = async (data: any) => {
    try {
      setIsLoading(true);
      await noticeService.createNotice(data);
      await loadNotices();
      setIsFormOpen(false);
    } catch (error) {
      console.error("Failed to create notice:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredNotices = notices.filter((notice) =>
    notice.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getNoticeBadgeVariant = (type?: string) => {
    switch (type) {
      case "urgent":
        return "destructive";
      case "important":
        return "warning";
      default:
        return "default";
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold">Notices</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Manage and create notices for your courses
          </p>
        </div>
        <Button
          className="flex items-center gap-2"
          onClick={() => setIsFormOpen(true)}
        >
          <PlusCircle className="h-5 w-5" />
          Create Notice
        </Button>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md">
        {/* Filters & Search */}
        <div className="p-4 border-b dark:border-gray-800">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search notices..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-full"
              />
            </div>
            <Button variant="outline" className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filters
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {filteredNotices.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
              <div className="bg-blue-100 dark:bg-blue-900/50 p-3 rounded-full mb-4">
                <Bell className="h-6 w-6 text-blue-600 dark:text-blue-300" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No notices yet</h3>
              <p className="text-gray-500 dark:text-gray-400 max-w-sm">
                Create your first notice by clicking the "Create Notice" button
                above.
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredNotices.map((notice) => {
                const type = (notice as any).type || "general";
                const status = (notice as any).status || "published";
                const content =
                  (notice as any).content || notice.description || "";
                const id = (notice as any)._id || (notice as any).id;
                return (
                  <div
                    key={id}
                    className="flex flex-col sm:flex-row justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold">
                          {notice.title}
                        </h3>
                        <Badge variant={getNoticeBadgeVariant(type)}>
                          {type}
                        </Badge>
                        {status === "draft" && (
                          <Badge variant="secondary">Draft</Badge>
                        )}
                      </div>
                      <p className="text-gray-600 dark:text-gray-300 line-clamp-2 mb-2">
                        {content}
                      </p>
                      <div className="flex flex-wrap gap-2 text-sm text-gray-500 dark:text-gray-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          Posted:{" "}
                          {format(new Date(notice.createdAt), "MMM d, yyyy")}
                        </span>
                        {notice.attachments &&
                          notice.attachments.length > 0 && (
                            <span className="flex items-center gap-1">
                              <AlertTriangle className="h-4 w-4" />
                              {notice.attachments.length} attachment(s)
                            </span>
                          )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-4 sm:mt-0">
                      <Button variant="outline" size="sm">
                        Edit
                      </Button>
                      {status === "draft" && (
                        <Button variant="default" size="sm">
                          Publish
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Create Notice Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <div className="mb-4">
          <h2 className="text-xl font-bold">Create Notice</h2>
        </div>
        <NoticeForm onSubmit={handleCreateNotice} isSubmitting={isLoading} />
      </Dialog>
    </div>
  );
};
