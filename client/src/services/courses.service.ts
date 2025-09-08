import api from "./api";

const createCourse = (payload: any) => api.post(`/courses`, payload);
const listCourses = () => api.get(`/courses`);
const updateCourse = (id: string, payload: any) =>
  api.put(`/courses/${id}`, payload);
const deleteCourse = (id: string) => api.delete(`/courses/${id}`);

const createSemester = (payload: any) =>
  api.post(`/courses/semesters`, payload);
const listSemestersForCourse = (courseId: string) =>
  api.get(`/courses/semesters/course/${courseId}`);
const updateSemester = (id: string, payload: any) =>
  api.put(`/courses/semesters/${id}`, payload);
const deleteSemester = (id: string) => api.delete(`/courses/semesters/${id}`);

const createSubject = (payload: any) => api.post(`/courses/subjects`, payload);
const listSubjectsForSemester = (semesterId: string) =>
  api.get(`/courses/subjects/semester/${semesterId}`);
const updateSubject = (id: string, payload: any) =>
  api.put(`/courses/subjects/${id}`, payload);
const deleteSubject = (id: string) => api.delete(`/courses/subjects/${id}`);

export default {
  createCourse,
  listCourses,
  updateCourse,
  deleteCourse,
  createSemester,
  listSemestersForCourse,
  updateSemester,
  deleteSemester,
  createSubject,
  listSubjectsForSemester,
  updateSubject,
  deleteSubject,
};
