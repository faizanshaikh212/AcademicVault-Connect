import api from "./api";

interface Course {
  _id: string;
  name: string;
  batch: string;
  totalSemesters: number;
  studentCount?: number;
}

const courseService = {
  getAllCourses: async (): Promise<Course[]> => {
    const { data } = await api.get<Course[]>("/courses");
    return data;
  },

  getCourseById: async (id: string): Promise<Course> => {
    const { data } = await api.get<Course>(`/courses/${id}`);
    return data;
  },

  createCourse: async (courseData: Omit<Course, "_id">) => {
    const { data } = await api.post("/courses", courseData);
    return data;
  },

  updateCourse: async (id: string, courseData: Partial<Course>) => {
    const { data } = await api.put(`/courses/${id}`, courseData);
    return data;
  },

  deleteCourse: async (id: string) => {
    const { data } = await api.delete(`/courses/${id}`);
    return data;
  },
};

export default courseService;
