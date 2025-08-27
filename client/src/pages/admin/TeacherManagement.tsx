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
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/Dialog";
import api from "@/services/api";
import { Course, Teacher } from "@/types";

export const TeacherManagement = () => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  // Fetch teachers and courses
  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log("Fetching teachers and courses...");
        const [teachersRes, coursesRes] = await Promise.all([
          api.get("/admin/teachers"),
          api.get("/courses"),
        ]);

        if (Array.isArray(teachersRes.data)) {
          setTeachers(teachersRes.data);
        } else {
          console.error("Teachers data is not an array:", teachersRes.data);
          setTeachers([]);
        }

        if (Array.isArray(coursesRes.data)) {
          setCourses(coursesRes.data);
        } else {
          console.error("Courses data is not an array:", coursesRes.data);
          setCourses([]);
        }
      } catch (error: any) {
        console.error("Error fetching data:", error);
        toast({
          description: "Failed to load required data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [toast]);

  // Handle course assignment to teacher
  const handleCourseAssignment = async (
    teacherId: string,
    course: Course,
    selectedSemesters: number[]
  ) => {
    try {
      console.log("Assigning course:", {
        teacherId,
        courseId: course._id,
        semesters: selectedSemesters,
      });

      console.log("Making API request with:", {
        teacherId,
        courseId: course._id,
        semesters: selectedSemesters,
      });

      const { data } = await api.post(`/admin/teachers/${teacherId}/courses`, {
        courseId: course._id,
        semesters: selectedSemesters,
      });

      console.log("Server response:", data);
      console.log("Server response teacher courses:", data.teacherCourses);

      const updatedTeacher = data;
      setTeachers((prev) =>
        prev.map((teacher) =>
          teacher._id === teacherId
            ? {
                ...teacher,
                teacherCourses: updatedTeacher.teacherCourses,
              }
            : teacher
        )
      );

      toast({
        description: "Course assigned successfully",
        variant: "default",
      });
    } catch (error: any) {
      console.error("Error assigning course:", error);
      console.error("Error details:", error.response?.data || error.message);
      toast({
        description: error.response?.data?.message || "Failed to assign course",
        variant: "destructive",
      });
    }
  };

  const AssignCourseDialog = ({ teacher }: { teacher: Teacher }) => {
    const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
    const [selectedSemesters, setSelectedSemesters] = useState<number[]>([]);
    const [isOpen, setIsOpen] = useState(false);

    const availableCourses = courses.filter(
      (course) =>
        !teacher.teacherCourses.some((tc) => tc.course._id === course._id)
    );

    const handleAssign = async () => {
      if (!selectedCourse) {
        console.log("No course selected");
        return;
      }
      console.log("handleAssign called with:", {
        teacherId: teacher._id,
        selectedCourse,
        selectedSemesters,
      });

      try {
        await handleCourseAssignment(
          teacher._id,
          selectedCourse,
          selectedSemesters
        );
        console.log("Assignment successful, closing dialog");
        setIsOpen(false);
        setSelectedCourse(null);
        setSelectedSemesters([]);
      } catch (error) {
        console.error("Error in handleAssign:", error);
      }
    };

    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="outline">Assign Course</Button>
        </DialogTrigger>
        <DialogContent
          className="sm:max-w-[425px]"
          aria-describedby="course-assignment-description"
        >
          <DialogHeader>
            <DialogTitle>
              Assign Course to {teacher.firstName} {teacher.lastName}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <p
              id="course-assignment-description"
              className="text-sm text-muted-foreground"
            >
              Select a course and the semesters you want to assign to this
              teacher.
            </p>
            {availableCourses.length === 0 ? (
              <p className="text-center text-muted-foreground">
                No courses available to assign
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-2">
                {availableCourses.map((course) => (
                  <div key={course._id} className="flex items-center gap-2">
                    <Button
                      variant={
                        selectedCourse?._id === course._id
                          ? "default"
                          : "outline"
                      }
                      className="w-full justify-start"
                      onClick={() => {
                        setSelectedCourse(course);
                        setSelectedSemesters([]);
                      }}
                    >
                      {course.name} ({course.batch})
                    </Button>
                  </div>
                ))}
              </div>
            )}
            {selectedCourse && (
              <div>
                <h4 className="mb-2">Select Semesters:</h4>
                <div className="flex flex-wrap gap-2">
                  {Array.from(
                    { length: selectedCourse.totalSemesters },
                    (_, i) => i + 1
                  ).map((sem) => (
                    <Button
                      key={sem}
                      variant={
                        selectedSemesters.includes(sem) ? "default" : "outline"
                      }
                      onClick={() => {
                        setSelectedSemesters((prev) =>
                          prev.includes(sem)
                            ? prev.filter((s) => s !== sem)
                            : [...prev, sem]
                        );
                      }}
                    >
                      {sem}
                    </Button>
                  ))}
                </div>
              </div>
            )}
            <Button
              onClick={handleAssign}
              disabled={!selectedCourse || selectedSemesters.length === 0}
            >
              Assign
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  // Filter teachers based on search term
  const filteredTeachers = teachers
    ? teachers.filter(
        (teacher) =>
          `${teacher.firstName} ${teacher.lastName}`
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          teacher.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          teacher.username.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Teacher Management</h1>

      <div className="mb-6">
        <Input
          type="text"
          placeholder="Search teachers..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
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
              <TableHead>Assigned Courses</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTeachers.map((teacher) => (
              <TableRow key={teacher._id}>
                <TableCell>
                  {teacher.firstName} {teacher.lastName}
                </TableCell>
                <TableCell>{teacher.username}</TableCell>
                <TableCell>{teacher.email}</TableCell>
                <TableCell>
                  {teacher.teacherCourses.length > 0 ? (
                    <ul className="list-disc pl-4">
                      {teacher.teacherCourses.map((tc, index) => (
                        <li key={index}>
                          {tc.course.name} - Semesters:{" "}
                          {tc.semesters.join(", ")}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    "No courses assigned"
                  )}
                </TableCell>
                <TableCell>
                  <AssignCourseDialog teacher={teacher} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
};
