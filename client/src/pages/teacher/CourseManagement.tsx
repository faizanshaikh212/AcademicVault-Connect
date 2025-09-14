import React, { useEffect, useState } from "react";
import coursesService from "../../services/courses.service";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import AdvancedSearch from "@/components/shared/AdvancedSearch";
import Sort from "@/components/shared/Sort";

const CourseManagement: React.FC = () => {
  const [courses, setCourses] = useState<any[]>([]);
  const [title, setTitle] = useState("");
  const [semesterCount, setSemesterCount] = useState<number | "">("");
  // semester count is managed at course level; we no longer collect it at creation time
  const [loading, setLoading] = useState(false);
  const [category, setCategory] = useState<string>("");
  const [expandedCourse, setExpandedCourse] = useState<string | null>(null);
  const [editingCourse, setEditingCourse] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [editingCategory, setEditingCategory] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [sortValue, setSortValue] = useState("createdAt-desc");

  const startEditCourse = (c: any) => {
    setEditingCourse(c._id);
    setEditingTitle(c.title);
    setEditingCategory(c.type || c.degreeType || "");
  };

  const saveCourseEdit = async (id: string) => {
    try {
      await coursesService.updateCourse(id, {
        title: editingTitle,
        type: editingCategory || undefined,
      });
      // optimistic local update so category shows immediately
      setCourses((prev) =>
        prev.map((c) =>
          c._id === id
            ? { ...c, title: editingTitle, type: editingCategory || c.type }
            : c
        )
      );
      setEditingCourse(null);
      setEditingCategory("");
      // still refresh from server to sync
      fetchCourses();
    } catch (err) {
      console.error(err);
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
      // Handle both formats: direct array or { data: array }
      const coursesData = response.data || response || [];
      setCourses(Array.isArray(coursesData) ? coursesData : []);
    } catch (err) {
      console.error(err);
      setCourses([]);
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
    } catch (err) {
      console.error(err);
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

            <div className="mt-6 bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
              <h2 className="text-2xl font-semibold mb-4">Create Course</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Title
                  </label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="New course title"
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 border rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white mt-1"
                  >
                    <option value="">Select Category</option>
                    <option value="BE">BE</option>
                    <option value="BSC">BSC</option>
                    <option value="Commerce">Commerce</option>
                    <option value="PG">PG</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Semesters
                  </label>
                  <Input
                    type="number"
                    min={0}
                    value={semesterCount as any}
                    onChange={(e) =>
                      setSemesterCount(
                        e.target.value === "" ? "" : Number(e.target.value)
                      )
                    }
                    placeholder="e.g. 6"
                    className="mt-1"
                  />
                </div>
                <div className="col-span-4 flex justify-end">
                  <Button
                    onClick={async () => {
                      try {
                        if (!title) return;
                        const payload: any = { title };
                        if (category) payload.type = category;
                        if (semesterCount !== "" && semesterCount !== null)
                          payload.semesterCount = Number(semesterCount);
                        const { data } = await coursesService.createCourse(
                          payload
                        );
                        const created =
                          data && data.course ? data.course : data;
                        // ensure category is present immediately for UX even if backend omits it
                        if (category && !created.type) created.type = category;
                        setCourses((s) => [created, ...s]);
                        setTitle("");
                        setSemesterCount("");
                        setCategory("");
                      } catch (err) {
                        console.error(err);
                      }
                    }}
                  >
                    Create Course
                  </Button>
                </div>
              </div>
            </div>

            <AdvancedSearch
              title="Courses"
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onSearch={() => {}}
              showFilters={showFilters}
              setShowFilters={setShowFilters}
              filtersNode={
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Semester Count
                    </label>
                    <select className="w-full px-3 py-2 border rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
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
              }
              rightNode={
                <Sort
                  options={[
                    { value: "createdAt-desc", label: "Newest First" },
                    { value: "createdAt-asc", label: "Oldest First" },
                    { value: "title-asc", label: "Title A-Z" },
                    { value: "title-desc", label: "Title Z-A" },
                  ]}
                  value={sortValue}
                  onChange={(v) => setSortValue(v)}
                />
              }
            />

            <div className="mt-6">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
                <h2 className="text-2xl font-semibold mb-4">Course List</h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y table-auto">
                    <thead>
                      <tr>
                        <th className="px-4 py-2 text-left">Course Name</th>
                        <th className="px-4 py-2 text-left">Category</th>
                        <th className="px-4 py-2 text-left">Semesters</th>
                        <th className="px-4 py-2 text-left">Created At</th>
                        <th className="px-4 py-2 text-left">Last Edited</th>
                        <th className="px-4 py-2 text-left">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-700">
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
                          <React.Fragment key={c._id}>
                            <tr className="border-t">
                              <td className="px-4 py-3">
                                {editingCourse === c._id ? (
                                  <Input
                                    value={editingTitle}
                                    onChange={(e) =>
                                      setEditingTitle(e.target.value)
                                    }
                                    className="w-full"
                                  />
                                ) : (
                                  <div className="font-medium text-gray-900 dark:text-gray-100">
                                    {c.title}
                                  </div>
                                )}
                              </td>

                              <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                                {editingCourse === c._id ? (
                                  <select
                                    value={editingCategory}
                                    onChange={(e) =>
                                      setEditingCategory(e.target.value)
                                    }
                                    className="px-2 py-1 border rounded"
                                  >
                                    <option value="">(none)</option>
                                    <option value="BE">BE</option>
                                    <option value="BSC">BSC</option>
                                    <option value="Commerce">Commerce</option>
                                    <option value="PG">PG</option>
                                  </select>
                                ) : (
                                  c.type || c.degreeType || "-"
                                )}
                              </td>

                              <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                                {c.semesterCount ?? "-"}
                              </td>

                              <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                                {new Date(c.createdAt).toLocaleString()}
                              </td>

                              <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                                {c.updatedAt
                                  ? new Date(c.updatedAt).toLocaleString()
                                  : "-"}
                              </td>

                              <td className="px-4 py-3 text-sm">
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => toggleExpand(c._id)}
                                  >
                                    {expandedCourse === c._id
                                      ? "Hide"
                                      : "Semesters"}
                                  </Button>

                                  {editingCourse === c._id ? (
                                    <>
                                      <Button
                                        variant="default"
                                        size="sm"
                                        onClick={() => saveCourseEdit(c._id)}
                                      >
                                        Save
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={cancelCourseEdit}
                                      >
                                        Cancel
                                      </Button>
                                    </>
                                  ) : (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => startEditCourse(c)}
                                    >
                                      Edit
                                    </Button>
                                  )}

                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => handleDelete(c._id)}
                                  >
                                    Delete
                                  </Button>
                                </div>
                              </td>
                            </tr>

                            {expandedCourse === c._id && (
                              <tr className="bg-gray-50 dark:bg-gray-900">
                                <td colSpan={6} className="p-4">
                                  <CourseSemesters
                                    course={c}
                                    onUpdate={fetchCourses}
                                  />
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseManagement;

// Inline component to manage semesters & subjects for a course
const CourseSemesters: React.FC<{ course: any; onUpdate: () => void }> = ({
  course,
  onUpdate,
}) => {
  const [semesters, setSemesters] = useState<any[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [expandedSemester, setExpandedSemester] = useState<string | null>(null);
  const [editingSemester, setEditingSemester] = useState<string | null>(null);
  const [editingSemesterTitle, setEditingSemesterTitle] = useState("");

  const fetchSemesters = async () => {
    try {
      const response = await coursesService.listMySemestersForCourse(
        course._id
      );
      // Handle both formats: direct array or { data: array }
      const semestersData = response.data || response || [];
      setSemesters(Array.isArray(semestersData) ? semestersData : []);
    } catch (err) {
      console.error(err);
      setSemesters([]);
    }
  };

  useEffect(() => {
    fetchSemesters();
  }, []);

  const addSemester = async () => {
    try {
      if (!newTitle) return;
      await coursesService.createSemester({
        title: newTitle,
        course: course._id,
      });
      setNewTitle("");
      fetchSemesters();
      onUpdate();
    } catch (err) {
      console.error(err);
    }
  };

  const startEditSemester = (s: any) => {
    setEditingSemester(s._id);
    setEditingSemesterTitle(s.title);
  };

  const saveSemesterEdit = async (id: string) => {
    try {
      await coursesService.updateSemester(id, { title: editingSemesterTitle });
      setEditingSemester(null);
      fetchSemesters();
      onUpdate();
    } catch (err) {
      console.error(err);
    }
  };

  const cancelSemesterEdit = () => {
    setEditingSemester(null);
    setEditingSemesterTitle("");
  };

  const removeSemester = async (id: string) => {
    if (!confirm("Delete semester and its subjects?")) return;
    try {
      await coursesService.deleteSemester(id);
      fetchSemesters();
      onUpdate();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <h3 className="font-semibold text-lg mb-2">
        Semesters for {course.title}
      </h3>
      <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded mb-4">
        <div className="flex gap-2">
          <Input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Semester title"
            className="flex-1"
          />
          <Button onClick={addSemester} variant="default">
            Add Semester
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        {semesters.map((s) => (
          <div
            key={s._id}
            className="p-4 rounded bg-white dark:bg-gray-800 border"
          >
            <div className="flex justify-between items-start gap-4">
              <div className="flex-1">
                {editingSemester === s._id ? (
                  <Input
                    value={editingSemesterTitle}
                    onChange={(e) => setEditingSemesterTitle(e.target.value)}
                    className="w-full"
                  />
                ) : (
                  <>
                    <div className="font-medium text-gray-900 dark:text-gray-100">
                      {s.title}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {/* semester metadata can be shown here if needed */}
                    </div>
                  </>
                )}
              </div>
              <div className="flex-shrink-0 flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setExpandedSemester(
                      expandedSemester === s._id ? null : s._id
                    )
                  }
                >
                  Subjects
                </Button>
                {editingSemester === s._id ? (
                  <>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => saveSemesterEdit(s._id)}
                    >
                      Save
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={cancelSemesterEdit}
                    >
                      Cancel
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => startEditSemester(s)}
                  >
                    Edit
                  </Button>
                )}
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => removeSemester(s._id)}
                >
                  Delete
                </Button>
              </div>
            </div>

            {expandedSemester === s._id && (
              <div className="mt-3">
                <SemesterSubjects semester={s} onRefresh={fetchSemesters} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const SemesterSubjects: React.FC<{ semester: any; onRefresh: () => void }> = ({
  semester,
  onRefresh,
}) => {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [title, setTitle] = useState("");
  const [editingSubject, setEditingSubject] = useState<string | null>(null);
  const [editingSubjectTitle, setEditingSubjectTitle] = useState("");

  const fetchSubjects = async () => {
    try {
      const response = await coursesService.listMySubjectsForSemester(
        semester._id
      );
      // Handle both formats: direct array or { data: array }
      const subjectsData = response.data || response || [];
      setSubjects(Array.isArray(subjectsData) ? subjectsData : []);
    } catch (err) {
      console.error(err);
      setSubjects([]);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  const addSubject = async () => {
    try {
      if (!title) return;
      await coursesService.createSubject({
        title,
        semester: semester._id,
        course: semester.course,
      });
      setTitle("");
      fetchSubjects();
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  const startEditSubject = (s: any) => {
    setEditingSubject(s._id);
    setEditingSubjectTitle(s.title);
  };

  const saveSubjectEdit = async (id: string) => {
    try {
      await coursesService.updateSubject(id, { title: editingSubjectTitle });
      setEditingSubject(null);
      fetchSubjects();
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  const cancelSubjectEdit = () => {
    setEditingSubject(null);
    setEditingSubjectTitle("");
  };

  const removeSubject = async (id: string) => {
    if (!confirm("Delete subject?")) return;
    try {
      await coursesService.deleteSubject(id);
      fetchSubjects();
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded mb-3 flex gap-2">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Subject title"
          className="flex-1"
        />
        <Button onClick={addSubject} variant="default">
          Add Subject
        </Button>
      </div>

      <div className="space-y-2">
        {subjects.map((sub) => (
          <div
            key={sub._id}
            className="p-3 rounded bg-white dark:bg-gray-800 border flex items-center justify-between"
          >
            <div className="flex-1">
              {editingSubject === sub._id ? (
                <Input
                  value={editingSubjectTitle}
                  onChange={(e) => setEditingSubjectTitle(e.target.value)}
                  className="w-full"
                />
              ) : (
                <div className="text-gray-900 dark:text-gray-100">
                  {sub.title}
                </div>
              )}
            </div>
            <div className="flex-shrink-0 flex items-center gap-2">
              {editingSubject === sub._id ? (
                <>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => saveSubjectEdit(sub._id)}
                  >
                    Save
                  </Button>
                  <Button variant="ghost" size="sm" onClick={cancelSubjectEdit}>
                    Cancel
                  </Button>
                </>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => startEditSubject(sub)}
                >
                  Edit
                </Button>
              )}
              <Button
                variant="destructive"
                size="sm"
                onClick={() => removeSubject(sub._id)}
              >
                Delete
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
