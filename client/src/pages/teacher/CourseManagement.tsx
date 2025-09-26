import React, { useEffect, useState } from "react";
import coursesService from "../../services/courses.service";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import CourseSemesters from "../../components/teacher/CourseSemesters";
import { BookOpen, Plus, Search, Filter } from "lucide-react";
import { toast } from "react-hot-toast";

const CourseManagement: React.FC = () => {
  const [courses, setCourses] = useState<any[]>([]);
  const [title, setTitle] = useState("");
  const [semesterCount, setSemesterCount] = useState<number | "">("");
  const [loading, setLoading] = useState(false);
  const [category, setCategory] = useState<string>("");
  const [expandedCourse, setExpandedCourse] = useState<string | null>(null);
  const [editingCourse, setEditingCourse] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [editingCategory, setEditingCategory] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [sortValue, setSortValue] = useState("createdAt-desc");
  const [showCreateForm, setShowCreateForm] = useState(true);

  // Access management modal state
  const [showAccessModal, setShowAccessModal] = useState(false);
  const [accessModalCourse, setAccessModalCourse] = useState<any>(null);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [teacherSearchQuery, setTeacherSearchQuery] = useState("");
  const [loadingTeachers, setLoadingTeachers] = useState(false);

  const startEditCourse = (c: any) => {
    setEditingCourse(c._id);
    setEditingTitle(c.title);
    setEditingCategory(c.type || c.degreeType || "");
  };

  const saveCourseEdit = async (id: string) => {
    try {
      if (!editingTitle.trim()) {
        toast.error("Course title is required");
        return;
      }

      await coursesService.updateCourse(id, {
        title: editingTitle,
        type: editingCategory || undefined,
      });
      setCourses((prev) =>
        prev.map((c) =>
          c._id === id
            ? { ...c, title: editingTitle, type: editingCategory || c.type }
            : c
        )
      );
      setEditingCourse(null);
      setEditingCategory("");
      fetchCourses();
      toast.success("Course updated successfully!");
    } catch (err: any) {
      console.error(err);
      if (err?.response?.status === 403) {
        toast.error("Access denied: You don't have permission to edit this course");
      } else if (err?.response?.status === 404) {
        toast.error("Course not found");
      } else if (err?.response?.status === 400) {
        const message = err?.response?.data?.message || "Invalid course data";
        toast.error(message);
      } else {
        toast.error("Failed to update course. Please try again.");
      }
    }
  };

  const cancelCourseEdit = () => {
    setEditingCourse(null);
    setEditingTitle("");
    setEditingCategory("");
  };

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const response = await coursesService.listMyCourses();
      const coursesData = response.data || response || [];
      setCourses(Array.isArray(coursesData) ? coursesData : []);
    } catch (err: any) {
      console.error(err);
      setCourses([]);
      if (err?.response?.status === 403) {
        toast.error("Access denied: You don't have permission to view courses");
      } else if (err?.response?.status !== 401) { // Don't show error for auth issues
        toast.error("Failed to load courses. Please refresh the page.");
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedCourse((s) => (s === id ? null : id));
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleDelete = async (id: string) => {
    if (
      !confirm(
        "Delete this course? This will remove its semesters and subjects."
      )
    )
      return;
    try {
      await coursesService.deleteCourse(id);
      setCourses((s) => s.filter((c) => c._id !== id));
      toast.success("Course deleted successfully!");
    } catch (err: any) {
      console.error(err);
      if (err?.response?.status === 403) {
        toast.error("Access denied: You don't have permission to delete this course");
      } else if (err?.response?.status === 404) {
        toast.error("Course not found");
      } else {
        toast.error("Failed to delete course. Please try again.");
      }
    }
  };

  // Access management functions
  const openAccessModal = async (course: any) => {
    setAccessModalCourse(course);
    setShowAccessModal(true);
    await fetchTeachers();
  };

  const closeAccessModal = () => {
    setShowAccessModal(false);
    setAccessModalCourse(null);
    setTeachers([]);
    setTeacherSearchQuery("");
  };

  const fetchTeachers = async () => {
    try {
      setLoadingTeachers(true);
      const response = await coursesService.getTeachersForAccess();
      const teachersData = response.data || response || [];
      setTeachers(Array.isArray(teachersData) ? teachersData : []);
    } catch (err: any) {
      console.error("Error fetching teachers:", err);
      setTeachers([]);
      if (err?.response?.status === 403) {
        toast.error("Access denied: You don't have permission to view teachers list");
      } else {
        toast.error("Failed to load teachers list");
      }
    } finally {
      setLoadingTeachers(false);
    }
  };

  const handleGrantAccess = async (userId: string) => {
    if (!accessModalCourse) return;

    try {
      await coursesService.grantCourseAccess(accessModalCourse._id, { userId });
      toast.success("Access granted successfully!");
      fetchCourses();
      const updatedCourse = courses.find(c => c._id === accessModalCourse._id);
      if (updatedCourse) {
        setAccessModalCourse(updatedCourse);
      }
    } catch (err: any) {
      console.error("Error granting access:", err);

      // Handle different error types with user-friendly messages
      if (err?.response?.status === 403) {
        toast.error("Access denied: You don't have permission to grant access to this course");
      } else if (err?.response?.status === 404) {
        toast.error("Course or user not found");
      } else if (err?.response?.status === 400) {
        const message = err?.response?.data?.message || "Invalid request";
        toast.error(message);
      } else {
        toast.error("Failed to grant access. Please try again.");
      }
    }
  };

  const handleRevokeAccess = async (userId: string) => {
    if (!accessModalCourse) return;

    try {
      await coursesService.revokeCourseAccess(accessModalCourse._id, { userId });
      toast.success("Access revoked successfully!");
      fetchCourses();
      const updatedCourse = courses.find(c => c._id === accessModalCourse._id);
      if (updatedCourse) {
        setAccessModalCourse(updatedCourse);
      }
    } catch (err: any) {
      console.error("Error revoking access:", err);

      // Handle different error types with user-friendly messages
      if (err?.response?.status === 403) {
        toast.error("Access denied: You don't have permission to revoke access from this course");
      } else if (err?.response?.status === 404) {
        toast.error("Course or user not found");
      } else if (err?.response?.status === 400) {
        const message = err?.response?.data?.message || "Invalid request";
        toast.error(message);
      } else {
        toast.error("Failed to revoke access. Please try again.");
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 relative pt-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg">
          <div className="p-6 border-b dark:border-gray-700">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Course Management
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Create and manage courses, semesters and subjects
            </p>
          </div>

          <div className="p-6">
            {loading && (
              <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                Loading courses...
              </div>
            )}

            {!showCreateForm && (
              <div className="mb-6">
                <Button
                  onClick={() => setShowCreateForm(true)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Course
                </Button>
              </div>
            )}

            {showCreateForm && (
              <div className="mt-6 bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-semibold">Create Course</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowCreateForm(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </Button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Course Title *
                    </label>
                    <Input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Enter course title"
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Category
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select Category</option>
                      <option value="BE">BE</option>
                      <option value="BSC">BSC</option>
                      <option value="Commerce">Commerce</option>
                      <option value="PG">PG</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Semesters
                    </label>
                    <Input
                      type="number"
                      min={0}
                      max={12}
                      value={semesterCount as any}
                      onChange={(e) =>
                        setSemesterCount(
                          e.target.value === "" ? "" : Number(e.target.value)
                        )
                      }
                      placeholder="e.g. 6"
                      className="w-full"
                    />
                  </div>
                  <div className="sm:col-span-2 lg:col-span-4 flex flex-col sm:flex-row gap-3 pt-4">
                    <Button
                      onClick={async () => {
                        try {
                          if (!title.trim()) {
                            toast.error("Course title is required");
                            return;
                          }
                          const payload: any = { title: title.trim() };
                          if (category) payload.type = category;
                          if (semesterCount !== "" && semesterCount !== null)
                            payload.semesterCount = Number(semesterCount);
                          const { data } = await coursesService.createCourse(
                            payload
                          );
                          const created =
                            data && data.course ? data.course : data;
                          if (category && !created.type) created.type = category;
                          setCourses((s) => [created, ...s]);
                          setTitle("");
                          setSemesterCount("");
                          setCategory("");
                          setShowCreateForm(false);
                          toast.success("Course created successfully!");
                        } catch (err: any) {
                          console.error(err);
                          if (err?.response?.status === 403) {
                            toast.error("Access denied: You don't have permission to create courses");
                          } else if (err?.response?.status === 400) {
                            const message = err?.response?.data?.message || "Invalid course data";
                            toast.error(message);
                          } else {
                            toast.error("Failed to create course. Please try again.");
                          }
                        }
                      }}
                      disabled={!title.trim()}
                      className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex-1 sm:flex-none sm:w-auto"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create Course
                    </Button>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div className="flex-1 w-full sm:max-w-md">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search courses..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 w-full"
                    />
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowFilters(!showFilters)}
                    className="flex items-center gap-2 w-full sm:w-auto"
                  >
                    <Filter className="h-4 w-4" />
                    Filters
                  </Button>
                  <div className="w-full sm:w-48">
                    <select
                      value={sortValue}
                      onChange={(e) => setSortValue(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="createdAt-desc">Newest First</option>
                      <option value="createdAt-asc">Oldest First</option>
                      <option value="title-asc">Title A-Z</option>
                      <option value="title-desc">Title Z-A</option>
                    </select>
                  </div>
                </div>
              </div>

              {showFilters && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Semester Count
                      </label>
                      <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                        <option value="">All</option>
                        <option value="1">1</option>
                        <option value="2">2</option>
                        <option value="3">3</option>
                        <option value="4">4</option>
                        <option value="5">5</option>
                        <option value="6">6</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6">
              <div className="mb-4">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Course List</h2>
                <p className="text-gray-600 dark:text-gray-400 mt-1">Manage your courses and their content</p>
              </div>

              {/* Courses Grid */}
              <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
                {courses
                  .filter(
                    (c) =>
                      !searchQuery ||
                      c.title
                        .toLowerCase()
                        .includes(searchQuery.toLowerCase())
                  )
                  .sort((a, b) => {
                    const [k, order] = sortValue.split("-");
                    if (k === "title")
                      return order === "asc"
                        ? a.title.localeCompare(b.title)
                        : b.title.localeCompare(a.title);
                    const da = new Date(a.createdAt).getTime();
                    const db = new Date(b.createdAt).getTime();
                    return order === "asc" ? da - db : db - da;
                  })
                  .map((c) => (
                    <div key={c._id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200">
                      <div className="p-6">
                        {/* Course Header */}
                        <div className="mb-4">
                          {editingCourse === c._id && c.userAccess?.canEdit ? (
                            <div className="space-y-3">
                              <Input
                                value={editingTitle}
                                onChange={(e) => setEditingTitle(e.target.value)}
                                className="text-lg font-semibold"
                                placeholder="Course title"
                              />
                              <select
                                value={editingCategory}
                                onChange={(e) => setEditingCategory(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                              >
                                <option value="">Select Category</option>
                                <option value="BE">BE</option>
                                <option value="BSC">BSC</option>
                                <option value="Commerce">Commerce</option>
                                <option value="PG">PG</option>
                              </select>
                            </div>
                          ) : (
                            <div>
                              <div className="flex items-center gap-2 mb-3 flex-wrap">
                                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                                  {c.title}
                                </h3>
                                {/* Access Level Badges */}
                                {c.userAccess?.isOwner && (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                    Owner
                                  </span>
                                )}
                                {c.userAccess?.isAdmin && !c.userAccess?.isOwner && (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                    Admin
                                  </span>
                                )}
                                {c.userAccess?.hasSharedAccess && !c.userAccess?.isOwner && !c.userAccess?.isAdmin && (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                                    Shared
                                  </span>
                                )}
                                {!c.userAccess?.canEdit && (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400">
                                    Read-only
                                  </span>
                                )}
                              </div>

                              {/* Course Metadata */}
                              <div className="grid grid-cols-2 gap-3 text-sm text-gray-600 dark:text-gray-400">
                                <div>
                                  <span className="font-medium">Category:</span>
                                  <div className="mt-1">{c.type || c.degreeType || "Not set"}</div>
                                </div>
                                <div>
                                  <span className="font-medium">Semesters:</span>
                                  <div className="mt-1">{c.semesterCount ?? "Not set"}</div>
                                </div>
                                <div className="col-span-2">
                                  <span className="font-medium">Creator:</span>
                                  <div className="mt-1">
                                    {c.creator ? `${c.creator.firstName} ${c.creator.lastName}` : "Unknown"}
                                  </div>
                                </div>
                                <div className="col-span-2">
                                  <span className="font-medium">Created:</span>
                                  <div className="mt-1">{new Date(c.createdAt).toLocaleDateString()}</div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                          {editingCourse === c._id ? (
                            <>
                              <Button
                                size="sm"
                                onClick={() => saveCourseEdit(c._id)}
                                className="bg-green-600 hover:bg-green-700 w-full sm:w-auto"
                              >
                                Save
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={cancelCourseEdit}
                                className="w-full sm:w-auto"
                              >
                                Cancel
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => toggleExpand(c._id)}
                                className="flex items-center gap-1 w-full sm:w-auto"
                              >
                                {expandedCourse === c._id ? "Hide Semesters" : "Manage Semesters"}
                              </Button>

                              {c.userAccess?.canEdit ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => startEditCourse(c)}
                                  className="w-full sm:w-auto"
                                >
                                  Edit
                                </Button>
                              ) : (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  disabled
                                  className="opacity-50 cursor-not-allowed w-full sm:w-auto"
                                  title="You don't have permission to edit this course"
                                >
                                  Edit
                                </Button>
                              )}

                              {c.userAccess?.canGrantAccess ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openAccessModal(c)}
                                  className="bg-green-50 hover:bg-green-100 text-green-700 border-green-300 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800 w-full sm:w-auto"
                                >
                                  Access
                                </Button>
                              ) : (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  disabled
                                  className="opacity-50 cursor-not-allowed w-full sm:w-auto"
                                  title="You don't have permission to manage access to this course"
                                >
                                  Access
                                </Button>
                              )}

                              {c.userAccess?.canDelete ? (
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handleDelete(c._id)}
                                  className="ml-auto w-full sm:w-auto"
                                >
                                  Delete
                                </Button>
                              ) : (
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  disabled
                                  className="opacity-50 cursor-not-allowed ml-auto w-full sm:w-auto"
                                  title="You don't have permission to delete this course"
                                >
                                  Delete
                                </Button>
                              )}
                            </>
                          )}
                        </div>
                      </div>

                      {/* Expanded Semesters Section */}
                      {expandedCourse === c._id && (
                        <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 p-6">
                          <CourseSemesters course={c} onUpdate={fetchCourses} />
                        </div>
                      )}
                    </div>
                  ))}
              </div>

              {/* Empty State */}
              {courses.length === 0 && (
                <div className="text-center py-12">
                  <div className="mx-auto h-24 w-24 text-gray-400 mb-4">
                    <BookOpen className="h-full w-full" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    No courses found
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    {searchQuery ? "No courses match your search criteria." : "Get started by creating your first course."}
                  </p>
                  {!searchQuery && (
                    <Button
                      onClick={() => setShowCreateForm(true)}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create Course
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Access Management Modal */}
      {showAccessModal && accessModalCourse && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden mx-4">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Manage Access - {accessModalCourse.title}
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={closeAccessModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </Button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {/* Search Bar */}
              <div className="mb-4">
                <div className="relative">
                  <Input
                    placeholder="Search teachers..."
                    value={teacherSearchQuery}
                    onChange={(e) => setTeacherSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                </div>
              </div>

              {/* Currently Shared With */}
              {accessModalCourse.sharedWith && accessModalCourse.sharedWith.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                    Currently Shared With
                  </h3>
                  <div className="space-y-2">
                    {accessModalCourse.sharedWith.map((share: any, index: number) => (
                      <div
                        key={share.user?._id || `share-${index}`}
                        className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800"
                      >
                        <div>
                          <div className="font-medium text-blue-900 dark:text-blue-100">
                            {share.user?.firstName || 'Unknown'} {share.user?.lastName || 'User'}
                          </div>
                          <div className="text-sm text-blue-700 dark:text-blue-300">
                            @{share.user?.username || 'unknown'}
                          </div>
                          <div className="text-xs text-blue-600 dark:text-blue-400">
                            Granted on {share.grantedAt ? new Date(share.grantedAt).toLocaleDateString() : 'Unknown date'}
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRevokeAccess(share.user?._id || share.user)}
                          className="text-red-600 hover:text-red-700 border-red-300 hover:border-red-400"
                          disabled={!share.user}
                        >
                          Revoke
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Available Teachers */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                  Grant Access to Teachers
                </h3>

                {loadingTeachers ? (
                  <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                    Loading teachers...
                  </div>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {teachers
                      .filter(teacher => {
                        // Filter out current user and already shared users
                        if (teacher._id === accessModalCourse.creator._id) return false;
                        if (accessModalCourse.sharedWith?.some((share: any) => share.user?._id === teacher._id || share.user === teacher._id)) return false;

                        // Apply search filter
                        if (teacherSearchQuery) {
                          const searchLower = teacherSearchQuery.toLowerCase();
                          return (
                            teacher.firstName.toLowerCase().includes(searchLower) ||
                            teacher.lastName.toLowerCase().includes(searchLower) ||
                            teacher.username.toLowerCase().includes(searchLower)
                          );
                        }
                        return true;
                      })
                      .map((teacher) => (
                        <div
                          key={teacher._id}
                          className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                        >
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">
                              {teacher.firstName} {teacher.lastName}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              @{teacher.username}
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleGrantAccess(teacher._id)}
                            className="bg-green-50 hover:bg-green-100 text-green-700 border-green-300 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800"
                          >
                            Grant Access
                          </Button>
                        </div>
                      ))}

                    {teachers.filter(teacher => {
                      if (teacher._id === accessModalCourse.creator._id) return false;
                      if (accessModalCourse.sharedWith?.some((share: any) => share.user?._id === teacher._id || share.user === teacher._id)) return false;
                      if (teacherSearchQuery) {
                        const searchLower = teacherSearchQuery.toLowerCase();
                        return (
                          teacher.firstName.toLowerCase().includes(searchLower) ||
                          teacher.lastName.toLowerCase().includes(searchLower) ||
                          teacher.username.toLowerCase().includes(searchLower)
                        );
                      }
                      return true;
                    }).length === 0 && (
                        <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                          {teacherSearchQuery ? "No teachers found matching your search." : "No teachers available to grant access."}
                        </div>
                      )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseManagement;