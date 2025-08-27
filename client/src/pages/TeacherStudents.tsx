import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import {
  Search,
  Filter,
  GraduationCap as GradIcon,
  ArrowUpDown as ArrowIcon,
} from "lucide-react";
import { Input } from "@/components/ui/Input";
import api from "@/services/api";
import { useToast } from "@/hooks/useToast.tsx";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";

interface Course {
  _id: string;
  name: string;
  batch: string;
  totalSemesters: number;
}

interface StudentCourse {
  course: Course;
  semester: number;
  status: string;
}

interface Student {
  _id: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  profile?: {
    avatar?: string;
  };
  studentCourses: StudentCourse[];
}

export const TeacherStudents: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const loadStudents = async () => {
      try {
        // Prefer teacher-specific endpoint; fallback to public users list
        let { data } = await api.get("/teacher/students");

        const payload: any = data;
        if (Array.isArray(payload)) {
          setStudents(payload);
        } else if (payload && Array.isArray(payload.students)) {
          setStudents(payload.students);
        } else {
          console.warn("Unexpected students payload", payload);
          setStudents([]);
        }
      } catch (error) {
        console.error("Failed to load students:", error);
        setStudents([]);
      }
    };

    loadStudents();
  }, []);

  // Filter students based on search query
  const filteredStudents = students.filter(
    (student) =>
      `${student.firstName} ${student.lastName}`
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      student.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold">Students</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Manage students in your courses
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md">
        {/* Filters & Search */}
        <div className="p-4 border-b dark:border-gray-800">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search students..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-full"
              />
            </div>
            <Button variant="outline" className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filters
            </Button>
          </div>
        </div>

        {/* Table Header */}
        <div className="hidden md:grid grid-cols-5 gap-4 p-4 text-sm font-medium text-gray-500 dark:text-gray-400 border-b dark:border-gray-800">
          <button className="flex items-center gap-1">
            Name
            <ArrowIcon className="h-4 w-4" />
          </button>
          <button className="flex items-center gap-1">
            Course
            <ArrowIcon className="h-4 w-4" />
          </button>
          <button className="flex items-center gap-1">
            Semester
            <ArrowIcon className="h-4 w-4" />
          </button>
          <button className="flex items-center gap-1">
            Batch
            <ArrowIcon className="h-4 w-4" />
          </button>
          <div>Actions</div>
        </div>

        {/* Content */}
        {filteredStudents.length === 0 ? (
          <div className="p-6">
            <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
              <div className="bg-blue-100 dark:bg-blue-900/50 p-3 rounded-full mb-4">
                <GradIcon className="h-6 w-6 text-blue-600 dark:text-blue-300" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No students found</h3>
              <p className="text-gray-500 dark:text-gray-400 max-w-sm">
                {searchQuery
                  ? "No students match your search criteria."
                  : "Students will appear here once they are enrolled in your courses."}
              </p>
            </div>
          </div>
        ) : (
          <div className="divide-y dark:divide-gray-800">
            {filteredStudents.map((student) => (
              <div
                key={student._id}
                className="grid md:grid-cols-5 gap-4 p-4 items-center hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <div className="flex items-center gap-3">
                  {student.profile?.avatar && (
                    <img
                      src={student.profile.avatar}
                      alt={`${student.firstName}'s avatar`}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  )}
                  <a
                    href={`/profile/${student.username}`}
                    className="hover:text-blue-600 hover:underline"
                  >
                    {student.firstName} {student.lastName}
                  </a>
                </div>
                <div>
                  {student.studentCourses?.[0]?.course?.name || "No course"}
                </div>
                <div>
                  Semester {student.studentCourses?.[0]?.semester || "-"}
                </div>
                <div>{student.studentCourses?.[0]?.course?.batch || "-"}</div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      try {
                        if (!student.studentCourses?.length) {
                          toast({
                            title: "No Courses",
                            description:
                              "This student is not enrolled in any courses.",
                            variant: "default",
                          });
                          return;
                        }

                        const courseDetails = await Promise.all(
                          student.studentCourses.map(async (sc) => {
                            const { data } = await api.get(
                              `/teacher/students/${student._id}/courses/${sc.course._id}`
                            );
                            return `${sc.course.name}: Semester ${data.semester} (${data.status})`;
                          })
                        );

                        toast({
                          title: `${student.firstName} ${student.lastName}'s Courses`,
                          description: courseDetails.join("\n"),
                          variant: "default",
                        });
                      } catch (error: any) {
                        console.error("Error fetching course details:", error);
                        toast({
                          title: "Error",
                          description:
                            error.response?.data?.message ||
                            "Failed to fetch course details",
                          variant: "destructive",
                        });
                      }
                    }}
                  >
                    View Details
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      setSelectedStudent(student);
                      setEditDialogOpen(true);
                    }}
                  >
                    Edit Course
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Course Dialog */}
      <Dialog
        open={editDialogOpen}
        onOpenChange={(isOpen: boolean) => {
          setEditDialogOpen(isOpen);
          if (!isOpen) setSelectedStudent(null);
        }}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Course</DialogTitle>
          </DialogHeader>
          {selectedStudent ? (
            <div className="grid gap-4 py-4">
              {selectedStudent.studentCourses.map((sc) => (
                <div key={sc.course._id} className="border p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">{sc.course.name}</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Current Semester: {sc.semester} • Status: {sc.status}
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      size="sm"
                      onClick={async () => {
                        try {
                          console.log(
                            "Updating semester for course:",
                            sc.course._id
                          );
                          const response = await api.put(
                            `/teacher/students/${selectedStudent._id}/courses/${sc.course._id}`,
                            { semester: sc.semester + 1 }
                          );
                          console.log("Update response:", response);

                          setStudents((prev) =>
                            prev.map((s) =>
                              s._id === selectedStudent._id
                                ? {
                                    ...s,
                                    studentCourses: s.studentCourses.map((c) =>
                                      c.course._id === sc.course._id
                                        ? { ...c, semester: c.semester + 1 }
                                        : c
                                    ),
                                  }
                                : s
                            )
                          );

                          toast({
                            title: "Success",
                            description: "Course semester updated successfully",
                            variant: "default",
                          });
                        } catch (error: any) {
                          console.error("Error updating semester:", error);
                          toast({
                            title: "Error",
                            description:
                              error.response?.data?.message ||
                              "Failed to update semester",
                            variant: "destructive",
                          });
                        }
                      }}
                    >
                      Next Semester
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={async () => {
                        try {
                          console.log(
                            "Marking course as completed:",
                            sc.course._id
                          );
                          const response = await api.put(
                            `/teacher/students/${selectedStudent._id}/courses/${sc.course._id}`,
                            { status: "completed" }
                          );
                          console.log("Update response:", response);

                          setStudents((prev) =>
                            prev.map((s) =>
                              s._id === selectedStudent._id
                                ? {
                                    ...s,
                                    studentCourses: s.studentCourses.map((c) =>
                                      c.course._id === sc.course._id
                                        ? { ...c, status: "completed" }
                                        : c
                                    ),
                                  }
                                : s
                            )
                          );

                          toast({
                            title: "Success",
                            description: "Course marked as completed",
                            variant: "default",
                          });
                        } catch (error: any) {
                          console.error("Error marking as completed:", error);
                          toast({
                            title: "Error",
                            description:
                              error.response?.data?.message ||
                              "Failed to update status",
                            variant: "destructive",
                          });
                        }
                      }}
                    >
                      Mark Completed
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={async () => {
                        try {
                          console.log(
                            "Marking course as dropped:",
                            sc.course._id
                          );
                          const response = await api.put(
                            `/teacher/students/${selectedStudent._id}/courses/${sc.course._id}`,
                            { status: "dropped" }
                          );
                          console.log("Update response:", response);

                          setStudents((prev) =>
                            prev.map((s) =>
                              s._id === selectedStudent._id
                                ? {
                                    ...s,
                                    studentCourses: s.studentCourses.map((c) =>
                                      c.course._id === sc.course._id
                                        ? { ...c, status: "dropped" }
                                        : c
                                    ),
                                  }
                                : s
                            )
                          );

                          toast({
                            title: "Success",
                            description: "Course marked as dropped",
                            variant: "default",
                          });
                        } catch (error: any) {
                          console.error("Error marking as dropped:", error);
                          toast({
                            title: "Error",
                            description:
                              error.response?.data?.message ||
                              "Failed to update status",
                            variant: "destructive",
                          });
                        }
                      }}
                    >
                      Drop Course
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-4 text-center text-gray-500">
              No student selected
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
