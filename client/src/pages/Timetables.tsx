/**
 * Timetables Page Component
 * Page for browsing and managing class timetables
 */

import React, { useState, useEffect } from "react";
import { Clock, Plus, Search, Filter } from "lucide-react";
import Sort from "@/components/shared/Sort";
import { toast } from "react-hot-toast";
import { Timetable, TimetableSearchParams } from "../types/academic";
import AcademicResourceCard from "../components/shared/AcademicResourceCard";
import AcademicResourceForm from "../components/shared/AcademicResourceForm";
import TimetableEditModal from "../components/shared/TimetableEditModal";
import { timetablesService } from "../services/academicService";
import { useAuth } from "../hooks/useAuth";

const TimetablesPage: React.FC = () => {
  const { user } = useAuth();
  // State management
  const [timetables, setTimetables] = useState<Timetable[]>([]);
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);
  const [searchParams, setSearchParams] = useState<TimetableSearchParams>({
    page: 1,
    limit: 12,
    sortBy: "effectiveFrom",
    sortOrder: "desc",
  });
  const [pagination, setPagination] = useState({
    current: 1,
    pages: 1,
    total: 0,
  });
  const [showFilters, setShowFilters] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTimetable, setSelectedTimetable] = useState<Timetable | null>(
    null
  );

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedSemester, setSelectedSemester] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [showActiveOnly, setShowActiveOnly] = useState(false);

  // Filter options
  const [filterOptions, setFilterOptions] = useState({
    courses: [] as string[],
    semesters: [] as string[],
    academicYears: [] as string[],
    types: [] as string[],
  });

  useEffect(() => {
    fetchTimetables();
  }, [searchParams]);

  const fetchTimetables = async () => {
    try {
      setLoading(true);
      const response = await timetablesService.getAllTimetables(searchParams);
      setTimetables(response.data);
      setPagination(response.pagination);

      // Extract filter options from the data
      const courses = [
        ...new Set(response.data.map((timetable) => timetable.course)),
      ];
      const semesters = [
        ...new Set(response.data.map((timetable) => timetable.semester)),
      ];
      const years = [
        ...new Set(response.data.map((timetable) => timetable.academicYear)),
      ];
      const types = [
        ...new Set(response.data.map((timetable) => timetable.timetableType)),
      ];

      setFilterOptions({
        courses,
        semesters,
        academicYears: years,
        types,
      });
    } catch (error) {
      console.error("Error fetching timetables:", error);
      toast.error("Failed to fetch timetables");
    } finally {
      setLoading(false);
      // mark initial load complete so subsequent loads keep existing UI and show subtle indicator
      setInitialLoad(false);
    }
  };

  const handleSearch = () => {
    const newParams: TimetableSearchParams = {
      ...searchParams,
      page: 1,
      // use `keyword` so server can handle partial/short queries
      keyword: searchQuery || undefined,
      course: selectedCourse || undefined,
      semester: selectedSemester || undefined,
      academicYear: selectedYear || undefined,
      timetableType: selectedType || undefined,
      isActive: showActiveOnly || undefined,
    };
    setSearchParams(newParams);
  };

  // Debounced live search to update server-driven results as user types
  useEffect(() => {
    const qRaw = searchQuery || "";
    const id = setTimeout(() => {
      setSearchParams((prev) => ({
        ...prev,
        page: 1,
        keyword: qRaw || undefined,
      }));
    }, 250);

    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  // Apply filters immediately when selects / checkbox change (same behavior as AcademicNotes/Syllabus)
  useEffect(() => {
    setSearchParams((prev) => ({
      ...prev,
      page: 1,
      keyword: searchQuery || undefined,
      course: selectedCourse || undefined,
      semester: selectedSemester || undefined,
      academicYear: selectedYear || undefined,
      timetableType: selectedType || undefined,
      isActive: showActiveOnly || undefined,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    selectedCourse,
    selectedSemester,
    selectedYear,
    selectedType,
    showActiveOnly,
  ]);

  const handleClearFilters = () => {
    setSearchQuery("");
    setSelectedCourse("");
    setSelectedSemester("");
    setSelectedYear("");
    setSelectedType("");
    setShowActiveOnly(false);
    setSearchParams({
      page: 1,
      limit: 12,
      sortBy: "effectiveFrom",
      sortOrder: "desc",
    });
  };

  const handlePageChange = (page: number) => {
    setSearchParams({ ...searchParams, page });
  };

  const handleUpload = async (formData: FormData) => {
    try {
      await timetablesService.uploadTimetable(formData);
      fetchTimetables(); // Refresh the timetables list
      toast.success("Timetable uploaded successfully!");
    } catch (error) {
      console.error("Upload error:", error);
      throw error; // Let the modal handle the error display
    }
  };

  const isTeacher =
    user && Array.isArray(user.role) && (user.role.includes("teacher") || user.role.includes("admin"));

  return (
    <div className="min-h-screen bg-white pt-20 dark:bg-gray-900">

      <div className="relative z-10">
        {/* Header */}
        <div className="border-b border-slate-200 bg-white dark:border-gray-800 dark:bg-gray-900">
          <div className="mx-auto w-full max-w-[120rem] px-5 py-8 md:px-8">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <Clock className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Time Tables
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400">
                    Browse and download class schedules and timetables
                  </p>
                </div>
              </div>

              {isTeacher && (
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  Upload Timetable
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mx-auto w-full max-w-[120rem] px-5 py-8 md:px-8">
          <div className="mb-8 border-b border-gray-200 pb-6 dark:border-gray-700">
            {/* Search Bar */}
            <div className="mb-4 flex flex-col gap-3 sm:flex-row">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search timetables by title, course, or tags..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center justify-center gap-2 rounded-lg border px-4 py-2 transition-colors sm:w-auto ${showFilters
                    ? "bg-blue-50 border-blue-300 text-blue-700 dark:bg-blue-900 dark:border-blue-600 dark:text-blue-300"
                    : "border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  }`}
              >
                <Filter className="w-5 h-5" />
                Filters
              </button>
              <button
                onClick={handleSearch}
                className="rounded-lg bg-blue-600 px-6 py-2 text-white transition-colors hover:bg-blue-700 sm:w-auto"
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
                        {semester}
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
                    Type
                  </label>
                  <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">All Types</option>
                    {filterOptions.types.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="lg:col-span-4 flex justify-end">
                  <label className="flex items-center gap-2 mr-auto">
                    <input
                      type="checkbox"
                      checked={showActiveOnly}
                      onChange={(e) => setShowActiveOnly(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      Show active only
                    </span>
                  </label>
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

          {/* Results */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-gray-600 dark:text-gray-400">
                {initialLoad && loading ? (
                  "Loading..."
                ) : loading ? (
                  <span className="flex items-center gap-2">
                    <span className="inline-block w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    <span>Updating...</span>
                  </span>
                ) : (
                  `${pagination.total} timetables found`
                )}
              </p>

              <div className="flex items-center gap-2">
                <Sort
                  options={[
                    { value: "effectiveFrom-desc", label: "Newest First" },
                    { value: "effectiveFrom-asc", label: "Oldest First" },
                    { value: "title-asc", label: "Title A-Z" },
                    { value: "title-desc", label: "Title Z-A" },
                    { value: "downloadCount-desc", label: "Most Downloaded" },
                    { value: "viewCount-desc", label: "Most Viewed" },
                  ]}
                  value={`${searchParams.sortBy}-${searchParams.sortOrder}`}
                  onChange={(v) => {
                    const [sortBy, sortOrder] = v.split("-");
                    setSearchParams({
                      ...searchParams,
                      sortBy,
                      sortOrder: sortOrder as "asc" | "desc",
                      page: 1,
                    });
                  }}
                />
              </div>
            </div>

            {/* Timetables Grid */}
            {initialLoad && loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, index) => (
                  <div
                    key={index}
                    className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 animate-pulse"
                  >
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
                    <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  </div>
                ))}
              </div>
            ) : timetables.length === 0 ? (
              <div className="text-center py-12">
                <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No timetables found
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Try adjusting your search criteria or upload some timetables
                  to get started.
                </p>
                {loading && !initialLoad && (
                  <div className="mt-2 flex items-center justify-center text-sm text-gray-500">
                    <span className="inline-block w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2" />
                    Searching...
                  </div>
                )}
                {isTeacher && (
                  <button
                    onClick={() => setShowUploadModal(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                    Upload Timetable
                  </button>
                )}
              </div>
            ) : (
              <div className="relative">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {timetables.map((timetable) => (
                    <AcademicResourceCard
                      key={timetable._id}
                      resource={timetable}
                      resourceType="timetables"
                      onEdit={(r) => {
                        setSelectedTimetable(r);
                        setShowEditModal(true);
                      }}
                      onDelete={async (r) => {
                        try {
                          await timetablesService.deleteTimetable(r._id);
                          setTimetables((prev) =>
                            prev.filter((t) => t._id !== r._id)
                          );
                          toast.success("Timetable deleted");
                        } catch (err) {
                          console.error(err);
                          toast.error("Failed to delete timetable");
                        }
                      }}
                    />
                  ))}
                </div>

                {/* subtle overlay while refreshing after initial load */}
                {loading && !initialLoad && (
                  <div className="absolute inset-0 bg-white/60 dark:bg-gray-900/60 flex items-center justify-center rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="inline-block w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                      <span className="text-gray-700 dark:text-gray-200">
                        Updating...
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="flex justify-center mt-8">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePageChange(pagination.current - 1)}
                    disabled={pagination.current === 1}
                    className="px-3 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>

                  {[...Array(pagination.pages)].map((_, index) => {
                    const page = index + 1;
                    return (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`px-3 py-2 rounded ${page === pagination.current
                            ? "bg-blue-600 text-white"
                            : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                          }`}
                      >
                        {page}
                      </button>
                    );
                  })}

                  <button
                    onClick={() => handlePageChange(pagination.current + 1)}
                    disabled={pagination.current === pagination.pages}
                    className="px-3 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Upload Modal (AcademicResourceForm in create mode) */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Upload Class Timetable
              </h2>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="p-6">
              <AcademicResourceForm
                resourceType="timetables"
                createMode={true}
                onCancel={() => setShowUploadModal(false)}
                onSubmit={async (data) => {
                  await handleUpload(data as FormData);
                  setShowUploadModal(false);
                }}
                submitLabel="Upload Timetable"
              />
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedTimetable && (
        <TimetableEditModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedTimetable(null);
          }}
          timetable={selectedTimetable}
          onSubmit={async (values) => {
            if (!selectedTimetable) return;
            await timetablesService.updateTimetable(
              selectedTimetable._id,
              values
            );
            setShowEditModal(false);
            setSelectedTimetable(null);
            fetchTimetables();
            toast.success("Updated successfully");
          }}
        />
      )}
    </div>
  );
};

export default TimetablesPage;
