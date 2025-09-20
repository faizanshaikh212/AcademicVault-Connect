/**
 * Academic Resources Service
 * API service functions for academic resources
 */

import api from "./api";
import {
  AcademicNote,
  QuestionPaper,
  Syllabus,
  Timetable,
  AcademicResourceResponse,
  AcademicResourceListResponse,
  NotesSearchParams,
  QuestionPaperSearchParams,
  AcademicSearchParams,
  TimetableSearchParams,
  NotesUploadForm,
  QuestionPaperUploadForm,
  SyllabusUploadForm,
  TimetableUploadForm,
  AcademicAnalytics,
  QuestionPapersBySemester,
  GlobalSearchResults,
} from "../types/academic";

// ===== ACADEMIC NOTES SERVICES =====

export const notesService = {
  // Get all notes with search and filtering
  async getAllNotes(
    params: NotesSearchParams & {
      uploader?: string;
      excludeUploader?: string;
      isApproved?: boolean | string;
    } = {}
  ): Promise<AcademicResourceListResponse<AcademicNote>> {
    const response = await api.get("/academic/notes", { params });
    return response.data;
  },

  // Get single note by ID
  async getNoteById(
    id: string
  ): Promise<AcademicResourceResponse<AcademicNote>> {
    const response = await api.get(`/academic/notes/${id}`);
    return response.data;
  },

  // Upload new note
  async uploadNote(
    formData: FormData
  ): Promise<AcademicResourceResponse<AcademicNote>> {
    const response = await api.post("/academic/notes", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  // Update note
  async updateNote(
    id: string,
    data: Partial<NotesUploadForm>
  ): Promise<AcademicResourceResponse<AcademicNote>> {
    const response = await api.put(`/academic/notes/${id}`, data);
    return response.data;
  },

  // Delete note
  async deleteNote(id: string): Promise<AcademicResourceResponse<null>> {
    const response = await api.delete(`/academic/notes/${id}`);
    return response.data;
  },

  // Track download
  async trackDownload(
    id: string
  ): Promise<{ success: boolean; downloadUrl: string }> {
    const response = await api.post(`/academic/notes/${id}/download`);
    return response.data;
  },

  // Admin: Approve note
  async approveNote(
    id: string
  ): Promise<AcademicResourceResponse<AcademicNote>> {
    const response = await api.post(`/academic/notes/${id}/approve`);
    return response.data;
  },

  // Admin: Reject note
  async rejectNote(
    id: string,
    reason?: string
  ): Promise<AcademicResourceResponse<null>> {
    const response = await api.post(`/academic/notes/${id}/reject`, { reason });
    return response.data;
  },
};

// ===== QUESTION PAPERS SERVICES =====

export const questionPapersService = {
  // Get all question papers
  async getAllQuestionPapers(
    params: QuestionPaperSearchParams = {}
  ): Promise<AcademicResourceListResponse<QuestionPaper>> {
    const response = await api.get("/academic/question-papers", { params });
    return response.data;
  },

  // Get question papers by category structure
  async getQuestionPapersByCategory(
    degreeType?: string,
    course?: string
  ): Promise<AcademicResourceResponse<string[] | QuestionPapersBySemester>> {
    // Encode path segments to ensure spaces and special characters are safe in URLs
    let url = "/academic/question-papers/categories";
    if (degreeType) url += `/${encodeURIComponent(degreeType)}`;
    if (course) url += `/${encodeURIComponent(course)}`;

    const response = await api.get(url);
    return response.data;
  },

  // Get question papers with more flexible filtering
  async getQuestionPapersWithFilters(
    params: QuestionPaperSearchParams = {}
  ): Promise<AcademicResourceListResponse<QuestionPaper>> {
    const response = await api.get("/academic/question-papers", { params });
    return response.data;
  },

  // Get single question paper by ID
  async getQuestionPaperById(
    id: string
  ): Promise<AcademicResourceResponse<QuestionPaper>> {
    const response = await api.get(`/academic/question-papers/${id}`);
    return response.data;
  },

  // Upload new question paper
  async uploadQuestionPaper(
    formData: FormData
  ): Promise<AcademicResourceResponse<QuestionPaper>> {
    const response = await api.post("/academic/question-papers", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  // Update question paper
  async updateQuestionPaper(
    id: string,
    data: Partial<QuestionPaperUploadForm>
  ): Promise<AcademicResourceResponse<QuestionPaper>> {
    const response = await api.put(`/academic/question-papers/${id}`, data);
    // After updating, fetch the authoritative resource from the server and
    // dispatch it to ensure all listeners receive the canonical, up-to-date
    // document (some server-side processing may modify fields).
    try {
      const fresh = await api.get(`/academic/question-papers/${id}`);
      const resource = fresh?.data?.data || response.data?.data;
      if (typeof window !== "undefined" && window.dispatchEvent) {
        window.dispatchEvent(
          new CustomEvent("questionPaper:updated", {
            detail: { id, resource },
          })
        );
      }
    } catch (e) {
      // fallback: still dispatch whatever the PUT returned
      try {
        if (typeof window !== "undefined" && window.dispatchEvent) {
          window.dispatchEvent(
            new CustomEvent("questionPaper:updated", {
              detail: { id, resource: response.data?.data },
            })
          );
        }
      } catch (e2) {
        /* ignore */
      }
    }
    return response.data;
  },

  // Delete question paper
  async deleteQuestionPaper(
    id: string
  ): Promise<AcademicResourceResponse<null>> {
    const response = await api.delete(`/academic/question-papers/${id}`);
    try {
      if (typeof window !== "undefined" && window.dispatchEvent) {
        window.dispatchEvent(
          new CustomEvent("questionPaper:updated", { detail: { id } })
        );
      }
    } catch (e) {
      // ignore
    }
    return response.data;
  },

  // Track download
  async trackDownload(
    id: string
  ): Promise<{ success: boolean; downloadUrl: string }> {
    const response = await api.post(`/academic/question-papers/${id}/download`);
    return response.data;
  },

  // Admin: Approve question paper
  async approveQuestionPaper(
    id: string
  ): Promise<AcademicResourceResponse<QuestionPaper>> {
    const response = await api.post(`/academic/question-papers/${id}/approve`);
    return response.data;
  },
};

// ===== SYLLABUS SERVICES =====

export const syllabusService = {
  // Get all syllabus documents
  async getAllSyllabus(
    params: AcademicSearchParams = {}
  ): Promise<AcademicResourceListResponse<Syllabus>> {
    const response = await api.get("/academic/syllabus", { params });
    return response.data;
  },

  // Get single syllabus by ID
  async getSyllabusById(
    id: string
  ): Promise<AcademicResourceResponse<Syllabus>> {
    const response = await api.get(`/academic/syllabus/${id}`);
    return response.data;
  },

  // Upload new syllabus
  async uploadSyllabus(
    formData: FormData
  ): Promise<AcademicResourceResponse<Syllabus>> {
    const response = await api.post("/academic/syllabus", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  // Update syllabus
  async updateSyllabus(
    id: string,
    data: Partial<SyllabusUploadForm>
  ): Promise<AcademicResourceResponse<Syllabus>> {
    const response = await api.put(`/academic/syllabus/${id}`, data);
    return response.data;
  },

  // Update syllabus file (creates new version)
  async updateSyllabusFile(
    id: string,
    formData: FormData
  ): Promise<AcademicResourceResponse<Syllabus>> {
    const response = await api.put(`/academic/syllabus/${id}/file`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  // Delete syllabus
  async deleteSyllabus(id: string): Promise<AcademicResourceResponse<null>> {
    const response = await api.delete(`/academic/syllabus/${id}`);
    return response.data;
  },

  // Track download
  async trackDownload(
    id: string
  ): Promise<{ success: boolean; downloadUrl: string }> {
    const response = await api.post(`/academic/syllabus/${id}/download`);
    return response.data;
  },

  // Admin: Approve syllabus
  async approveSyllabus(
    id: string
  ): Promise<AcademicResourceResponse<Syllabus>> {
    const response = await api.post(`/academic/syllabus/${id}/approve`);
    return response.data;
  },
};

// ===== TIMETABLES SERVICES =====

export const timetablesService = {
  // Get all timetables
  async getAllTimetables(
    params: TimetableSearchParams = {}
  ): Promise<AcademicResourceListResponse<Timetable>> {
    const response = await api.get("/academic/timetables", { params });
    return response.data;
  },

  // Get active timetables for specific course/semester
  async getActiveTimetables(
    course: string,
    semester: string,
    academicYear: string
  ): Promise<AcademicResourceResponse<Timetable[]>> {
    const response = await api.get("/academic/timetables/active", {
      params: { course, semester, academicYear },
    });
    return response.data;
  },

  // Get single timetable by ID
  async getTimetableById(
    id: string
  ): Promise<AcademicResourceResponse<Timetable>> {
    const response = await api.get(`/academic/timetables/${id}`);
    return response.data;
  },

  // Upload new timetable
  async uploadTimetable(
    formData: FormData
  ): Promise<AcademicResourceResponse<Timetable>> {
    const response = await api.post("/academic/timetables", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  // Update timetable
  async updateTimetable(
    id: string,
    data: Partial<TimetableUploadForm>
  ): Promise<AcademicResourceResponse<Timetable>> {
    const response = await api.put(`/academic/timetables/${id}`, data);
    return response.data;
  },

  // Delete timetable
  async deleteTimetable(id: string): Promise<AcademicResourceResponse<null>> {
    const response = await api.delete(`/academic/timetables/${id}`);
    return response.data;
  },

  // Track download
  async trackDownload(
    id: string
  ): Promise<{ success: boolean; downloadUrl: string }> {
    const response = await api.post(`/academic/timetables/${id}/download`);
    return response.data;
  },

  // Admin: Approve timetable
  async approveTimetable(
    id: string,
    notifyUsers: boolean = false
  ): Promise<AcademicResourceResponse<Timetable>> {
    const response = await api.post(`/academic/timetables/${id}/approve`, {
      notifyUsers,
    });
    return response.data;
  },

  // Admin: Toggle timetable status
  async toggleTimetableStatus(
    id: string
  ): Promise<AcademicResourceResponse<Timetable>> {
    const response = await api.post(`/academic/timetables/${id}/toggle-status`);
    return response.data;
  },
};

// ===== ADMIN SERVICES =====

export const academicAdminService = {
  // Get analytics overview
  async getAnalyticsOverview(): Promise<
    AcademicResourceResponse<AcademicAnalytics>
  > {
    const response = await api.get("/academic/analytics/overview");
    return response.data;
  },

  // Get pending approvals
  async getPendingApprovals(
    type?: string,
    page: number = 1,
    limit: number = 20
  ): Promise<AcademicResourceResponse<any>> {
    const response = await api.get("/academic/pending-approvals", {
      params: { type, page, limit },
    });
    return response.data;
  },
};

// ===== SEARCH SERVICES =====

export const academicSearchService = {
  // Global search across all academic resources
  async globalSearch(
    query: string,
    type?: string,
    limit: number = 10
  ): Promise<AcademicResourceResponse<GlobalSearchResults>> {
    const response = await api.get("/academic/search", {
      params: { q: query, type, limit },
    });
    return response.data;
  },
};

// ===== UTILITY FUNCTIONS =====

export const academicUtils = {
  // Create FormData for file upload
  createUploadFormData(data: any, file: File): FormData {
    const formData = new FormData();

    // Add file
    formData.append("file", file);

    // Add other fields
    Object.keys(data).forEach((key) => {
      if (data[key] !== undefined && data[key] !== null) {
        if (Array.isArray(data[key])) {
          formData.append(key, JSON.stringify(data[key]));
        } else {
          formData.append(key, data[key].toString());
        }
      }
    });

    return formData;
  },

  // Track resource view
  async trackResourceView(
    id: string,
    type: "notes" | "questionPapers" | "syllabus" | "timetables"
  ): Promise<void> {
    try {
      const service = {
        notes: notesService,
        questionPapers: questionPapersService,
        syllabus: syllabusService,
        timetables: timetablesService,
      }[type];

      // For a view action we should call the GET endpoint which (on the server)
      // increments the viewCount. Do not call the download tracking endpoint.
      if (service) {
        // Each service exposes a getXById method: getNoteById, getQuestionPaperById, etc.
        if (type === "notes") await notesService.getNoteById(id);
        else if (type === "questionPapers")
          await questionPapersService.getQuestionPaperById(id);
        else if (type === "syllabus") await syllabusService.getSyllabusById(id);
        else if (type === "timetables")
          await timetablesService.getTimetableById(id);
      }
    } catch (error) {
      console.error(`Error tracking view for ${type} ${id}:`, error);
    }
  },

  // Format file size
  formatFileSize(bytes: number): string {
    if (bytes === 0) return "0 Bytes";

    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  },

  // Get file type icon
  getFileTypeIcon(fileType: string): string {
    const type = fileType.toLowerCase();

    if (type === "pdf") return "📄";
    if (type.includes("doc")) return "📝";
    if (type.includes("ppt")) return "📊";
    if (type.includes("xls")) return "📈";
    if (type.includes("image") || ["jpg", "jpeg", "png", "gif"].includes(type))
      return "🖼️";

    return "📁";
  },

  // Validate file type
  validateFileType(file: File, allowedTypes: string[]): boolean {
    return allowedTypes.includes(file.type);
  },

  // Validate file size
  validateFileSize(file: File, maxSizeInMB: number): boolean {
    const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
    return file.size <= maxSizeInBytes;
  },
};

export default {
  notesService,
  questionPapersService,
  syllabusService,
  timetablesService,
  academicAdminService,
  academicSearchService,
  academicUtils,
};
