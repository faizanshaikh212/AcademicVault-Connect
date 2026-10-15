/**
 * Academic Resource Card Component
 * Reusable card component for displaying academic resources
 */

import React from "react";
import { useAuth } from "../../hooks/useAuth";
import { useRole } from "../../contexts/RoleContext";
import {
  Eye,
  Edit,
  Trash2,
  Calendar,
  User,
  FileText,
  CheckCircle,
  AlertCircle,
  Lock,
} from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "react-hot-toast";

import {
  AcademicNote,
  QuestionPaper,
  Syllabus,
  Timetable,
} from "../../types/academic";
import {
  academicUtils,
  questionPapersService,
} from "../../services/academicService";

interface AcademicResourceCardProps {
  resource: AcademicNote | QuestionPaper | Syllabus | Timetable;
  resourceType: "notes" | "questionPapers" | "syllabus" | "timetables";
  onEdit?: (resource: any) => void;
  onDelete?: (resource: any) => void;
  showActions?: boolean;
  isAdmin?: boolean;
  isTeacher?: boolean;
}

const AcademicResourceCard: React.FC<AcademicResourceCardProps> = ({
  resource,
  resourceType,
  onEdit,
  onDelete,
  showActions = true,
}) => {
  const { user } = useAuth();
  const { shouldUseTeacherPrivileges, shouldUseAdminPrivileges } = useRole();
  const uploader = resource.uploader;
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getResourceTypeLabel = () => {
    switch (resourceType) {
      case "notes":
        return "Notes";
      case "questionPapers":
        return "Question Paper";
      case "syllabus":
        return "Syllabus";
      case "timetables":
        return "Timetable";
      default:
        return "Resource";
    }
  };

  const getResourceSpecificInfo = () => {
    switch (resourceType) {
      case "notes":
        const note = resource as AcademicNote;
        return (
          <div className="space-y-1">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              <span className="font-medium">Course:</span> {note.course}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              <span className="font-medium">Subject:</span> {note.subject}
            </p>
          </div>
        );

      case "questionPapers":
        const qp = resource as QuestionPaper;
        return (
          <div className="space-y-1">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              <span className="font-medium">Degree:</span> {qp.degreeType}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              <span className="font-medium">Course:</span> {qp.course}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              <span className="font-medium">Subject:</span> {qp.subject}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              <span className="font-medium">Semester:</span> {qp.semester} |{" "}
              <span className="font-medium">Year:</span> {qp.examYear}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              <span className="font-medium">Type:</span> {qp.examType}
            </p>
          </div>
        );

      case "syllabus":
        const syllabus = resource as Syllabus;
        return (
          <div className="space-y-1">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              <span className="font-medium">Course:</span> {syllabus.course}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              <span className="font-medium">Academic Year:</span>{" "}
              {syllabus.academicYear}
            </p>
            {syllabus.semester && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <span className="font-medium">Semester:</span>{" "}
                {syllabus.semester}
              </p>
            )}
            {syllabus.credits && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <span className="font-medium">Credits:</span> {syllabus.credits}
              </p>
            )}
          </div>
        );

      case "timetables":
        const timetable = resource as Timetable;
        return (
          <div className="space-y-1">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              <span className="font-medium">Course:</span> {timetable.course}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              <span className="font-medium">Semester:</span>{" "}
              {timetable.semester}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              <span className="font-medium">Academic Year:</span>{" "}
              {timetable.academicYear}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              <span className="font-medium">Type:</span>{" "}
              {timetable.timetableType}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              <span className="font-medium">Effective From:</span>{" "}
              {formatDate(timetable.effectiveFrom)}
            </p>
            {timetable.effectiveTo && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <span className="font-medium">Effective To:</span>{" "}
                {formatDate(timetable.effectiveTo)}
              </p>
            )}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Status:
              </span>
              <span
                className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${timetable.isActive
                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                  : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
                  }`}
              >
                {timetable.isActive ? (
                  <>
                    <CheckCircle className="w-3 h-3" />
                    Active
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-3 h-3" />
                    Inactive
                  </>
                )}
              </span>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // tags intentionally hidden

  // Get the status for notes
  const noteStatus = resourceType === "notes" ? (resource as any).status : null;

  // Check visibility based on status
  const hasTeacherPrivileges = shouldUseTeacherPrivileges();
  const hasAdminPrivileges = shouldUseAdminPrivileges();

  const isDisapprovedNote =
    resourceType === "notes" &&
    noteStatus === "Disapproved" &&
    !hasTeacherPrivileges &&
    !hasAdminPrivileges;
  const isInReviewNote =
    resourceType === "notes" && noteStatus === "In for Review";

  // Don't render disapproved notes for students
  if (isDisapprovedNote) {
    return null;
  }

  return (
    <div
      className={`h-full overflow-hidden border-b border-gray-200 pb-5 dark:border-gray-700 ${
        // Gray out disapproved notes for teachers/admins
        resourceType === "notes" &&
          noteStatus === "Disapproved" &&
          (hasTeacherPrivileges || hasAdminPrivileges)
          ? "opacity-60 grayscale"
          : ""
        }`}
    >
      {/* Header */}
      <div className="py-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">
                {academicUtils.getFileTypeIcon(resource.fileType)}
              </span>
              <span className="text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded-full">
                {getResourceTypeLabel()}
              </span>
              {/* Show type for notes */}
              {resourceType === "notes" && (resource as any).type && (
                <span
                  className={`text-xs font-medium px-2 py-1 rounded-full ${(resource as any).type === "Official"
                    ? "text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900"
                    : "text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-900"
                    }`}
                >
                  {(resource as any).type}
                </span>
              )}
              {/* Show status for notes */}
              {resourceType === "notes" && noteStatus && (
                <span
                  className={`text-xs font-medium px-2 py-1 rounded-full ${noteStatus === "Approved"
                    ? "text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900"
                    : noteStatus === "In for Review"
                      ? "text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900"
                      : "text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900"
                    }`}
                >
                  {noteStatus}
                </span>
              )}
              {/* Legacy admin uploaded tag for other resources */}
              {resourceType !== "notes" && resource.isAdminUploaded && (
                <span className="text-xs font-medium text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900 px-2 py-1 rounded-full">
                  Official
                </span>
              )}
              {/* Legacy pending tag for other resources */}
              {resourceType !== "notes" && !resource.isApproved && (
                <span className="text-xs font-medium text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900 px-2 py-1 rounded-full">
                  Pending
                </span>
              )}
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
              {resource.title}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">
              {resource.description}
            </p>
          </div>
        </div>

        {/* Resource-specific information */}
        {getResourceSpecificInfo()}

        {/* Tags hidden by request */}
      </div>

      {/* Footer */}
      <div className="py-4">
        {/* File info and stats */}
        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-3">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <FileText className="w-4 h-4" />
              <span>{academicUtils.formatFileSize(resource.fileSize)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Eye className="w-4 h-4" />
              <span>
                {"viewCount" in resource
                  ? `${(resource as any).viewCount} views`
                  : `0 views`}
              </span>
            </div>
          </div>
        </div>

        {/* Uploader and date */}
        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-4">
          <div className="flex items-center gap-2">
            {uploader &&
              ((uploader as any).avatar ||
                (uploader as any).profile?.avatar ||
                (uploader as any).profile?.avatarUrl) ? (
              <img
                src={
                  (uploader as any).avatar ||
                  (uploader as any).profile?.avatar ||
                  (uploader as any).profile?.avatarUrl
                }
                alt={`${uploader.firstName || ""} ${uploader.lastName || ""
                  }`}
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <User className="w-4 h-4" />
            )}
            {uploader ? (
              <Link
                to={`/profile/${uploader.username}`}
                className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                {uploader.firstName} {uploader.lastName}
              </Link>
            ) : (
              <span>Unknown uploader</span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            <span>{formatDate(resource.createdAt)}</span>
          </div>
        </div>

        {/* Actions */}
        {showActions && (
          <div className="flex items-center gap-2 relative">
            <button
              onClick={async () => {
                // Don't allow viewing "In Review" notes
                if (isInReviewNote) {
                  toast.error(
                    "This note is currently under review and cannot be viewed"
                  );
                  return;
                }

                try {
                  const url = resource.fileUrl || resource.publicUrl;
                  if (!url) {
                    toast.error("No file available to view");
                    return;
                  }

                  // For question papers we want to increment download count when the user clicks View,
                  // but still open the publicUrl in a new tab (to avoid forcing a download prompt).
                  if (resourceType === "questionPapers") {
                    try {
                      await questionPapersService.trackDownload(resource._id);
                    } catch (err) {
                      // ignore tracking errors
                    }
                  } else {
                    // For other types, use the GET endpoint that increments view count
                    try {
                      await academicUtils.trackResourceView(
                        resource._id,
                        resourceType
                      );
                    } catch (err) {
                      // ignore tracking errors
                    }
                  }

                  // Open the public URL in a new tab
                  window.open(url, "_blank", "noopener,noreferrer");
                } catch (error) {
                  console.error("Error opening file:", error);
                  toast.error("Error opening file");
                }
              }}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 text-white rounded-lg transition-colors duration-200 relative ${isInReviewNote
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
                }`}
              disabled={isInReviewNote}
            >
              <Eye className="w-4 h-4" />
              View
              {/* Lock overlay for In Review notes */}
              {isInReviewNote && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-400 bg-opacity-75 rounded-lg">
                  <Lock className="w-5 h-5 text-white" />
                </div>
              )}
            </button>
            {/* Show Edit button for admin, teacher, or resource owner */}
            {(hasAdminPrivileges ||
              hasTeacherPrivileges ||
              (user && uploader?._id === user._id)) &&
              onEdit && (
                <button
                  onClick={() => onEdit(resource)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors duration-200"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </button>
              )}
            {/* Show Delete button for admin or resource owner */}
            {(hasAdminPrivileges || (user && uploader?._id === user._id)) &&
              onDelete && (
                <button
                  onClick={() => onDelete(resource)}
                  className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors duration-200"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AcademicResourceCard;
