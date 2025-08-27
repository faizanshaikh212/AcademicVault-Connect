import React, { useState, useEffect } from "react";
import { Search, Calendar, Upload, AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Dialog } from "@/components/ui/Dialog";
import { format } from "date-fns";
import {
  assignmentService,
  type Assignment,
} from "@/services/assignment.service";
import { useToast } from "@/hooks/useToast.tsx";

export const StudentAssignments: React.FC = () => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAssignment, setSelectedAssignment] =
    useState<Assignment | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadAssignments();
  }, []);

  const loadAssignments = async () => {
    try {
      setIsLoading(true);
      const { data } = await assignmentService.getAllAssignments();
      setAssignments(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load assignments:", error);
      toast({
        title: "Error",
        description: "Failed to load assignments",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const totalSize = files.reduce((acc, file) => acc + file.size, 0);

    if (files.length > 5) {
      toast({
        title: "Error",
        description: "Maximum 5 files allowed",
        variant: "destructive",
      });
      return;
    }

    if (totalSize > 30 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "Total file size must be less than 30MB",
        variant: "destructive",
      });
      return;
    }

    setSelectedFiles(files);
  };

  const handleSubmitAssignment = async () => {
    if (!selectedAssignment || !selectedFiles.length) return;

    try {
      setIsSubmitting(true);
      const formData = new FormData();
      selectedFiles.forEach((file) => {
        formData.append("files", file);
      });

      await assignmentService.submitAssignment(
        selectedAssignment._id,
        formData
      );

      toast({
        title: "Success",
        description: "Assignment submitted successfully",
      });
      setIsUploadDialogOpen(false);
      setSelectedFiles([]);
      loadAssignments(); // Refresh assignments list
    } catch (error) {
      console.error("Failed to submit assignment:", error);
      toast({
        title: "Error",
        description: "Failed to submit assignment",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyAppealEmail = (email: string) => {
    navigator.clipboard.writeText(email);
    toast({
      title: "Success",
      description: "Email address copied to clipboard",
    });
  };

  const filteredAssignments = assignments.filter((assignment) =>
    assignment.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const AssignmentSkeleton = () => (
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
        <h1 className="text-3xl font-bold mb-2">Assignments</h1>
        <p className="text-gray-600 dark:text-gray-400">
          View and submit your assignments
        </p>
      </div>

      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search assignments..."
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
            .map((_, i) => <AssignmentSkeleton key={i} />)
        ) : filteredAssignments.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-lg font-semibold mb-2">No assignments found</h3>
            <p className="text-gray-500">
              {searchQuery
                ? "Try adjusting your search query"
                : "No assignments have been posted yet"}
            </p>
          </div>
        ) : (
          filteredAssignments.map((assignment) => (
            <div
              key={assignment._id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-2">
                  {assignment.title}
                </h2>
                <div className="prose dark:prose-invert max-w-none mb-4">
                  {assignment.description}
                </div>
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-4">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Due:{" "}
                    {format(new Date(assignment.dueDate), "MMM d, yyyy HH:mm")}
                  </span>
                  <Badge
                    variant={
                      new Date() > new Date(assignment.dueDate)
                        ? "destructive"
                        : "default"
                    }
                  >
                    {new Date() > new Date(assignment.dueDate)
                      ? "Overdue"
                      : "Open"}
                  </Badge>
                  <span>Points: {assignment.points}</span>
                </div>
                <div className="flex flex-wrap gap-4">
                  <Button
                    onClick={() => {
                      setSelectedAssignment(assignment);
                      setIsUploadDialogOpen(true);
                    }}
                    className="flex items-center gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    Submit Assignment
                  </Button>
                  {new Date() > new Date(assignment.dueDate) && (
                    <Button
                      variant="outline"
                      onClick={() =>
                        copyAppealEmail(assignment.lateSubmissionAppealEmail)
                      }
                      className="flex items-center gap-2"
                    >
                      <AlertTriangle className="h-4 w-4" />
                      Appeal for Late Submission
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <div className="p-6">
          <h2 className="text-xl font-bold mb-4">Submit Assignment</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Upload Files (Max 5 files, 30MB total)
              </label>
              <div className="flex flex-col gap-4">
                <Button
                  variant="outline"
                  onClick={() => document.getElementById("files")?.click()}
                  className="w-full"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Choose Files
                </Button>
                <input
                  type="file"
                  id="files"
                  multiple
                  className="hidden"
                  onChange={handleFileSelect}
                />
                {selectedFiles.length > 0 && (
                  <div className="space-y-2">
                    {selectedFiles.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-900 rounded"
                      >
                        <span className="text-sm truncate">{file.name}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setSelectedFiles((files) =>
                              files.filter((_, i) => i !== index)
                            )
                          }
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-4">
              <Button
                variant="outline"
                onClick={() => setIsUploadDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmitAssignment}
                disabled={!selectedFiles.length || isSubmitting}
              >
                {isSubmitting ? "Submitting..." : "Submit"}
              </Button>
            </div>
          </div>
        </div>
      </Dialog>
    </div>
  );
};
