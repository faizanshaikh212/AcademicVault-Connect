/**
 * API Endpoints configuration
 */

export const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5001";

export const API_ENDPOINTS = {
  // Academic resources
  notes: `${API_BASE_URL}/api/academic/notes`,
  questionPapers: `${API_BASE_URL}/api/academic/question-papers`,
  syllabus: `${API_BASE_URL}/api/academic/syllabus`,
  timetables: `${API_BASE_URL}/api/academic/timetables`,
  // Other endpoints can be added here as needed
} as const;
