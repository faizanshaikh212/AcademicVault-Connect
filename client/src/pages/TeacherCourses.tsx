import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import {
  PlusCircle,
  Search,
  Filter,
  Book,
  Users,
  FileText,
  Clock,
} from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Dialog } from "@/components/ui/Dialog";
import api from "@/services/api";

interface Course {
  id: string;
  code: string;
  name: string;
  description: string;
  studentCount: number;
  assignmentCount: number;
  nextAssignment?: {
    title: string;
    dueDate: string;
  };
  lastUpdated: string;
}

export const TeacherCourses: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);

  useEffect(() => {
    const loadCourses = async () => {
      try {
        const { data } = await api.get<Course[]>("/teacher/courses");
        setCourses(data);
      } catch (error) {
        console.error("Failed to load courses:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadCourses();
  }, []);

  const filteredCourses = courses.filter(
    (course) =>
      course.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold">Courses</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Manage your courses and assignments
          </p>
        </div>
        <Button
          className="flex items-center gap-2"
          onClick={() => setIsFormOpen(true)}
        >
          <PlusCircle className="h-5 w-5" />
          Add Course
        </Button>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md">
        {/* Filters & Search */}
        <div className="p-4 border-b dark:border-gray-800">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search courses..."
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

        {/* Content */}
        <div className="p-6">
          {isLoading ? (
            <div className="flex justify-center items-center min-h-[400px]">
              <p>Loading courses...</p>
            </div>
          ) : filteredCourses.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
              <div className="bg-blue-100 dark:bg-blue-900/50 p-3 rounded-full mb-4">
                <Book className="h-6 w-6 text-blue-600 dark:text-blue-300" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No courses found</h3>
              <p className="text-gray-500 dark:text-gray-400 max-w-sm">
                Create your first course by clicking the "Add Course" button
                above.
              </p>
            </div>
          ) : (
            <div className="grid gap-6">
              {filteredCourses.map((course) => (
                <div
                  key={course.id}
                  className="flex flex-col bg-gray-50 dark:bg-gray-800 rounded-lg overflow-hidden"
                >
                  <div className="p-6">
                    <div className="flex flex-col sm:flex-row justify-between gap-4">
                      <div>
                        <h3 className="text-xl font-semibold mb-1">
                          {course.name}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Course Code: {course.code}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          Manage
                        </Button>
                        <Button variant="outline" size="sm">
                          View Schedule
                        </Button>
                      </div>
                    </div>
                    <p className="mt-4 text-gray-600 dark:text-gray-300">
                      {course.description}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
                      <div className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-gray-500" />
                        <div>
                          <p className="text-sm font-medium">
                            {course.studentCount}
                          </p>
                          <p className="text-xs text-gray-500">Students</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-gray-500" />
                        <div>
                          <p className="text-sm font-medium">
                            {course.assignmentCount}
                          </p>
                          <p className="text-xs text-gray-500">Assignments</p>
                        </div>
                      </div>
                      {course.nextAssignment && (
                        <div className="flex items-center gap-2">
                          <Clock className="h-5 w-5 text-gray-500" />
                          <div>
                            <p className="text-sm font-medium truncate">
                              {course.nextAssignment.title}
                            </p>
                            <p className="text-xs text-gray-500">
                              Due:{" "}
                              {new Date(
                                course.nextAssignment.dueDate
                              ).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="px-6 py-3 bg-gray-100 dark:bg-gray-700 text-sm text-gray-500 dark:text-gray-400">
                    Last updated:{" "}
                    {new Date(course.lastUpdated).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Course Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <div className="mb-4">
          <h2 className="text-xl font-bold">Add New Course</h2>
        </div>
        {/* TODO: Add CourseForm component */}
      </Dialog>
    </div>
  );
};
