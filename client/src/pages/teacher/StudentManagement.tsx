import React, { useEffect, useState } from "react";
import studentsService from "../../services/students.service";
import coursesService from "../../services/courses.service";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import AdvancedSearch from "@/components/shared/AdvancedSearch";
import Sort from "@/components/shared/Sort";
import { getAvatarUrl } from "@/lib/avatar";

const StudentManagement: React.FC = () => {
  const [students, setStudents] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  const [assignCourseId, setAssignCourseId] = useState<string | null>(null);
  const [yearStart, setYearStart] = useState<number | "">("");
  const [yearEnd, setYearEnd] = useState<number | "">("");
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [sortValue, setSortValue] = useState("name-asc");

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const { data } = await studentsService.listStudents();
      setStudents(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      const { data } = await coursesService.listCourses();
      setCourses(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchStudents();
    fetchCourses();
  }, []);

  const getCourseTitle = (courseRef: any) => {
    if (!courseRef) return "-";
    if (typeof courseRef === "string") {
      const found = courses.find((c) => c._id === courseRef);
      return found ? found.title : courseRef;
    }
    // populated object
    return courseRef.title || courseRef._id || "-";
  };

  const openAssign = (student: any) => {
    setSelectedStudent(student);
    setAssignCourseId(student.studentInfo?.assignedCourse || null);
    setYearStart(student.studentInfo?.academicYearStart || "");
    setYearEnd(student.studentInfo?.academicYearEnd || "");
  };

  const handleAssign = async () => {
    if (!selectedStudent || !assignCourseId || !yearStart || !yearEnd) return;
    try {
      await studentsService.assignStudent(selectedStudent._id, {
        courseId: assignCourseId,
        academicYearStart: Number(yearStart),
        academicYearEnd: Number(yearEnd),
      });
      setSelectedStudent(null);
      fetchStudents();
    } catch (err) {
      console.error(err);
    }
  };

  const handleUnassign = async (student: any) => {
    if (!confirm("Remove student's course assignment?")) return;
    try {
      await studentsService.unassignStudent(student._id);
      fetchStudents();
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
              Student Management
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Assign students to courses and manage academic years
            </p>
          </div>

          <div className="p-6">
            <AdvancedSearch
              title="Students"
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onSearch={() => {
                /* server search if desired */
              }}
              showFilters={showFilters}
              setShowFilters={setShowFilters}
              filtersNode={
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Course
                    </label>
                    <select className="w-full px-3 py-2 border rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                      <option value="">All</option>
                      {courses.map((c) => (
                        <option key={c._id} value={c._id}>
                          {c.title}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              }
            />

            <div className="mt-4 flex items-center justify-end">
              <Sort
                options={[
                  { value: "name-asc", label: "Name A-Z" },
                  { value: "name-desc", label: "Name Z-A" },
                ]}
                value={sortValue}
                onChange={(v) => setSortValue(v)}
              />
            </div>

            <div className="mt-6 bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
              {loading ? (
                <div>Loading...</div>
              ) : (
                <div className="space-y-3">
                  {students
                    .filter(
                      (s) =>
                        !searchQuery ||
                        `${s.firstName} ${s.lastName}`
                          .toLowerCase()
                          .includes(searchQuery.toLowerCase())
                    )
                    .map((s) => (
                      <div
                        key={s._id}
                        className="p-4 rounded bg-white dark:bg-gray-800 border grid grid-cols-1 md:grid-cols-3 gap-4 items-center"
                      >
                        <div className="md:col-span-2">
                          <div className="font-medium text-gray-900 dark:text-gray-100 flex items-center gap-3">
                            {/* Avatar + name (open profile in new tab). Keep container styling unchanged. */}
                            <a
                              href={`/profile/${s.username}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-3"
                            >
                              <img
                                src={getAvatarUrl(
                                  s.profile?.avatar,
                                  s.premium?.isPremium || false,
                                  s.updatedAt
                                )}
                                alt={s.username}
                                className="h-8 w-8 rounded-full object-cover"
                              />
                              <span>
                                {s.firstName} {s.lastName}
                                <span className="ml-2 text-sm text-gray-500">
                                  ({s.username})
                                </span>
                              </span>
                            </a>
                          </div>
                          <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <div>
                              <div className="font-semibold text-gray-700 dark:text-gray-300">
                                Assigned Course
                              </div>
                              <div>
                                {getCourseTitle(s.studentInfo?.assignedCourse)}
                              </div>
                            </div>
                            <div>
                              <div className="font-semibold text-gray-700 dark:text-gray-300">
                                Semester
                              </div>
                              <div>
                                {s.studentInfo?.assignedSemester ?? "-"}
                              </div>
                            </div>
                            <div>
                              <div className="font-semibold text-gray-700 dark:text-gray-300">
                                Academic Year
                              </div>
                              <div>
                                {s.studentInfo?.academicYearStart || "-"} -{" "}
                                {s.studentInfo?.academicYearEnd || "-"}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex justify-end md:justify-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openAssign(s)}
                          >
                            Assign
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleUnassign(s)}
                          >
                            Unassign
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>

            {selectedStudent && (
              <div className="fixed inset-0 z-40 flex items-center justify-center bg-black bg-opacity-50">
                <div className="bg-white dark:bg-gray-900 p-6 rounded shadow-lg w-full max-w-lg">
                  <h3 className="text-xl font-semibold mb-3">
                    Assign Course to {selectedStudent.firstName}
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Course
                      </label>
                      <select
                        className="w-full mt-1 px-3 py-2 border rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        value={assignCourseId || ""}
                        onChange={(e) => setAssignCourseId(e.target.value)}
                      >
                        <option value="">Select course</option>
                        {courses.map((c) => (
                          <option key={c._id} value={c._id}>
                            {c.title}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex gap-2">
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Academic Year Start
                        </label>
                        <Input
                          type="number"
                          value={yearStart as any}
                          onChange={(e) =>
                            setYearStart(
                              e.target.value === ""
                                ? ""
                                : Number(e.target.value)
                            )
                          }
                        />
                      </div>
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Academic Year End
                        </label>
                        <Input
                          type="number"
                          value={yearEnd as any}
                          onChange={(e) =>
                            setYearEnd(
                              e.target.value === ""
                                ? ""
                                : Number(e.target.value)
                            )
                          }
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        onClick={() => setSelectedStudent(null)}
                      >
                        Cancel
                      </Button>
                      <Button onClick={handleAssign}>Assign</Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentManagement;
