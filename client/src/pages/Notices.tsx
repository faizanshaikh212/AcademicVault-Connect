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
import { Bell, Paperclip } from "lucide-react";
import { useToast } from "@/hooks/useToast.tsx";
import api from "@/services/api";

interface Notice {
  _id: string;
  title: string;
  description: string;
  coverImage: {
    url: string;
    fileId: string;
  };
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
  createdAt: string;
  updatedAt: string;
  createdBy: {
    _id: string;
    username: string;
    firstName: string;
    lastName: string;
  };
}

interface Course {
  _id: string;
  name: string;
  description: string;
  batch: string;
  semesters: number;
}

const Notices: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [notices, setNotices] = useState<Notice[]>([]);
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

  // Get notices based on filters
  useEffect(() => {
    const fetchNotices = async () => {
      setLoading(true);
      try {
        const params: Record<string, string> = {};
        if (selectedCourse !== "all") params.course = selectedCourse;
        if (selectedSemester !== "all") params.semester = selectedSemester;

        const { data } = await api.get("/notices", { params });
        setNotices(data);
      } catch (error) {
        console.error("Failed to fetch notices:", error);
        toast({
          title: "Error",
          description: "Failed to load notices. Please try again later.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    fetchNotices();
  }, [selectedCourse, selectedSemester, toast]);

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
            Notices
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Stay updated with the latest announcements and information
          </p>
        </div>
        {user?.role.includes("teacher") && (
          <Button asChild>
            <Link to="/teacher/notices/new" className="flex items-center gap-2">
              <Bell className="w-4 h-4" />
              Create Notice
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

      {/* Notices Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="h-48 w-full" />
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2 mt-2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6 mt-2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : notices.length === 0 ? (
        <div className="text-center py-12">
          <Bell className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            No Notices Found
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            There are no notices available for the selected filters.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {notices.map((notice) => (
            <Link key={notice._id} to={`/notices/${notice._id}`}>
              <Card className="hover:border-blue-500 transition-colors duration-200">
                {notice.coverImage?.url && (
                  <div className="relative h-48 w-full overflow-hidden">
                    <img
                      src={notice.coverImage.url}
                      alt={notice.title}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="line-clamp-2">{notice.title}</CardTitle>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {notice.course.name} - Semester {notice.course.semester}
                  </p>
                </CardHeader>
                <CardContent>
                  <p className="line-clamp-3 text-gray-600 dark:text-gray-300">
                    {notice.description}
                  </p>
                </CardContent>
                <CardFooter className="flex justify-between items-center text-sm text-gray-500 dark:text-gray-400">
                  <div className="flex items-center gap-2">
                    <Paperclip className="w-4 h-4" />
                    {notice.attachments.length} attachments
                  </div>
                  <span>
                    {formatDistanceToNow(new Date(notice.createdAt), {
                      addSuffix: true,
                    })}
                  </span>
                </CardFooter>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default Notices;
