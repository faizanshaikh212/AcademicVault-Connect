import { useState, useEffect } from "react";
import { Teacher, Course } from "../../types";
import { Card, CardContent, CardHeader } from "../ui/Card";
import { Button } from "../ui/Button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/Dialog";
import { Label } from "../ui/Label";
import Select from "../ui/Select";
import { LoadingSpinner } from "../ui/LoadingSpinner";
import { toast } from "../../hooks/useToast";

const TeacherManagement = () => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [selectedSemesters, setSelectedSemesters] = useState<number[]>([]);
  // Import toast directly

  // Fetch teachers and courses
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [teachersRes, coursesRes] = await Promise.all([
          fetch("/api/admin/teachers"),
          fetch("/api/admin/courses"),
        ]);

        if (!teachersRes.ok || !coursesRes.ok) {
          throw new Error("Failed to fetch data");
        }

        const teachersData = await teachersRes.json();
        const coursesData = await coursesRes.json();

        setTeachers(teachersData);
        setCourses(coursesData);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast("Failed to fetch data", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Handle course assignment
  const handleAssignCourse = async () => {
    if (!selectedTeacher || !selectedCourse || selectedSemesters.length === 0) {
      toast("Please select all required fields", "error");
      return;
    }

    try {
      const response = await fetch(
        `/api/admin/teachers/${selectedTeacher._id}/courses`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            courseId: selectedCourse,
            semesters: selectedSemesters,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to assign course");
      }

      const updatedTeacher = await response.json();
      setTeachers(
        teachers.map((teacher) =>
          teacher._id === updatedTeacher._id ? updatedTeacher : teacher
        )
      );

      toast("Course assigned successfully", "success");
      setShowAssignDialog(false);
      resetAssignmentForm();
    } catch (error) {
      console.error("Error assigning course:", error);
      toast("Failed to assign course", "error");
    }
  };

  const resetAssignmentForm = () => {
    setSelectedCourse("");
    setSelectedSemesters([]);
    setSelectedTeacher(null);
  };

  const handleOpenAssignDialog = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setShowAssignDialog(true);
  };

  const generateSemesterOptions = (totalSemesters: number) => {
    return Array.from({ length: totalSemesters }, (_, i) => i + 1);
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <h1 className="text-3xl font-bold">Teacher Management</h1>

      {teachers.map((teacher) => (
        <Card key={teacher._id}>
          <CardHeader>
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">
                {teacher.firstName} {teacher.lastName}
              </h2>
              <Button onClick={() => handleOpenAssignDialog(teacher)}>
                Assign Course
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <h3 className="font-semibold mb-2">Assigned Courses:</h3>
            {teacher.teacherCourses.length > 0 ? (
              <ul className="space-y-2">
                {teacher.teacherCourses.map((tc) => (
                  <li key={tc.course._id}>
                    {tc.course.name} - Semesters: {tc.semesters.join(", ")}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500">No courses assigned yet</p>
            )}
          </CardContent>
        </Card>
      ))}

      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Course to Teacher</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Course</Label>
              <Select
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                options={courses.map((course) => ({
                  value: course._id,
                  label: course.name,
                }))}
                placeholder="Select a course"
              />
            </div>{" "}
            {selectedCourse && (
              <div className="space-y-2">
                <Label>Semesters</Label>
                <div className="flex flex-wrap gap-2">
                  {generateSemesterOptions(
                    courses.find((c) => c._id === selectedCourse)
                      ?.totalSemesters || 0
                  ).map((semester) => (
                    <Button
                      key={semester}
                      variant={
                        selectedSemesters.includes(semester)
                          ? "default"
                          : "outline"
                      }
                      onClick={() => {
                        setSelectedSemesters((prev) =>
                          prev.includes(semester)
                            ? prev.filter((s) => s !== semester)
                            : [...prev, semester]
                        );
                      }}
                    >
                      {semester}
                    </Button>
                  ))}
                </div>
              </div>
            )}
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setShowAssignDialog(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleAssignCourse}>Assign Course</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TeacherManagement;
