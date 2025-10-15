/**
 * Academic Resources Type Definitions
 * TypeScript interfaces for academic resource data structures
 */

// Base interface for all academic resources
export interface BaseAcademicResource {
  _id: string;
  title: string;
  description?: string;
  fileType: string;
  fileSize: number;
  originalFileName: string;
  googleDriveFileId?: string;
  publicUrl: string;
  embedUrl?: string;
  downloadUrl: string;
  fileUrl?: string; // Optional external file URL (e.g., Google Drive link)
  uploader: {
    _id: string;
    firstName: string;
    lastName: string;
    username: string;
    avatar?: string;
  } | null;
  isAdminUploaded: boolean;
  isApproved: boolean;
  approvedBy?: {
    _id: string;
    firstName: string;
    lastName: string;
    username: string;
  };
  approvedAt?: string;
  downloadCount: number;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
}

// Academic Notes interface
export interface AcademicNote extends BaseAcademicResource {
  course: string;
  subject: string;
  semester?: string;
  tags: string[];
  academicYear: string;
}

// Question Papers interface
export interface QuestionPaper extends BaseAcademicResource {
  degreeType: "BE" | "BSC" | "PG" | "Commerce" | "Diploma" | "Other";
  course: string;
  semester?: string;
  subject?: string;
  examYear: number;
  examType?:
    | "Mid-term"
    | "Final"
    | "Supplementary"
    | "Model"
    | "Practice"
    | "Internal";
  duration?: string;
  maxMarks?: number;
  instructions?: string;
  status?: "pending" | "approved" | "rejected";
  rejectionReason?: string;
  tags?: string[];
}

// Syllabus interface
export interface Syllabus extends BaseAcademicResource {
  course: string;
  academicYear: string;
  semester?: string;
  degreeType?: "BE" | "BSC" | "PG" | "Commerce" | "Diploma" | "Other";
  tags: string[];
  version: string;
  previousVersions: Array<{
    version: string;
    fileId: string;
    updatedAt: string;
    updatedBy: {
      _id: string;
      firstName: string;
      lastName: string;
      username: string;
    };
  }>;
  credits?: number;
  duration?: string;
  prerequisites: string[];
}

// Timetable interface
export interface Timetable extends BaseAcademicResource {
  course: string;
  semester: string;
  academicYear: string;
  degreeType?: "BE" | "BSC" | "PG" | "Commerce" | "Diploma" | "Other";
  timetableType: "Regular" | "Exam" | "Special" | "Holiday";
  effectiveFrom: string;
  effectiveTo?: string;
  isActive: boolean;
  tags: string[];
  notificationsSent: Array<{
    type: "created" | "updated" | "activated" | "deactivated";
    sentAt: string;
    recipients: string[];
  }>;
}

// API Response interfaces
export interface AcademicResourceResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface AcademicResourceListResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    current: number;
    pages: number;
    total: number;
  };
}

// Search and filter interfaces
export interface AcademicSearchParams {
  search?: string;
  keyword?: string;
  course?: string;
  semester?: string;
  academicYear?: string;
  degreeType?: string;
  tags?: string[];
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface NotesSearchParams extends AcademicSearchParams {
  subject?: string;
}

export interface QuestionPaperSearchParams extends AcademicSearchParams {
  subject?: string;
  examYear?: number;
  examType?: string;
}

export interface TimetableSearchParams extends AcademicSearchParams {
  timetableType?: string;
  isActive?: boolean;
}

// Upload form interfaces
export interface BaseUploadForm {
  title: string;
  description: string;
  file?: File | null;
  fileUrl?: string; // Optional external file URL
}

export interface NotesUploadForm extends BaseUploadForm {
  course: string;
  subject: string;
  semester: string;
  academicYear: string;
  tags: string[];
}

export interface QuestionPaperUploadForm extends BaseUploadForm {
  degreeType: string;
  course: string;
  semester: string;
  subject: string;
  examYear: number;
  examType: string;
  tags: string[];
}

export interface SyllabusUploadForm extends BaseUploadForm {
  course: string;
  academicYear: string;
  semester: string;
  degreeType: string;
  tags: string[];
  credits?: number;
  duration?: string;
  prerequisites: string[];
}

export interface TimetableUploadForm extends BaseUploadForm {
  course: string;
  semester: string;
  academicYear: string;
  degreeType: string;
  timetableType: string;
  effectiveFrom: string;
  effectiveTo?: string;
  tags: string[];
}

// Analytics interfaces
export interface AcademicAnalytics {
  counts: {
    notes: number;
    questionPapers: number;
    syllabus: number;
    timetables: number;
  };
  pending: {
    notes: number;
    questionPapers: number;
    syllabus: number;
    timetables: number;
    total: number;
  };
  recent: {
    notes: number;
    questionPapers: number;
    syllabus: number;
    timetables: number;
    total: number;
  };
  topResources: {
    notes: AcademicNote[];
    questionPapers: QuestionPaper[];
  };
}

// Category structure for question papers
export interface QuestionPaperCategory {
  degreeType: string;
  courses: string[];
}

export interface QuestionPapersBySemester {
  [semester: string]: QuestionPaper[];
}

// Global search results
export interface GlobalSearchResults {
  notes?: AcademicNote[];
  questionPapers?: QuestionPaper[];
  syllabus?: Syllabus[];
  timetables?: Timetable[];
}

// Filter options
export interface FilterOptions {
  degreeTypes: string[];
  courses: string[];
  semesters: string[];
  academicYears: string[];
  subjects: string[];
  tags: string[];
}

// Document viewer props
export interface DocumentViewerProps {
  fileUrl: string; // URL for direct file access
  fileType: string; // File extension/type for icon display
  embedUrl: string; // URL for embedded preview (e.g., Google Drive viewer)
  title: string; // Document title for display
  onClose: () => void; // Close callback
  isOpen: boolean; // Modal visibility state
}

// Resource card props
export interface ResourceCardProps {
  resource: AcademicNote | QuestionPaper | Syllabus | Timetable;
  onView: (resource: any) => void;
  onDownload: (resource: any) => void;
  onEdit?: (resource: any) => void;
  onDelete?: (resource: any) => void;
  showActions?: boolean;
}

// Upload modal props
export interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  resourceType: "notes" | "questionPapers" | "syllabus" | "timetables";
  onUploadSuccess: () => void;
}

// Admin approval props
export interface AdminApprovalProps {
  resource: AcademicNote | QuestionPaper | Syllabus | Timetable;
  resourceType: "notes" | "questionPapers" | "syllabus" | "timetables";
  onApprove: (id: string) => void;
  onReject: (id: string, reason?: string) => void;
}

// Export all types for easy importing
