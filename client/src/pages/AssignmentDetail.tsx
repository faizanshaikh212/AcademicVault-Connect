import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { assignmentService } from "@/services/assignment.service";
import api from "@/services/api";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { format } from "date-fns";
import { getHumanFileSize } from "@/lib/files";
import { useAuth } from "@/hooks/useAuth";
import {
  FileText,
  Download,
  ExternalLink,
  Mail,
  Upload,
  Clock,
  ChevronLeft,
} from "lucide-react";
import { useToast } from "@/hooks/useToast.tsx";
import ReactMarkdown from "react-markdown";
import { Skeleton } from "@/components/ui/Skeleton";

const AssignmentDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const { user } = useAuth();
  const [assignment, setAssignment] = useState<any>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [showFileViewer, setShowFileViewer] = useState(false);
  const [submissionFile, setSubmissionFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const isTeacher = user?.role?.includes("teacher");

  useEffect(() => {
    const fetchAssignment = async () => {
      try {
        const assignmentData = await assignmentService.getAssignment(id!);
        setAssignment(assignmentData.data);

        // Fetch submissions
        const submissionsResponse = await api.get(
          `/assignments/${id}/submissions${isTeacher ? "/all" : ""}`
        );
        setSubmissions(submissionsResponse.data);
      } catch (error) {
        console.error("Error fetching assignment:", error);
        toast({
          title: "Error",
          description: "Failed to load assignment data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchAssignment();
    }
  }, [id, isTeacher, toast]);

  const openFileViewer = (file: any) => {
    setSelectedFile(file);
    setShowFileViewer(true);
  };

  const getViewerUrl = (file: any) => {
    if (file.webViewLink) return file.webViewLink;
    const fileId = file.fileId || file.driveFileId;
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

  const handleSubmissionFileChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 30 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Maximum file size is 30MB",
          variant: "destructive",
        });
        return;
      }
      setSubmissionFile(file);
    }
  };

  const handleUnsubmit = async (submissionId: string) => {
    if (submitting) return;

    setSubmitting(true);
    try {
      await api.delete(`/assignments/${id}/submissions/${submissionId}`);
      toast({
        title: "Success",
        description: "Assignment unsubmitted successfully",
      });
      await refreshSubmissions();
    } catch (error) {
      console.error("Failed to unsubmit assignment:", error);
      toast({
        title: "Error",
        description: "Failed to unsubmit assignment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const refreshSubmissions = async () => {
    try {
      const response = await api.get(
        `/assignments/${id}/submissions${isTeacher ? "/all" : ""}`
      );
      setSubmissions(response.data);
    } catch (error) {
      console.error("Error fetching submissions:", error);
    }
  };

  const handleSubmit = async () => {
    if (!submissionFile) {
      toast({
        title: "No file selected",
        description: "Please select a file to submit",
        variant: "destructive",
      });
      return;
    }

    if (submissionFile.size > 30 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Maximum file size is 30MB",
        variant: "destructive",
      });
      return;
    }

    const acceptedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
      "image/jpeg",
      "image/png",
    ];

    if (!acceptedTypes.includes(submissionFile.type)) {
      toast({
        title: "Invalid file type",
        description: "Please submit a PDF, DOC, DOCX, TXT, JPG, or PNG file",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("attachments", submissionFile);

      await api.post(`/assignments/${id!}/submit`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast({
        title: "Success",
        description: "Assignment submitted successfully",
      });

      // Reset file selection and refresh submissions
      setSubmissionFile(null);
      await refreshSubmissions();
    } catch (error) {
      console.error("Error submitting assignment:", error);
      toast({
        title: "Error",
        description: "Failed to submit assignment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const copyEmailToClipboard = () => {
    if (assignment?.lateSubmissionAppealEmail) {
      navigator.clipboard.writeText(assignment.lateSubmissionAppealEmail);
      toast({
        title: "Email copied",
        description: "Appeal email address has been copied to clipboard",
      });
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <Skeleton className="h-8 w-3/4 mb-4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
        <Skeleton className="h-40 w-full mb-8" />
        <div className="border rounded-lg p-4 mb-8">
          <Skeleton className="h-6 w-48 mb-4" />
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="flex items-center justify-between p-3">
                <Skeleton className="h-6 w-1/3" />
                <div className="flex items-center gap-2">
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-8 w-8" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Button asChild variant="outline" className="mb-6">
          <Link to="/assignments" className="flex items-center gap-2">
            <ChevronLeft className="h-4 w-4" />
            Back to Assignments
          </Link>
        </Button>
        <div className="flex flex-col items-center justify-center py-12">
          <FileText className="h-12 w-12 text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Assignment Not Found</h2>
          <p className="text-gray-500">
            The assignment you're looking for doesn't exist or has been removed.
          </p>
        </div>
      </div>
    );
  }

  const isLate = new Date() > new Date(assignment.dueDate);

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Navigation */}
      <Button asChild variant="outline" className="mb-6">
        <Link to="/assignments" className="flex items-center gap-2">
          <ChevronLeft className="h-4 w-4" />
          Back to Assignments
        </Link>
      </Button>

      {/* Title and Metadata */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">{assignment.title}</h1>
        <div className="flex flex-col gap-2 text-sm text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Due:{" "}
            {format(new Date(assignment.dueDate), "MMMM d, yyyy 'at' h:mm a")}
            {isLate && (
              <span className="text-red-500 font-semibold">(Past Due)</span>
            )}
          </div>
          <div>
            <span>Course: {assignment.course?.name}</span>
            {assignment.course?.semester && (
              <>
                <span className="mx-2">•</span>
                <span>Semester {assignment.course.semester}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="prose dark:prose-invert max-w-none mb-8">
        <ReactMarkdown>{assignment.description}</ReactMarkdown>
      </div>

      {/* Assignment Files */}
      {assignment.attachments && assignment.attachments.length > 0 && (
        <div className="border rounded-lg p-4 mb-8">
          <h2 className="text-lg font-semibold mb-4">Assignment Files</h2>
          <div className="space-y-2">
            {assignment.attachments.map((file: any, index: number) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5" />
                  <span>{file.filename}</span>
                  <span className="text-sm text-gray-500">
                    ({getHumanFileSize(file.size)})
                  </span>
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
                    href={file.fileUrl}
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

      {/* Submit Assignment Section */}
      {!isTeacher && (
        <div className="border rounded-lg p-4 mb-8">
          <h2 className="text-lg font-semibold mb-4">Submit Assignment</h2>
          {isLate ? (
            <div className="flex flex-col gap-4">
              <p className="text-red-500">
                This assignment is past due. Please contact the teacher for late
                submission approval.
              </p>
              <Button
                variant="outline"
                onClick={copyEmailToClipboard}
                className="w-fit"
              >
                <Mail className="h-4 w-4 mr-2" />
                Copy Appeal Email Address
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <input
                  type="file"
                  id="submissionFile"
                  className="hidden"
                  accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                  onChange={handleSubmissionFileChange}
                />
                <label
                  htmlFor="submissionFile"
                  className="flex items-center gap-2 px-4 py-2 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <Upload className="h-4 w-4" />
                  {submissionFile ? submissionFile.name : "Choose File"}
                </label>
                <Button
                  onClick={handleSubmit}
                  disabled={!submissionFile || submitting}
                >
                  {submitting ? "Submitting..." : "Submit"}
                </Button>
              </div>
              <p className="text-sm text-gray-500">
                Maximum file size: 30MB. Accepted file types: PDF, DOC, DOCX,
                TXT, JPG, JPEG, PNG
              </p>
            </div>
          )}
        </div>
      )}

      {/* Submissions Section */}
      {submissions.length > 0 && (
        <div className="border rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-4">
            {isTeacher ? "Student Submissions" : "Your Submissions"}
          </h2>
          <div className="space-y-2">
            {submissions.map((submission: any, index: number) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5" />
                  <div>
                    {isTeacher && (
                      <div className="font-medium mb-1">
                        {submission.student?.firstName}{" "}
                        {submission.student?.lastName}
                      </div>
                    )}
                    <span>{submission.attachments[0].filename}</span>
                    <div className="text-sm text-gray-500">
                      Submitted{" "}
                      {format(
                        new Date(submission.submittedAt),
                        "MMM d, yyyy 'at' h:mm a"
                      )}
                      {submission.isLate && (
                        <span className="text-red-500 ml-2">(Late)</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isViewableFile(submission.attachments[0].mimeType) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openFileViewer(submission.attachments[0])}
                    >
                      View
                    </Button>
                  )}
                  <a
                    href={submission.attachments[0].fileUrl}
                    download
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4" />
                    </Button>
                  </a>
                  {!isTeacher && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleUnsubmit(submission._id)}
                      disabled={submitting}
                      className="text-red-500 hover:text-red-600 hover:border-red-500"
                    >
                      Unsubmit
                    </Button>
                  )}
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
            <h3 className="text-lg font-semibold">
              {selectedFile?.filename || selectedFile?.name}
            </h3>
            <div className="flex items-center gap-2">
              <a
                href={selectedFile?.fileUrl || selectedFile?.webContentLink}
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
                  src={selectedFile.fileUrl || selectedFile.webContentLink}
                  alt={selectedFile.filename || selectedFile.name}
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
                    href={selectedFile?.fileUrl || selectedFile?.webContentLink}
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

export default AssignmentDetail;
