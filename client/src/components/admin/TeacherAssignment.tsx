import React, { useState, useEffect } from "react";
import teacherService from "../../services/teacher.service";
import {
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
  Checkbox,
  FormControlLabel,
  Typography,
  Paper,
} from "@mui/material";
import { useToast } from "@/hooks/useToast.tsx";
import courseService from "@/services/course.service";

interface Course {
  _id: string;
  name: string;
  batch: string;
  totalSemesters: number;
}

interface Teacher {
  _id: string;
  firstName: string;
  lastName: string;
  username: string;
  teacherCourses: {
    course: Course;
    semesters: number[];
  }[];
}

const TeacherAssignment: React.FC = () => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedTeacher, setSelectedTeacher] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedSemesters, setSelectedSemesters] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadTeachersAndCourses();
  }, []);

  const loadTeachersAndCourses = async () => {
    try {
      const [teachersData, coursesData] = await Promise.all([
        teacherService.getTeachersWithCourses(),
        courseService.getAllCourses(),
      ]);
      setTeachers(teachersData);
      setCourses(coursesData);
    } catch (error) {
      toast({
        description: "Failed to load data",
        variant: "destructive",
      });
    }
  };

  const handleTeacherChange = (event: SelectChangeEvent) => {
    setSelectedTeacher(event.target.value);
    // Reset other selections when teacher changes
    setSelectedCourse("");
    setSelectedSemesters([]);
  };

  const handleCourseChange = (event: SelectChangeEvent) => {
    setSelectedCourse(event.target.value);
    setSelectedSemesters([]); // Reset semester selection when course changes
  };

  const handleSemesterChange = (semester: number) => {
    setSelectedSemesters((prev) =>
      prev.includes(semester)
        ? prev.filter((s) => s !== semester)
        : [...prev, semester]
    );
  };

  const handleSubmit = async () => {
    if (!selectedTeacher || !selectedCourse || selectedSemesters.length === 0) {
      toast({
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const teacher = teachers.find((t) => t._id === selectedTeacher);
      if (!teacher) throw new Error("Teacher not found");

      // Get existing courses and add the new one
      const existingCourses = teacher.teacherCourses
        .filter((tc) => tc.course._id !== selectedCourse)
        .map((tc) => ({
          course: tc.course._id,
          semesters: tc.semesters,
        }));

      const newCourseAssignment = {
        course: selectedCourse,
        semesters: selectedSemesters,
      };

      await teacherService.assignCoursesToTeacher(selectedTeacher, [
        ...existingCourses,
        newCourseAssignment,
      ]);

      toast({
        description: "Course assigned successfully",
        variant: "default",
      });
      await loadTeachersAndCourses(); // Refresh data

      // Reset form
      setSelectedCourse("");
      setSelectedSemesters([]);
    } catch (error) {
      toast({
        description: "Failed to assign course",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getAvailableCourses = () => {
    if (!selectedTeacher) return courses;

    const teacher = teachers.find((t) => t._id === selectedTeacher);
    if (!teacher) return courses;

    const assignedCourseIds = new Set(
      teacher.teacherCourses.map((tc) => tc.course._id)
    );

    return courses.filter((course) => !assignedCourseIds.has(course._id));
  };

  const renderSemesterCheckboxes = () => {
    if (!selectedCourse) return null;

    const course = courses.find((c) => c._id === selectedCourse);
    if (!course) return null;

    return (
      <div style={{ marginTop: "1rem" }}>
        <Typography variant="subtitle1">Select Semesters:</Typography>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem" }}>
          {Array.from({ length: course.totalSemesters }, (_, i) => i + 1).map(
            (semester) => (
              <FormControlLabel
                key={semester}
                control={
                  <Checkbox
                    checked={selectedSemesters.includes(semester)}
                    onChange={() => handleSemesterChange(semester)}
                  />
                }
                label={`Semester ${semester}`}
              />
            )
          )}
        </div>
      </div>
    );
  };

  const renderCurrentAssignments = () => {
    if (!selectedTeacher) return null;

    const teacher = teachers.find((t) => t._id === selectedTeacher);
    if (!teacher || teacher.teacherCourses.length === 0) return null;

    return (
      <Paper style={{ padding: "1rem", marginTop: "1rem" }}>
        <Typography variant="h6">Current Assignments</Typography>
        {teacher.teacherCourses.map((tc) => (
          <div key={tc.course._id} style={{ marginTop: "0.5rem" }}>
            <Typography>
              {tc.course.name} ({tc.course.batch}) - Semesters:{" "}
              {tc.semesters.join(", ")}
            </Typography>
          </div>
        ))}
      </Paper>
    );
  };

  return (
    <div style={{ padding: "2rem" }}>
      <Typography variant="h4" gutterBottom>
        Assign Courses to Teachers
      </Typography>

      <FormControl fullWidth style={{ marginBottom: "1rem" }}>
        <InputLabel>Select Teacher</InputLabel>
        <Select
          value={selectedTeacher}
          onChange={handleTeacherChange}
          label="Select Teacher"
        >
          {teachers.map((teacher) => (
            <MenuItem key={teacher._id} value={teacher._id}>
              {`${teacher.firstName} ${teacher.lastName} (${teacher.username})`}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {selectedTeacher && (
        <>
          <FormControl fullWidth style={{ marginBottom: "1rem" }}>
            <InputLabel>Select Course</InputLabel>
            <Select
              value={selectedCourse}
              onChange={handleCourseChange}
              label="Select Course"
            >
              {getAvailableCourses().map((course) => (
                <MenuItem key={course._id} value={course._id}>
                  {`${course.name} (${course.batch})`}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {renderSemesterCheckboxes()}

          <Button
            variant="contained"
            color="primary"
            onClick={handleSubmit}
            disabled={
              loading || !selectedCourse || selectedSemesters.length === 0
            }
            style={{ marginTop: "1rem" }}
          >
            {loading ? "Assigning..." : "Assign Course"}
          </Button>

          {renderCurrentAssignments()}
        </>
      )}
    </div>
  );
};

export default TeacherAssignment;
