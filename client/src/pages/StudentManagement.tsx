import { useState, useEffect } from "react";
import { useToast } from "@/hooks/useToast.tsx";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import AssignCourseDialog from "@/components/ui/AssignCourseDialog";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import api from "@/services/api";

interface Course {
  _id: string;
  name: string;
  batch: string;
}

interface Student {
  _id: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  studentCourses: Array<{
    course: Course;
    semester: number;
    status: string;
  }>;
  role: string;
}

const StudentManagement = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [teacherCourses, setTeacherCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [courseRequests, setCourseRequests] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const { toast } = useToast();

  // Fetch teacher's courses, students, and course requests
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [coursesRes, studentsRes, requestsRes] = await Promise.all([
          api.get("/teacher/courses"),
          api.get("/teacher/all-students"),
          api.get("/teacher/course-requests"),
        ]);

        console.log("Teacher courses response:", coursesRes.data);

        // coursesRes.data is already the array of courses
        const courses = Array.isArray(coursesRes.data) ? coursesRes.data : [];

        if (courses.length === 0) {
          console.warn("No courses found for teacher");
        }

        setTeacherCourses(courses);
        setStudents(studentsRes.data);
        setCourseRequests(requestsRes.data);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast({
          title: "Error",
          description: "Failed to load required data. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [toast]);

  // Handle course request action (approve/reject)
  const handleRequestAction = async (
    requestId: string,
    status: "approved" | "rejected"
  ) => {
    try {
      const { data } = await api.put(`/teacher/course-requests/${requestId}`, {
        status,
        message:
          status === "approved" ? "Request approved" : "Request rejected",
      });

      setCourseRequests((prev) =>
        prev.map((request) =>
          request._id === requestId ? data.request : request
        )
      );

      toast({
        title: "Success",
        description: `Course request ${status} successfully`,
      });
    } catch (error: any) {
      console.error("Error handling course request:", error);
      toast({
        title: "Error",
        description:
          error.response?.data?.message || "Failed to handle course request",
        variant: "destructive",
      });
    }
  };

  // Handle course assignment
  const handleCourseAssignment = async (
    studentId: string,
    courseId: string
  ): Promise<void> => {
    try {
      const response = await api.post("/teacher/assign-course", {
        studentId,
        courseId,
      });

      if (!response.data) {
        throw new Error("No data received from server");
      }

      const { student } = response.data;

      // Update the student in the list with the new data
      setStudents((prev) =>
        prev.map((s) =>
          s._id === studentId
            ? {
                ...s,
                studentCourses: student.studentCourses,
              }
            : s
        )
      );

      toast({
        title: "Success",
        description: `Course assigned to ${student.firstName} ${student.lastName}`,
      });
    } catch (error: any) {
      console.error("Error assigning course:", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to assign course",
        variant: "destructive",
      });
      throw error; // Re-throw to handle in the dialog
    }
  };

  // Filter students based on search term
  const filteredStudents = students.filter(
    (student) =>
      `${student.firstName} ${student.lastName}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Student Management</h1>

      <div className="mb-6">
        <Input
          type="text"
          placeholder="Search students by name, email, or username..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {/* Course Requests Section */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Course Requests</h2>
        {courseRequests.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Course</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Message</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {courseRequests.map((request) => (
                <TableRow key={request._id}>
                  <TableCell>
                    {request.student.firstName} {request.student.lastName}
                  </TableCell>
                  <TableCell>{request.course.name}</TableCell>
                  <TableCell className="capitalize">{request.status}</TableCell>
                  <TableCell>{request.message}</TableCell>
                  <TableCell>
                    {request.status === "pending" && (
                      <div className="flex gap-2">
                        <button
                          onClick={() =>
                            handleRequestAction(request._id, "approved")
                          }
                          className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() =>
                            handleRequestAction(request._id, "rejected")
                          }
                          className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="text-gray-500">No pending course requests</p>
        )}
      </div>

      {loading ? (
        <div>Loading...</div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Username</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Current Courses</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredStudents.map((student) => (
              <TableRow key={student._id}>
                <TableCell>
                  {student.firstName} {student.lastName}
                </TableCell>
                <TableCell>{student.username}</TableCell>
                <TableCell>{student.email}</TableCell>
                <TableCell>
                  {student.studentCourses.length > 0 ? (
                    <ul>
                      {student.studentCourses.map((course, index) => (
                        <li key={index}>
                          {course.course.name} (Semester {course.semester})
                        </li>
                      ))}
                    </ul>
                  ) : (
                    "None"
                  )}
                </TableCell>
                <TableCell>{student.role}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <AssignCourseDialog
                      courses={teacherCourses}
                      studentName={`${student.firstName} ${student.lastName}`}
                      onAssign={(courseId) =>
                        handleCourseAssignment(student._id, courseId)
                      }
                    />
                    {student.studentCourses.length > 0 && (
                      <>
                        <Button
                          variant="outline"
                          onClick={async () => {
                            try {
                              console.log(
                                "View Details clicked for student:",
                                student
                              );
                              const detailsPromises =
                                student.studentCourses.map((sc) => {
                                  console.log(
                                    "Fetching details for course:",
                                    sc.course
                                  );
                                  return api.get(
                                    `/teacher/students/${student._id}/courses/${sc.course._id}`
                                  );
                                });

                              console.log(
                                "Waiting for all course detail responses..."
                              );
                              const responses = await Promise.all(
                                detailsPromises
                              );
                              console.log("Received responses:", responses);

                              const courseDetails = responses
                                .map((res, idx) => {
                                  const sc = student.studentCourses[idx];
                                  return `${sc.course.name}: Semester ${res.data.semester} (${res.data.status})`;
                                })
                                .join("\n");

                              toast({
                                title: "Course Details",
                                description: courseDetails,
                                variant: "default",
                              });
                            } catch (error: any) {
                              console.error(
                                "Error fetching course details:",
                                error
                              );
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
                          variant="outline"
                          onClick={() => {
                            console.log(
                              "Edit Course clicked for student:",
                              student
                            );
                            setSelectedStudent(student);
                            setEditDialogOpen(true);
                            console.log(
                              "Dialog should be open:",
                              !editDialogOpen
                            );
                          }}
                        >
                          Edit Course
                        </Button>
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Edit Course Dialog */}
      <Dialog
        open={editDialogOpen}
        onOpenChange={(open) => {
          console.log("Dialog open state changing to:", open);
          setEditDialogOpen(open);
          if (!open) setSelectedStudent(null);
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

export default StudentManagement;
