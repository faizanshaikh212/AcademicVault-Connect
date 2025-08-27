import axios from "axios";
import { API_URL } from "../utils/constants";

interface TeacherCourse {
  course: string;
  semesters: number[];
}

interface TeacherWithCourses {
  _id: string;
  firstName: string;
  lastName: string;
  username: string;
  teacherCourses: {
    course: {
      _id: string;
      name: string;
      batch: string;
      totalSemesters: number;
    };
    semesters: number[];
  }[];
}

const teacherService = {
  assignCoursesToTeacher: async (
    teacherId: string,
    courses: TeacherCourse[]
  ) => {
    const response = await axios.post(`${API_URL}/teacher/assign-courses`, {
      teacherId,
      courses,
    });
    return response.data;
  },

  getTeachersWithCourses: async (): Promise<TeacherWithCourses[]> => {
    const response = await axios.get(`${API_URL}/teacher/teachers-courses`);
    return response.data;
  },
};

export default teacherService;
