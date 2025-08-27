import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import {
  PlusCircle,
  Search,
  Filter,
  FileText,
  Calendar,
  CheckCircle,
} from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Dialog } from "@/components/ui/Dialog";
import {
  assignmentService,
  type Assignment,
} from "@/services/assignment.service";
import { AssignmentForm } from "@/components/forms/AssignmentForm";
import { Badge } from "@/components/ui/Badge";
import { format } from "date-fns";
import { useToast } from "@/hooks/useToast.tsx";
import api from "@/services/api";

export const TeacherAssignments: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [courses, setCourses] = useState<
    Array<{ value: string; label: string; semesters: number }>
  >([]);
  const { toast } = useToast();

  const loadAssignments = async () => {
    try {
      const { data } = await assignmentService.getTeacherAssignments();
      // Ensure data is an array before setting state
      const payload: any = data;
      if (Array.isArray(payload)) {
        setAssignments(payload);
      } else if (payload && Array.isArray(payload.assignments)) {
        setAssignments(payload.assignments);
      } else {
        console.warn("Unexpected assignments payload", payload);
        setAssignments([]);
      }
    } catch (error) {
      console.error("Failed to load assignments:", error);
      toast({
        title: "Error",
        description: "Failed to load assignments",
        variant: "destructive",
      });
    }
  };

  const loadCourses = async () => {
    try {
      const { data } = await api.get("/teacher/courses");
      if (Array.isArray(data)) {
        setCourses(
          data.map((course) => ({
            value: course._id,
            label: `${course.name} (${course.batch})`,
            semesters: course.totalSemesters,
          }))
        );
      }
    } catch (error) {
      console.error("Failed to load courses:", error);
      toast({
        title: "Error",
        description: "Failed to load courses",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    loadAssignments();
    loadCourses();
  }, []);

  const handleCreateAssignment = async (data: any) => {
    try {
      setIsLoading(true);
      await assignmentService.createAssignment(data);
      await loadAssignments();
      setIsFormOpen(false);
      toast({
        title: "Success",
        description: "Assignment created successfully",
      });
    } catch (error) {
      console.error("Failed to create assignment:", error);
      toast({
        title: "Error",
        description: "Failed to create assignment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredAssignments = assignments.filter((assignment) =>
    assignment.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadgeVariant = (status: Assignment["status"]) => {
    switch (status) {
      case "published":
        return "success";
      case "draft":
        return "secondary";
      case "closed":
        return "destructive";
      default:
        return "default";
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold">Assignments</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Create and manage assignments for your courses
          </p>
        </div>
        <Button
          className="flex items-center gap-2"
          onClick={() => setIsFormOpen(true)}
        >
          <PlusCircle className="h-5 w-5" />
          Create Assignment
        </Button>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md">
        {/* Filters & Search */}
        <div className="p-4 border-b dark:border-gray-800">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search assignments..."
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
          {filteredAssignments.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
              <div className="bg-blue-100 dark:bg-blue-900/50 p-3 rounded-full mb-4">
                <FileText className="h-6 w-6 text-blue-600 dark:text-blue-300" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No assignments yet</h3>
              <p className="text-gray-500 dark:text-gray-400 max-w-sm">
                Create your first assignment by clicking the "Create Assignment"
                button above.
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredAssignments.map((assignment) => {
                const id = (assignment as any).id || (assignment as any)._id;
                return (
                  <div
                    key={id}
                    className="flex flex-col sm:flex-row justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  >
                    <div>
                      <h3 className="text-lg font-semibold mb-2">
                        {assignment.title}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300 line-clamp-2 mb-2">
                        {assignment.description}
                      </p>
                      <div className="flex flex-wrap gap-2 text-sm text-gray-500 dark:text-gray-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          Due:{" "}
                          {format(new Date(assignment.dueDate), "MMM d, yyyy")}
                        </span>
                        <span className="flex items-center gap-1">
                          <CheckCircle className="h-4 w-4" />
                          Points: {assignment.points}
                        </span>
                        <Badge
                          variant={getStatusBadgeVariant(assignment.status)}
                        >
                          {assignment.status}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-4 sm:mt-0">
                      <Button variant="outline" size="sm">
                        View Submissions
                      </Button>
                      <Button variant="outline" size="sm">
                        Edit
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Create Assignment Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <div className="mb-4">
          <h2 className="text-xl font-bold">Create Assignment</h2>
        </div>
        <AssignmentForm
          onSubmit={handleCreateAssignment}
          courses={courses}
          isLoading={isLoading}
        />
      </Dialog>
    </div>
  );
};
