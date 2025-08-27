import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/RadixSelect";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { formatDistanceToNow } from "date-fns";
import { ClipboardList, Calendar, Paperclip } from "lucide-react";
import { useToast } from "@/hooks/useToast.tsx";
import api from "@/services/api";

interface Assignment {
  _id: string;
  title: string;
  description: string;
  dueDate: string;
  attachments: Array<{
    name: string;
    fileId: string;
    mimeType: string;
    url: string;
  }>;
  course: {
    _id: string;
    name: string;
    semester: number;
  };
  lateSubmissionAppealEmail: string;
  createdAt: string;
  createdBy: {
    _id: string;
    username: string;
    firstName: string;
    lastName: string;
  };
  submission?: {
    _id: string;
    files: Array<{
      name: string;
      fileId: string;
      mimeType: string;
      url: string;
    }>;
    submittedAt: string;
  };
}

interface Course {
  _id: string;
  name: string;
  description: string;
  batch: string;
  semesters: number;
}

const Assignments: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>("all");
  const [selectedSemester, setSelectedSemester] = useState<string>("all");

  // Get all courses for the filter
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const { data } = await api.get("/courses");
        setCourses(data);
      } catch (error) {
        console.error("Failed to fetch courses:", error);
        toast({
          title: "Error",
          description: "Failed to load courses. Please try again later.",
          variant: "destructive",
        });
      }
    };
    fetchCourses();
  }, [toast]);

  // Get assignments based on filters
  useEffect(() => {
    const fetchAssignments = async () => {
      setLoading(true);
      try {
        const endpoint = user?.role.includes("teacher")
          ? "/assignments/teacher"
          : "/assignments";
        const params: Record<string, string> = {};

        if (selectedCourse !== "all") params.course = selectedCourse;
        if (selectedSemester !== "all") params.semester = selectedSemester;

        const { data } = await api.get(endpoint, { params });
        setAssignments(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Failed to fetch assignments:", error);
        toast({
          title: "Error",
          description: "Failed to load assignments. Please try again later.",
          variant: "destructive",
        });
        setAssignments([]);
      } finally {
        setLoading(false);
      }
    };
    fetchAssignments();
  }, [selectedCourse, selectedSemester, toast, user?.role]);

  // Generate semester options based on selected course
  const getSemesterOptions = () => {
    if (selectedCourse === "all") {
      return Array.from({ length: 12 }, (_, i) => i + 1); // Max 12 semesters
    }
    const course = courses.find((c) => c._id === selectedCourse);
    return course
      ? Array.from({ length: course.semesters }, (_, i) => i + 1)
      : [];
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Assignments
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            View and manage your academic assignments
          </p>
        </div>
        {user?.role.includes("teacher") && (
          <Button asChild>
            <Link
              to="/teacher/assignments/new"
              className="flex items-center gap-2"
            >
              <ClipboardList className="w-4 h-4" />
              Create Assignment
            </Link>
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <Select
          value={selectedCourse}
          onValueChange={(value) => {
            setSelectedCourse(value);
            setSelectedSemester("all"); // Reset semester when course changes
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select Course" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Courses</SelectItem>
            {courses.map((course) => (
              <SelectItem key={course._id} value={course._id}>
                {course.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={selectedSemester}
          onValueChange={setSelectedSemester}
          disabled={selectedCourse === "all"}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select Semester" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Semesters</SelectItem>
            {getSemesterOptions().map((semester) => (
              <SelectItem key={semester} value={semester.toString()}>
                Semester {semester}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Assignments Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2 mt-2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6 mt-2" />
              </CardContent>
              <CardFooter>
                <Skeleton className="h-4 w-1/3" />
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : !assignments ||
        !Array.isArray(assignments) ||
        assignments.length === 0 ? (
        <div className="text-center py-12">
          <ClipboardList className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            No Assignments Found
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            There are no assignments available for the selected filters.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.isArray(assignments) &&
            assignments.map((assignment) => (
              <Link key={assignment._id} to={`/assignments/${assignment._id}`}>
                <Card className="hover:border-blue-500 transition-colors duration-200">
                  <CardHeader>
                    <CardTitle className="line-clamp-2">
                      {assignment.title}
                    </CardTitle>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {assignment.course.name} - Semester{" "}
                      {assignment.course.semester}
                    </p>
                  </CardHeader>
                  <CardContent>
                    <p className="line-clamp-3 text-gray-600 dark:text-gray-300 mb-4">
                      {assignment.description}
                    </p>
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                      <Calendar className="w-4 h-4" />
                      Due{" "}
                      {formatDistanceToNow(new Date(assignment.dueDate), {
                        addSuffix: true,
                      })}
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between items-center text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center gap-2">
                      <Paperclip className="w-4 h-4" />
                      {assignment.attachments.length} attachments
                    </div>
                    {assignment.submission ? (
                      <span className="text-green-600 dark:text-green-500">
                        Submitted
                      </span>
                    ) : (
                      <span
                        className={
                          new Date(assignment.dueDate) < new Date()
                            ? "text-red-600 dark:text-red-500"
                            : "text-yellow-600 dark:text-yellow-500"
                        }
                      >
                        {new Date(assignment.dueDate) < new Date()
                          ? "Overdue"
                          : "Pending"}
                      </span>
                    )}
                  </CardFooter>
                </Card>
              </Link>
            ))}
        </div>
      )}
    </div>
  );
};

export default Assignments;
