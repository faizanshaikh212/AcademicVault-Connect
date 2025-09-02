/**
 * Academic Resource Card Component
 * Reusable card component for displaying academic resources
 */

import React from "react";
import { useAuth } from "../../hooks/useAuth";
import {
  Eye,
  Edit,
  Trash2,
  Calendar,
  User,
  FileText,
  CheckCircle,
  AlertCircle,
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
  isAdmin = false,
  isTeacher = false,
}) => {
  const { user } = useAuth();
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
            <p className="text-sm text-gray-600 dark:text-gray-400">
              <span className="font-medium">Version:</span> {syllabus.version}
            </p>
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
                className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                  timetable.isActive
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

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">
                {academicUtils.getFileTypeIcon(resource.fileType)}
              </span>
              <span className="text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded-full">
                {getResourceTypeLabel()}
              </span>
              {resource.isAdminUploaded && (
                <span className="text-xs font-medium text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900 px-2 py-1 rounded-full">
                  Official
                </span>
              )}
              {!resource.isApproved && (
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
      <div className="p-4">
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
            {resource.uploader &&
            ((resource.uploader as any).avatar ||
              (resource.uploader as any).profile?.avatar ||
              (resource.uploader as any).profile?.avatarUrl) ? (
              <img
                src={
                  (resource.uploader as any).avatar ||
                  (resource.uploader as any).profile?.avatar ||
                  (resource.uploader as any).profile?.avatarUrl
                }
                alt={`${resource.uploader.firstName || ""} ${
                  resource.uploader.lastName || ""
                }`}
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <User className="w-4 h-4" />
            )}
            <Link
              to={`/profile/${resource.uploader.username}`}
              className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              {resource.uploader.firstName} {resource.uploader.lastName}
            </Link>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            <span>{formatDate(resource.createdAt)}</span>
          </div>
        </div>

        {/* Actions */}
        {showActions && (
          <div className="flex items-center gap-2">
            <button
              onClick={async () => {
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
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200"
            >
              <Eye className="w-4 h-4" />
              View
            </button>
            {/* Show Edit button for admin, teacher, or resource owner */}
            {(isAdmin ||
              isTeacher ||
              (user && resource.uploader._id === user._id)) &&
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
            {(isAdmin || (user && resource.uploader._id === user._id)) &&
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
