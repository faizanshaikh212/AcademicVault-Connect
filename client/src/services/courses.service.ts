import api from "./api";

const createCourse = (payload: any) => api.post(`/courses`, payload);

// FIXED: Use public endpoint for listing all courses (for question paper viewing)
const listCourses = async () => {
  const response = await api.get(`/courses/public`);
  // Handle the { success: true, data: [...] } format
  return { data: response.data?.data || response.data || [] };
};

// Protected endpoint for teacher's own courses
const listMyCourses = () => api.get(`/courses`);

const updateCourse = (id: string, payload: any) =>
  api.put(`/courses/${id}`, payload);
const deleteCourse = (id: string) => api.delete(`/courses/${id}`);

const createSemester = (payload: any) =>
  api.post(`/courses/semesters`, payload);

// FIXED: Use public endpoint for listing semesters (for question paper viewing)
const listSemestersForCourse = async (courseId: string) => {
  const response = await api.get(
    `/courses/semesters/public/course/${courseId}`
  );
  // Handle the { success: true, data: [...] } format
  return { data: response.data?.data || response.data || [] };
};

// Protected endpoint for teacher's own semesters
const listMySemestersForCourse = (courseId: string) =>
  api.get(`/courses/semesters/course/${courseId}`);

const updateSemester = (id: string, payload: any) =>
  api.put(`/courses/semesters/${id}`, payload);
const deleteSemester = (id: string) => api.delete(`/courses/semesters/${id}`);

const createSubject = (payload: any) => api.post(`/courses/subjects`, payload);

// FIXED: Use public endpoint for listing subjects (for question paper viewing)
const listSubjectsForSemester = async (semesterId: string) => {
  const response = await api.get(
    `/courses/subjects/public/semester/${semesterId}`
  );
  // Handle the { success: true, data: [...] } format
  return { data: response.data?.data || response.data || [] };
};

// Protected endpoint for teacher's own subjects
const listMySubjectsForSemester = (semesterId: string) =>
  api.get(`/courses/subjects/semester/${semesterId}`);

const updateSubject = (id: string, payload: any) =>
  api.put(`/courses/subjects/${id}`, payload);
const deleteSubject = (id: string) => api.delete(`/courses/subjects/${id}`);

// Course sharing methods (kept for backward compatibility but not used in simple version)
const shareCourse = (courseId: string, payload: { teacherId: string; permissions: string[] }) =>
  api.post(`/courses/${courseId}/share`, payload);

const unshareCourse = (courseId: string, payload: { teacherId: string }) =>
  api.post(`/courses/${courseId}/unshare`, payload);

const getTeachersForSharing = () => api.get(`/courses/teachers/list`);

const transferOwnership = (courseId: string, payload: { newOwnerId: string }) =>
  api.post(`/courses/${courseId}/transfer`, payload);

// Course access management methods
const getTeachersForAccess = () => api.get(`/courses/teachers`);

const grantCourseAccess = (courseId: string, payload: { userId: string }) =>
  api.post(`/courses/${courseId}/grant-access`, payload);

const revokeCourseAccess = (courseId: string, payload: { userId: string }) =>
  api.post(`/courses/${courseId}/revoke-access`, payload);

export default {
  createCourse,
  listCourses,
  listMyCourses,
  updateCourse,
  deleteCourse,
  createSemester,
  listSemestersForCourse,
  listMySemestersForCourse,
  updateSemester,
  deleteSemester,
  createSubject,
  listSubjectsForSemester,
  listMySubjectsForSemester,
  updateSubject,
  deleteSubject,
  shareCourse,
  unshareCourse,
  transferOwnership,
  getTeachersForSharing,
  getTeachersForAccess,
  grantCourseAccess,
  revokeCourseAccess,
};
