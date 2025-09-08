import api from "./api";

const listStudents = () => api.get(`/students`);
const assignStudent = (studentId: string, payload: any) =>
  api.post(`/students/${studentId}/assign`, payload);
const unassignStudent = (studentId: string) =>
  api.post(`/students/${studentId}/unassign`);

export default { listStudents, assignStudent, unassignStudent };
