/**
 * Academic Management Component for Teachers
 * Generic component for managing academic resources
 */

import React, { useState, useEffect } from "react";
import {
  Search,
  Filter,
  Plus,
  Trash2,
  CheckCircle,
  Clock,
  ExternalLink,
  Edit,
} from "lucide-react";
import { toast } from "react-hot-toast";
import FileUploadModal from "../../components/shared/FileUploadModal";
import { academicUtils } from "../../services/academicService";
import QuestionPapersEditModal from "../../components/shared/QuestionPapersEditModal";
import NotesEditModal from "../../components/shared/NotesEditModal";
import SyllabusEditModal from "../../components/shared/SyllabusEditModal";
import TimetableEditModal from "../../components/shared/TimetableEditModal";

interface AcademicResource {
  _id: string;
  title: string;
  description?: string;
  course: string;
  subject?: string;
  semester?: string;
  academicYear?: string;
  tags?: string[];
  fileType: string;
  fileSize: number;
  publicUrl: string;
  embedUrl?: string;
  downloadUrl: string;
  uploader: {
    _id: string;
    firstName: string;
    lastName: string;
    username: string;
  };
  isApproved: boolean;
  viewCount: number;
  downloadCount: number;
  createdAt: string;
  updatedAt: string;
}

interface AcademicManagementProps {
  resourceType: "notes" | "questionPapers" | "syllabus" | "timetables";
  title: string;
  service: {
    getAll: (
      params?: any
    ) => Promise<{ data: AcademicResource[]; pagination: any }>;
    upload: (formData: FormData) => Promise<any>;
    update: (id: string, data: any) => Promise<any>;
    delete: (id: string) => Promise<any>;
    trackDownload: (id: string) => Promise<{ downloadUrl: string }>;
  };
}

const AcademicManagement: React.FC<AcademicManagementProps> = ({
  resourceType,
  title,
  service,
}) => {
  const [resources, setResources] = useState<AcademicResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedResource, setSelectedResource] =
    useState<AcademicResource | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Filter states
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedSemester, setSelectedSemester] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [approvalFilter, setApprovalFilter] = useState<
    "all" | "approved" | "pending"
  >("all");

  // Filter options
  const [filterOptions, setFilterOptions] = useState({
    courses: [] as string[],
    semesters: [] as string[],
    academicYears: [] as string[],
  });

  useEffect(() => {
    fetchResources();
  }, []);

  const fetchResources = async () => {
    try {
      setLoading(true);
      const params = {
        search: searchQuery || undefined,
        course: selectedCourse || undefined,
        semester: selectedSemester || undefined,
        academicYear: selectedYear || undefined,
        isApproved:
          approvalFilter === "all" ? undefined : approvalFilter === "approved",
      };

      const response = await service.getAll(params);
      setResources(response.data);

      // Extract filter options
      const courses = [...new Set(response.data.map((r) => r.course))];
      const semesters = [
        ...new Set(
          response.data.map((r) => r.semester).filter(Boolean) as string[]
        ),
      ];
      const years = [
        ...new Set(
          response.data.map((r) => r.academicYear).filter(Boolean) as string[]
        ),
      ];

      setFilterOptions({ courses, semesters, academicYears: years });
    } catch (error) {
      console.error("Error fetching resources:", error);
      toast.error(`Failed to fetch ${resourceType}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchResources();
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setSelectedCourse("");
    setSelectedSemester("");
    setSelectedYear("");
    setApprovalFilter("all");
    fetchResources();
  };

  const handleUpload = async (formData: FormData) => {
    try {
      await service.upload(formData);
      fetchResources();
      toast.success(`${title} uploaded successfully!`);
    } catch (error) {
      console.error("Upload error:", error);
      throw error;
    }
  };

  const handleDelete = async (resource: AcademicResource) => {
    if (!confirm(`Are you sure you want to delete "${resource.title}"?`)) {
      return;
    }

    try {
      await service.delete(resource._id);
      setResources((prev) => prev.filter((r) => r._id !== resource._id));
      toast.success(`${title} deleted successfully!`);
    } catch (error) {
      console.error("Delete error:", error);
      toast.error(`Failed to delete ${resourceType}`);
    }
  };

  const handleView = async (resource: AcademicResource) => {
    try {
      // Call GET endpoint to increment view count on the server
      await academicUtils.trackResourceView(resource._id, resourceType as any);
    } catch (err) {
      // ignore tracking errors
    }
    window.open(resource.publicUrl, "_blank", "noopener,noreferrer");
  };

  // Note: direct download button replaced by Edit action for teacher management.

  const getStatusIcon = (resource: AcademicResource) => {
    if (resource.isApproved) {
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    } else {
      return <Clock className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getStatusText = (resource: AcademicResource) => {
    return resource.isApproved ? "Approved" : "Pending Approval";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Manage {title}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Upload, edit, and manage {resourceType} for students
          </p>
        </div>
        <button
          onClick={() => setShowUploadModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          <Plus className="w-5 h-5" />
          Upload {title}
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex gap-4 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder={`Search ${resourceType}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors ${
              showFilters
                ? "bg-blue-50 border-blue-300 text-blue-700 dark:bg-blue-900 dark:border-blue-600 dark:text-blue-300"
                : "border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            }`}
          >
            <Filter className="w-5 h-5" />
            Filters
          </button>
          <button
            onClick={handleSearch}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Search
          </button>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Course
              </label>
              <select
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">All Courses</option>
                {filterOptions.courses.map((course) => (
                  <option key={course} value={course}>
                    {course}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Semester
              </label>
              <select
                value={selectedSemester}
                onChange={(e) => setSelectedSemester(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">All Semesters</option>
                {filterOptions.semesters.map((semester) => (
                  <option key={semester} value={semester}>
                    Semester {semester}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Academic Year
              </label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">All Years</option>
                {filterOptions.academicYears.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Status
              </label>
              <select
                value={approvalFilter}
                onChange={(e) =>
                  setApprovalFilter(
                    e.target.value as "all" | "approved" | "pending"
                  )
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="all">All Status</option>
                <option value="approved">Approved</option>
                <option value="pending">Pending</option>
              </select>
            </div>

            <div className="lg:col-span-4 flex justify-end">
              <button
                onClick={handleClearFilters}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Resources Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : resources.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Plus className="w-16 h-16 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No {resourceType} found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Upload your first {resourceType} to get started.
            </p>
            <button
              onClick={() => setShowUploadModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <Plus className="w-5 h-5" />
              Upload {title}
            </button>
          </div>
        ) : (
          <div className="p-4">
            <div className="mb-4 flex justify-end">
              <button
                onClick={() => setShowUploadModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                <Plus className="w-5 h-5" />
                Upload {title}
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Title
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Course
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Stats
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {resources.map((resource) => (
                    <tr
                      key={resource._id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {resource.title}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {resource.description?.substring(0, 60)}...
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {resource.course}
                        </div>
                        {resource.semester && (
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            Semester {resource.semester}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(resource)}
                          <span
                            className={`text-sm ${
                              resource.isApproved
                                ? "text-green-600 dark:text-green-400"
                                : "text-yellow-600 dark:text-yellow-400"
                            }`}
                          >
                            {getStatusText(resource)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {/* Teachers should see view count */}
                        <div>Views: {resource.viewCount}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleView(resource)}
                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                            title="View"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </button>
                          {/* Replace direct download button with Edit for teacher management so teachers edit resources instead of triggering downloads here */}
                          <button
                            onClick={() => {
                              setSelectedResource(resource);
                              setShowEditModal(true);
                            }}
                            className="text-yellow-600 hover:text-yellow-900 dark:text-yellow-400 dark:hover:text-yellow-300"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(resource)}
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <FileUploadModal
          isOpen={showUploadModal}
          onClose={() => setShowUploadModal(false)}
          onUpload={handleUpload}
          resourceType={resourceType}
          title={`Upload ${title}`}
        />
      )}

      {/* Edit modals for different resource types */}
      {selectedResource && resourceType === "questionPapers" && (
        <QuestionPapersEditModal
          isOpen={!!selectedResource && showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedResource(null);
          }}
          paper={selectedResource as any}
          onSubmit={async (values) => {
            if (!selectedResource) return;
            await service.update(selectedResource._id, values);
            setShowEditModal(false);
            setSelectedResource(null);
            fetchResources();
            toast.success("Updated successfully");
          }}
        />
      )}

      {selectedResource && resourceType === "notes" && (
        <NotesEditModal
          isOpen={!!selectedResource && showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedResource(null);
          }}
          note={selectedResource as any}
          onSubmit={async (values) => {
            if (!selectedResource) return;
            await service.update(selectedResource._id, values);
            setShowEditModal(false);
            setSelectedResource(null);
            fetchResources();
            toast.success("Updated successfully");
          }}
        />
      )}

      {selectedResource && resourceType === "syllabus" && (
        <SyllabusEditModal
          isOpen={!!selectedResource && showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedResource(null);
          }}
          syllabus={selectedResource as any}
          onSubmit={async (values) => {
            if (!selectedResource) return;
            await service.update(selectedResource._id, values);
            setShowEditModal(false);
            setSelectedResource(null);
            fetchResources();
            toast.success("Updated successfully");
          }}
        />
      )}

      {selectedResource && resourceType === "timetables" && (
        <TimetableEditModal
          isOpen={!!selectedResource && showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedResource(null);
          }}
          timetable={selectedResource as any}
          onSubmit={async (values) => {
            if (!selectedResource) return;
            await service.update(selectedResource._id, values);
            setShowEditModal(false);
            setSelectedResource(null);
            fetchResources();
            toast.success("Updated successfully");
          }}
        />
      )}
    </div>
  );
};

export default AcademicManagement;
