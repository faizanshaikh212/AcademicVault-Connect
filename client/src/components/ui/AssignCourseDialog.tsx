import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";

interface Course {
  _id: string;
  name: string;
  batch: string;
  totalSemesters?: number;
}

interface AssignCourseDialogProps {
  courses: Course[];
  studentName: string;
  onAssign: (courseId: string) => void;
}

const AssignCourseDialog = ({
  courses,
  studentName,
  onAssign,
}: AssignCourseDialogProps) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);

  const handleAssign = async (courseId: string) => {
    try {
      setIsLoading(true);
      await onAssign(courseId);
      setIsOpen(false);
    } finally {
      setIsLoading(false);
    }
  };

  console.log("Available courses:", courses); // Debug log

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          Assign Course {courses.length > 0 ? `(${courses.length})` : ""}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Assign Course to {studentName}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {isLoading ? (
            <div className="text-center">
              <p>Assigning course...</p>
            </div>
          ) : courses.length > 0 ? (
            <div className="grid grid-cols-1 gap-2">
              {courses.map((course) => (
                <Button
                  key={course._id}
                  onClick={() => handleAssign(course._id)}
                  variant="outline"
                  className="justify-start text-left p-4"
                >
                  <div>
                    <div className="font-semibold">{course.name}</div>
                    <div className="text-sm text-gray-500">
                      Batch: {course.batch}
                      {course.totalSemesters &&
                        ` • ${course.totalSemesters} Semesters`}
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          ) : (
            <div className="text-center">
              <p className="text-gray-500 mb-2">
                No courses available to assign
              </p>
              <p className="text-sm text-gray-400">
                Please make sure you have courses assigned to you as a teacher
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AssignCourseDialog;
