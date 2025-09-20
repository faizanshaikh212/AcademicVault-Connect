import React, { useEffect, useState } from "react";
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
import AcademicResourceForm from "../../components/shared/AcademicResourceForm";
import ResourceEditModal from "../../components/shared/ResourceEditModal";
import { academicUtils } from "../../services/academicService";
import coursesService from "../../services/courses.service";
import { questionPapersService } from "../../services/academicService";

interface AcademicResource {
  _id: string;
  title: string;
  description?: string;
  course?: string;
  subject?: string;
  semester?: string;
  academicYear?: string;
  examYear?: string;
  year?: string;
  month?: string;
  type?: string; // timetable type
  timetableType?: string; // specific timetable type field
  fileUrl?: string;
  isApproved?: boolean;
  viewCount?: number;
  downloadCount?: number;
  publicUrl?: string;
}

interface ServiceShape {
  getAll: (
    params?: any
  ) => Promise<{ data: AcademicResource[]; pagination?: any }>;
  upload: (formData: FormData) => Promise<any>;
  update: (id: string, data: any) => Promise<any>;
  delete: (id: string) => Promise<any>;
  trackDownload?: (id: string) => Promise<{ downloadUrl: string }>;
}

interface AcademicManagementProps {
  resourceType: "notes" | "questionPapers" | "syllabus" | "timetables";
  title: string;
  service: ServiceShape;
}

// Using shared ResourceEditModal (see components/shared/ResourceEditModal.tsx)

const AcademicManagementNew: React.FC<AcademicManagementProps> = ({
  resourceType,
  title,
  service,
}) => {
  const [resources, setResources] = useState<AcademicResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedResource, setSelectedResource] =
    useState<AcademicResource | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedSemester, setSelectedSemester] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [approvalFilter, setApprovalFilter] = useState<
    "all" | "approved" | "pending"
  >("all");
  const [filterOptions, setFilterOptions] = useState({
    courses: [] as string[],
    semesters: [] as string[],
    academicYears: [] as string[],
  });
  const [courses, setCourses] = useState<any[]>([]);
  const [semestersByCourse, setSemestersByCourse] = useState<
    Record<string, any[]>
  >({});
  const [subjectsBySemester, setSubjectsBySemester] = useState<
    Record<string, any[]>
  >({});
  const [sortValue, setSortValue] = useState<string>("newest");

  useEffect(() => {
    const id = setTimeout(() => fetchResources(), 200);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    searchQuery,
    selectedCourse,
    selectedSemester,
    selectedYear,
    approvalFilter,
    sortValue,
  ]);

  // Listen for external updates to question papers so this management view
  // refreshes when a paper is edited elsewhere in the app (e.g. from
  // SubjectTableView or public QuestionPapers page).
  useEffect(() => {
    const onExternalUpdate = async (evt: any) => {
      try {
        const id = evt?.detail?.id;
        if (evt?.detail?.resource) {
          // Normalize the incoming resource so the management table fields
          // (which expect academicYear/year as strings) render correctly.
          const raw = evt.detail.resource;
          const updated: any = {
            ...raw,
            academicYear:
              raw.academicYear ||
              (raw.examYear !== undefined && raw.examYear !== null
                ? String(raw.examYear)
                : undefined) ||
              raw.academicYear,
            year:
              raw.year ||
              (raw.examYear !== undefined && raw.examYear !== null
                ? String(raw.examYear)
                : raw.year),
          };

          setResources((prev) => {
            const found = prev.find((p) => p._id === updated._id);
            if (found)
              return prev.map((p) => (p._id === updated._id ? updated : p));
            return [updated, ...prev];
          });
          // Also refetch authoritative list to avoid any shape/mapping mismatch
          // (ensure teacher management shows the latest server-side fields)
          try {
            await fetchResources();
          } catch (e) {
            /* ignore */
          }
          return;
        }
        if (id) {
          // Try to fetch the single updated resource using the canonical service
          try {
            const r = await questionPapersService.getQuestionPaperById(id);
            let updated: any = r?.data || null;
            if (updated) {
              // normalize numeric fields into the site's AcademicResource shape
              updated = {
                ...updated,
                academicYear:
                  updated.academicYear ||
                  (updated.examYear ? String(updated.examYear) : undefined) ||
                  updated.academicYear,
                year:
                  updated.year ||
                  (updated.examYear ? String(updated.examYear) : undefined),
              };
            }
            if (updated) {
              setResources((prev) => {
                const found = prev.find((p) => p._id === updated._id);
                if (found) {
                  return prev.map((p) => (p._id === updated._id ? updated : p));
                }
                // If not present (e.g. newly approved), add at top
                return [updated, ...prev];
              });
              return;
            }
          } catch (e) {
            // if single fetch fails, fall through to full refetch
          }
        }
        // fallback: full refresh
        fetchResources();
      } catch (e) {
        // ignore
        fetchResources();
      }
    };
    window.addEventListener("questionPaper:updated", onExternalUpdate as any);
    return () =>
      window.removeEventListener(
        "questionPaper:updated",
        onExternalUpdate as any
      );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchResources = async () => {
    try {
      setLoading(true);
      const params: any = {
        search: searchQuery || undefined,
        course: selectedCourse || undefined,
        semester: selectedSemester || undefined,
        academicYear: selectedYear || undefined,
        isApproved:
          approvalFilter === "all" ? undefined : approvalFilter === "approved",
      };

      switch (sortValue) {
        case "newest":
          params.sortBy = "createdAt";
          params.sortOrder = "desc";
          break;
        case "oldest":
          params.sortBy = "createdAt";
          params.sortOrder = "asc";
          break;
        case "mostViewed":
          params.sortBy = "viewCount";
          params.sortOrder = "desc";
          break;
        case "mostDownloaded":
          params.sortBy = "downloadCount";
          params.sortOrder = "desc";
          break;
        default:
          break;
      }

      const res = await service.getAll(params);
      setResources(res.data || []);

      // build filter options
      const courses = [
        ...new Set((res.data || []).map((r: any) => r.course).filter(Boolean)),
      ];
      const semesters = [
        ...new Set(
          (res.data || []).map((r: any) => r.semester).filter(Boolean)
        ),
      ];
      const years = [
        ...new Set(
          (res.data || [])
            .map((r: any) => r.year || r.examYear || r.academicYear)
            .filter(
              (y: any) =>
                y !== undefined && y !== null && y !== "" && y !== "N/A"
            )
        ),
      ];
      setFilterOptions({ courses, semesters, academicYears: years });
    } catch (err) {
      console.error(err);
      toast.error(`Failed to fetch ${resourceType}`);
    } finally {
      setLoading(false);
      setInitialLoad(false);
    }
  };

  // Load master course list (used to resolve ids -> labels in tables)
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await coursesService.listCourses();
        if (!mounted) return;
        setCourses((res as any).data || []);
      } catch (err) {
        console.error("Failed to load courses", err);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // When resources change, prefetch semesters and subjects for any ids present
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const courseIds = [
          ...new Set(
            resources
              .map((r: any) => r.courseId)
              .filter((x: any) => x !== undefined && x !== null && x !== "")
          ),
        ];

        for (const cid of courseIds) {
          if (!mounted) return;
          if (!semestersByCourse[cid]) {
            try {
              const s = await coursesService.listSemestersForCourse(cid);
              if (!mounted) return;
              setSemestersByCourse((prev) => ({
                ...prev,
                [cid]: (s as any).data || [],
              }));
            } catch (err) {
              // ignore individual failures
            }
          }
        }

        const semesterIds = [
          ...new Set(
            resources
              .map((r: any) => r.semesterId)
              .filter((x: any) => x !== undefined && x !== null && x !== "")
          ),
        ];

        for (const sid of semesterIds) {
          if (!mounted) return;
          if (!subjectsBySemester[sid]) {
            try {
              const sub = await coursesService.listSubjectsForSemester(sid);
              if (!mounted) return;
              setSubjectsBySemester((prev) => ({
                ...prev,
                [sid]: (sub as any).data || [],
              }));
            } catch (err) {
              // ignore
            }
          }
        }
      } catch (err) {
        // ignore
      }
    })();

    return () => {
      mounted = false;
    };
  }, [resources]);

  // Helpers to resolve labels for display (accepts multiple data shapes)
  const getCourseLabel = (r: any) => {
    if (!r) return "-";
    if (r.course) {
      if (typeof r.course === "string") {
        // try to find in loaded courses
        const f = courses.find((c) => c._id === r.course);
        if (f) return f.title || f.name || r.course;
        return r.course;
      }
      if (typeof r.course === "object") {
        return r.course.title || r.course.name || "-";
      }
    }
    if (r.courseId) {
      const f = courses.find((c) => c._id === r.courseId);
      if (f) return f.title || f.name || r.courseId;
      return r.courseId;
    }
    return "-";
  };

  const resolveSemester = (sem: any) => {
    if (!sem) return "-";
    if (typeof sem === "string") {
      // look up in semestersByCourse
      for (const arr of Object.values(semestersByCourse)) {
        const f = arr.find((s: any) => s._id === sem);
        if (f) return f.title || f.name || f.number || sem;
      }
      return sem;
    }
    if (typeof sem === "object")
      return sem.title || sem.name || sem.number || "-";
    return String(sem);
  };

  const getSemesterLabel = (r: any) => {
    if (!r) return "-";
    if (Array.isArray(r.semester)) {
      return r.semester.map((s: any) => resolveSemester(s)).join(", ");
    }
    if (r.semester) return resolveSemester(r.semester);
    if (r.semesterId) return resolveSemester(r.semesterId);
    return "All Semesters";
  };

  const resolveSubject = (sub: any) => {
    if (!sub) return "-";
    if (typeof sub === "string") {
      for (const arr of Object.values(subjectsBySemester)) {
        const f = arr.find((s: any) => s._id === sub);
        if (f) return f.title || f.name || sub;
      }
      return sub;
    }
    if (typeof sub === "object") return sub.title || sub.name || "-";
    return String(sub);
  };

  const getSubjectLabel = (r: any) => {
    if (!r) return "-";
    if (r.subject) return resolveSubject(r.subject);
    if (r.subjectId) return resolveSubject(r.subjectId);
    return "-";
  };

  const handleUpload = async (formData: FormData) => {
    try {
      await service.upload(formData);
      await fetchResources();
      toast.success(`${title} uploaded successfully`);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Upload failed");
      throw err;
    }
  };

  const handleDelete = async (resource: AcademicResource) => {
    const safeTitle =
      resource?.title ||
      resource?.fileUrl ||
      resource?.publicUrl ||
      "this item";
    if (!confirm(`Delete "${safeTitle}"?`)) return;
    try {
      await service.delete(resource._id);
      setResources((p) => p.filter((r) => r._id !== resource._id));
      // dispatch a global update so other views can refresh
      try {
        if (typeof window !== "undefined" && window.dispatchEvent) {
          window.dispatchEvent(
            new CustomEvent("questionPaper:updated", {
              detail: { id: resource._id },
            })
          );
        }
      } catch (e) {
        /* ignore */
      }
      toast.success("Deleted successfully");
    } catch (err) {
      console.error(err);
      toast.error("Delete failed");
    }
  };

  // FIXED: Use proper view endpoint for files
  const handleView = async (resource: AcademicResource) => {
    try {
      await academicUtils.trackResourceView(resource._id, resourceType as any);
    } catch (e) {
      /* ignore */
    }

    let url = resource.publicUrl || resource.fileUrl;
    if (!url) {
      toast.error("No file available to view");
      return;
    }

    // Check if it's a local file path and convert to view endpoint
    if (
      url.includes("LocalStorage") ||
      url.startsWith("/uploads") ||
      (!url.startsWith("http") && !url.startsWith("https"))
    ) {
      const relativePath = url
        .replace(/.*LocalStorage[\/\\]/, "")
        .replace(/\\/g, "/");
      url = `${window.location.origin}/api/files/view/${encodeURIComponent(
        relativePath
      )}`;
    }

    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleEditSubmit = async (values: any) => {
    if (!selectedResource) return;
    await service.update(selectedResource._id, values);
    setShowEditModal(false);
    setSelectedResource(null);
    await fetchResources();
    toast.success("Updated successfully");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Manage {title}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Upload, edit and manage {resourceType}
          </p>
        </div>
        <button
          onClick={() => setShowUploadModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
        >
          <Plus className="w-5 h-5" /> Upload {title}
        </button>
      </div>

      {/* Search & controls (kept compact and similar to previous) */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex gap-4 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchResources()}
              placeholder={`Search ${resourceType}...`}
              className="w-full pl-10 pr-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 border rounded-lg ${
              showFilters ? "bg-blue-50 text-blue-700" : ""
            }`}
          >
            <Filter className="w-5 h-5" /> Filters
          </button>
          <div className="ml-2">
            <label className="text-sm text-gray-600 dark:text-gray-400 mr-2">
              Sort
            </label>
            <select
              value={sortValue}
              onChange={(e) => setSortValue(e.target.value)}
              className="px-3 py-1 border rounded bg-white dark:bg-gray-700 text-sm"
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="mostViewed">Most Viewed</option>
              <option value="mostDownloaded">Most Downloaded</option>
            </select>
          </div>
          <button
            onClick={fetchResources}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg"
          >
            Search
          </button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div>
              <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">
                Course
              </label>
              <select
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                className="w-full px-3 py-2 border rounded bg-white dark:bg-gray-700"
              >
                <option value="">All Courses</option>
                {filterOptions.courses.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">
                Semester
              </label>
              <select
                value={selectedSemester}
                onChange={(e) => setSelectedSemester(e.target.value)}
                className="w-full px-3 py-2 border rounded bg-white dark:bg-gray-700"
              >
                <option value="">All</option>
                {filterOptions.semesters.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">
                Academic Year
              </label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="w-full px-3 py-2 border rounded bg-white dark:bg-gray-700"
              >
                <option value="">All</option>
                {filterOptions.academicYears.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">
                Status
              </label>
              <select
                value={approvalFilter}
                onChange={(e) => setApprovalFilter(e.target.value as any)}
                className="w-full px-3 py-2 border rounded bg-white dark:bg-gray-700"
              >
                <option value="all">All</option>
                <option value="approved">Approved</option>
                <option value="pending">Pending</option>
              </select>
            </div>
            <div className="lg:col-span-4 flex justify-end">
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCourse("");
                  setSelectedSemester("");
                  setSelectedYear("");
                  setApprovalFilter("all");
                  fetchResources();
                }}
                className="px-4 py-2 text-gray-600"
              >
                Clear Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        {loading && initialLoad ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : resources.length === 0 ? (
          <div className="text-center py-12">
            {" "}
            <Plus className="w-16 h-16 mx-auto text-gray-300" />{" "}
            <h3 className="text-lg font-medium">No {resourceType} found</h3>{" "}
            <p className="text-gray-500">Upload your first {resourceType}</p>{" "}
            <button
              onClick={() => setShowUploadModal(true)}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
            >
              Upload {title}
            </button>
          </div>
        ) : (
          <div className="p-4">
            <div className="mb-4 flex justify-end items-center gap-4">
              {loading && !initialLoad && (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600" />
              )}
              <button
                onClick={() => setShowUploadModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg"
              >
                <Plus className="w-5 h-5" /> Upload {title}
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse border border-gray-200 dark:border-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    {/* render dynamic headers based on resourceType */}
                    {resourceType === "questionPapers" && (
                      <>
                        <th className="px-4 py-3 border-l border-r border-gray-200 dark:border-gray-700 text-center">
                          Course
                        </th>
                        <th className="px-4 py-3 border-l border-r border-gray-200 dark:border-gray-700 text-center">
                          Semester
                        </th>
                        <th className="px-4 py-3 border-l border-r border-gray-200 dark:border-gray-700 text-center">
                          Subject
                        </th>
                        <th className="px-4 py-3 border-l border-r border-gray-200 dark:border-gray-700 text-center">
                          Year
                        </th>
                        <th className="px-4 py-3 border-l border-r border-gray-200 dark:border-gray-700 text-center">
                          Month
                        </th>
                        <th className="px-4 py-3 border-l border-r border-gray-200 dark:border-gray-700 text-center">
                          Status
                        </th>
                        <th className="px-4 py-3 border-l border-r border-gray-200 dark:border-gray-700 text-center">
                          Actions
                        </th>
                      </>
                    )}

                    {resourceType === "syllabus" && (
                      <>
                        <th className="px-4 py-3 border-l border-r border-gray-200 dark:border-gray-700 text-center">
                          Title
                        </th>
                        <th className="px-4 py-3 border-l border-r border-gray-200 dark:border-gray-700 text-center">
                          Course
                        </th>
                        <th className="px-4 py-3 border-l border-r border-gray-200 dark:border-gray-700 text-center">
                          Semester(s)
                        </th>
                        <th className="px-4 py-3 border-l border-r border-gray-200 dark:border-gray-700 text-center">
                          Year
                        </th>
                        <th className="px-4 py-3 border-l border-r border-gray-200 dark:border-gray-700 text-center">
                          Status
                        </th>
                        <th className="px-4 py-3 border-l border-r border-gray-200 dark:border-gray-700 text-center">
                          Actions
                        </th>
                      </>
                    )}

                    {resourceType === "timetables" && (
                      <>
                        <th className="px-4 py-3 border-l border-r border-gray-200 dark:border-gray-700 text-center">
                          Title
                        </th>
                        <th className="px-4 py-3 border-l border-r border-gray-200 dark:border-gray-700 text-center">
                          Course
                        </th>
                        <th className="px-4 py-3 border-l border-r border-gray-200 dark:border-gray-700 text-center">
                          Semester
                        </th>
                        <th className="px-4 py-3 border-l border-r border-gray-200 dark:border-gray-700 text-center">
                          Type
                        </th>
                        <th className="px-4 py-3 border-l border-r border-gray-200 dark:border-gray-700 text-center">
                          Year
                        </th>
                        <th className="px-4 py-3 border-l border-r border-gray-200 dark:border-gray-700 text-center">
                          Status
                        </th>
                        <th className="px-4 py-3 border-l border-r border-gray-200 dark:border-gray-700 text-center">
                          Actions
                        </th>
                      </>
                    )}

                    {resourceType === "notes" && (
                      <>
                        <th className="px-4 py-3 border-l border-r border-gray-200 dark:border-gray-700 text-center">
                          Title
                        </th>
                        <th className="px-4 py-3 border-l border-r border-gray-200 dark:border-gray-700 text-center">
                          Course
                        </th>
                        <th className="px-4 py-3 border-l border-r border-gray-200 dark:border-gray-700 text-center">
                          Subject
                        </th>
                        <th className="px-4 py-3 border-l border-r border-gray-200 dark:border-gray-700 text-center">
                          Type
                        </th>
                        <th className="px-4 py-3 border-l border-r border-gray-200 dark:border-gray-700 text-center">
                          Status
                        </th>
                        <th className="px-4 py-3 border-l border-r border-gray-200 dark:border-gray-700 text-center">
                          Actions
                        </th>
                      </>
                    )}
                  </tr>
                </thead>

                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {resources.map((r, idx) => {
                    // Try canonical fields first, then try to infer from title when missing
                    const clean = (v: any) =>
                      v === undefined ||
                      v === null ||
                      v === "" ||
                      v === "N/A" ||
                      v === "-"
                        ? null
                        : v;

                    const inferredYear =
                      (clean(r.examYear) ? String(r.examYear) : null) ||
                      clean(r.year) ||
                      clean(r.academicYear) ||
                      (() => {
                        const m = (r.title || "").match(/(19|20)\d{2}/);
                        return m ? m[0] : null;
                      })() ||
                      "-";

                    const inferredMonth =
                      clean(r.month) ||
                      (() => {
                        const months = [
                          "January",
                          "February",
                          "March",
                          "April",
                          "May",
                          "June",
                          "July",
                          "August",
                          "September",
                          "October",
                          "November",
                          "December",
                        ];
                        const t = (r.title || "").toLowerCase();
                        for (const mon of months) {
                          if (t.includes(mon.toLowerCase())) return mon;
                        }
                        return null;
                      })() ||
                      "-";

                    const rType = r.timetableType || r.type || "-";
                    return (
                      <tr
                        key={
                          r._id ??
                          `resource-${idx}-${String(
                            (r && (r.title || r.academicYear)) || idx
                          ).replace(/\s+/g, "-")}`
                        }
                        className="hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        {resourceType === "questionPapers" && (
                          <>
                            <td className="px-4 py-3 border-l border-r border-gray-200 dark:border-gray-700 text-center align-middle">
                              {getCourseLabel(r)}
                            </td>
                            <td className="px-4 py-3 border-l border-r border-gray-200 dark:border-gray-700 text-center align-middle">
                              {getSemesterLabel(r)}
                            </td>
                            <td className="px-4 py-3 border-l border-r border-gray-200 dark:border-gray-700 text-center align-middle">
                              {getSubjectLabel(r)}
                            </td>
                            <td className="px-4 py-3 border-l border-r border-gray-200 dark:border-gray-700 text-center align-middle">
                              {inferredYear}
                            </td>
                            <td className="px-4 py-3 border-l border-r border-gray-200 dark:border-gray-700 text-center align-middle">
                              {inferredMonth}
                            </td>
                            <td className="px-4 py-3 border-l border-r border-gray-200 dark:border-gray-700 text-center align-middle">
                              <div className="flex items-center justify-center gap-2">
                                {r.isApproved ? (
                                  <CheckCircle className="w-5 h-5 text-green-500" />
                                ) : (
                                  <Clock className="w-5 h-5 text-yellow-500" />
                                )}
                                <span
                                  className={`text-sm ${
                                    r.isApproved
                                      ? "text-green-600"
                                      : "text-yellow-600"
                                  }`}
                                >
                                  {r.isApproved ? "Approved" : "Pending"}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3 border-l border-r border-gray-200 dark:border-gray-700 text-center align-middle">
                              <div className="flex items-center justify-center">
                                <ActionButtons
                                  resource={r}
                                  onView={() => handleView(r)}
                                  onEdit={() => {
                                    setSelectedResource(r);
                                    setShowEditModal(true);
                                  }}
                                  onDelete={() => handleDelete(r)}
                                />
                              </div>
                            </td>
                          </>
                        )}

                        {resourceType === "syllabus" && (
                          <>
                            <td className="px-4 py-3 border-l border-r border-gray-200 dark:border-gray-700 text-center align-middle">
                              {r.title}
                            </td>
                            <td className="px-4 py-3 border-l border-r border-gray-200 dark:border-gray-700 text-center align-middle">
                              {getCourseLabel(r)}
                            </td>
                            <td className="px-4 py-3 border-l border-r border-gray-200 dark:border-gray-700 text-center align-middle">
                              {getSemesterLabel(r)}
                            </td>
                            <td className="px-4 py-3 border-l border-r border-gray-200 dark:border-gray-700 text-center align-middle">
                              {inferredYear}
                            </td>
                            <td className="px-4 py-3 border-l border-r border-gray-200 dark:border-gray-700 text-center align-middle">
                              <div className="flex items-center justify-center gap-2">
                                {r.isApproved ? (
                                  <CheckCircle className="w-5 h-5 text-green-500" />
                                ) : (
                                  <Clock className="w-5 h-5 text-yellow-500" />
                                )}
                                <span
                                  className={`text-sm ${
                                    r.isApproved
                                      ? "text-green-600"
                                      : "text-yellow-600"
                                  }`}
                                >
                                  {r.isApproved ? "Approved" : "Pending"}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3 border-l border-r border-gray-200 dark:border-gray-700 text-center align-middle">
                              <div className="flex items-center justify-center">
                                <ActionButtons
                                  resource={r}
                                  onView={() => handleView(r)}
                                  onEdit={() => {
                                    setSelectedResource(r);
                                    setShowEditModal(true);
                                  }}
                                  onDelete={() => handleDelete(r)}
                                />
                              </div>
                            </td>
                          </>
                        )}

                        {resourceType === "timetables" && (
                          <>
                            <td className="px-4 py-3 border-l border-r border-gray-200 dark:border-gray-700 text-center align-middle">
                              {r.title}
                            </td>
                            <td className="px-4 py-3 border-l border-r border-gray-200 dark:border-gray-700 text-center align-middle">
                              {getCourseLabel(r)}
                            </td>
                            <td className="px-4 py-3 border-l border-r border-gray-200 dark:border-gray-700 text-center align-middle">
                              {getSemesterLabel(r)}
                            </td>
                            <td className="px-4 py-3 border-l border-r border-gray-200 dark:border-gray-700 text-center align-middle">
                              {rType}
                            </td>
                            <td className="px-4 py-3 border-l border-r border-gray-200 dark:border-gray-700 text-center align-middle">
                              {inferredYear}
                            </td>
                            <td className="px-4 py-3 border-l border-r border-gray-200 dark:border-gray-700 text-center align-middle">
                              <div className="flex items-center justify-center gap-2">
                                {r.isApproved ? (
                                  <CheckCircle className="w-5 h-5 text-green-500" />
                                ) : (
                                  <Clock className="w-5 h-5 text-yellow-500" />
                                )}
                                <span
                                  className={`text-sm ${
                                    r.isApproved
                                      ? "text-green-600"
                                      : "text-yellow-600"
                                  }`}
                                >
                                  {r.isApproved ? "Approved" : "Pending"}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3 border-l border-r border-gray-200 dark:border-gray-700 text-center align-middle">
                              <div className="flex items-center justify-center">
                                <ActionButtons
                                  resource={r}
                                  onView={() => handleView(r)}
                                  onEdit={() => {
                                    setSelectedResource(r);
                                    setShowEditModal(true);
                                  }}
                                  onDelete={() => handleDelete(r)}
                                />
                              </div>
                            </td>
                          </>
                        )}

                        {resourceType === "notes" && (
                          <>
                            <td className="px-4 py-3 border-l border-r border-gray-200 dark:border-gray-700 text-center align-middle">
                              <div>
                                <div className="font-medium text-gray-900 dark:text-white">
                                  {r.title}
                                </div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                  {r.description
                                    ? r.description.length > 60
                                      ? `${r.description.substring(0, 60)}...`
                                      : r.description
                                    : ""}
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 border-l border-r border-gray-200 dark:border-gray-700 text-center align-middle">
                              {getCourseLabel(r)}
                            </td>
                            <td className="px-4 py-3 border-l border-r border-gray-200 dark:border-gray-700 text-center align-middle">
                              {getSubjectLabel(r)}
                            </td>
                            <td className="px-4 py-3 border-l border-r border-gray-200 dark:border-gray-700 text-center align-middle">
                              {r.type || "Unofficial"}
                            </td>
                            <td className="px-4 py-3 border-l border-r border-gray-200 dark:border-gray-700 text-center align-middle">
                              <div className="flex items-center justify-center gap-2">
                                {r.isApproved ? (
                                  <CheckCircle className="w-5 h-5 text-green-500" />
                                ) : (
                                  <Clock className="w-5 h-5 text-yellow-500" />
                                )}
                                <span
                                  className={`text-sm ${
                                    r.isApproved
                                      ? "text-green-600"
                                      : "text-yellow-600"
                                  }`}
                                >
                                  {r.isApproved ? "Approved" : "Pending"}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3 border-l border-r border-gray-200 dark:border-gray-700 text-center align-middle">
                              <div className="flex items-center justify-center">
                                <ActionButtons
                                  resource={r}
                                  onView={() => handleView(r)}
                                  onEdit={() => {
                                    setSelectedResource(r);
                                    setShowEditModal(true);
                                  }}
                                  onDelete={() => handleDelete(r)}
                                />
                              </div>
                            </td>
                          </>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Upload modal */}
      {showUploadModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={(e) =>
            e.target === e.currentTarget && setShowUploadModal(false)
          }
        >
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold">Upload {title}</h2>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-gray-400"
              >
                ✕
              </button>
            </div>
            <div className="p-6">
              <AcademicResourceForm
                resourceType={resourceType as any}
                createMode={true}
                onCancel={() => setShowUploadModal(false)}
                onSubmit={async (formData) => {
                  await handleUpload(formData as FormData);
                  setShowUploadModal(false);
                }}
                submitLabel={`Upload ${title}`}
              />
            </div>
          </div>
        </div>
      )}

      {/* Generic Edit Modal */}
      <ResourceEditModal
        isOpen={showEditModal}
        resourceType={resourceType}
        resource={selectedResource}
        onClose={() => {
          setShowEditModal(false);
          setSelectedResource(null);
        }}
        onSubmit={handleEditSubmit}
      />
    </div>
  );
};

const ActionButtons: React.FC<{
  resource?: AcademicResource;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}> = (props) => {
  const { onView, onEdit, onDelete } = props;
  return (
    <div className="flex items-center gap-2">
      <button onClick={onView} className="text-blue-600" title="View">
        <ExternalLink className="w-4 h-4" />
      </button>
      <button onClick={onEdit} className="text-yellow-600" title="Edit">
        <Edit className="w-4 h-4" />
      </button>
      <button onClick={onDelete} className="text-red-600" title="Delete">
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
};

export default AcademicManagementNew;
