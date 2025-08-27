import api from "./api";

export interface Assignment {
  _id: string;
  title: string;
  description: string;
  target: {
    course: {
      _id: string;
      name: string;
      batch: string;
    };
    allSemesters: boolean;
    semesters: number[];
  };
  dueDate: string;
  points: number;
  status: "draft" | "published" | "closed";
  attachments?: Array<{
    filename: string;
    fileUrl: string;
    driveFileId: string;
    mimeType: string;
    size: number;
  }>;
  lateSubmissionAppealEmail: string;
  createdAt: string;
  updatedAt: string;
  createdBy: {
    _id: string;
    firstName: string;
    lastName: string;
    username: string;
  };
}

export interface AssignmentSubmission {
  id: string;
  assignmentId: string;
  studentId: string;
  submissionDate: string;
  status: "submitted" | "late" | "graded";
  attachments: Array<{
    filename: string;
    fileUrl: string;
    driveFileId: string;
    mimeType: string;
    size: number;
  }>;
  grade?: number;
  feedback?: string;
}

export interface CreateAssignmentData {
  title: string;
  description: string;
  courseId: string;
  dueDate: string;
  points: number;
  lateSubmissionAppealEmail: string;
  attachments?: File[];
  target: {
    course: string;
    allSemesters: boolean;
    semesters: number[];
  };
}

// Common type for both teacher and student assignment lists
export type AssignmentWithSubmission = Assignment & {
  submission?: AssignmentSubmission;
};

export const assignmentService = {
  // Teacher APIs
  getTeacherAssignments: () => api.get<Assignment[]>("/teacher/assignments"),

  getAssignment: (id: string) =>
    api.get<Assignment>(`/teacher/assignments/${id}`),

  createAssignment: (data: CreateAssignmentData) => {
    const formData = new FormData();

    // Append basic fields
    formData.append("title", data.title);
    formData.append("description", data.description);
    formData.append("dueDate", data.dueDate);
    formData.append("points", data.points.toString());
    formData.append(
      "lateSubmissionAppealEmail",
      data.lateSubmissionAppealEmail
    );

    // Handle target object
    formData.append(
      "target",
      JSON.stringify({
        course: data.target.course,
        allSemesters: data.target.allSemesters,
        semesters: data.target.semesters,
      })
    );

    // Handle file attachments
    if (data.attachments && data.attachments.length > 0) {
      data.attachments.forEach((file) => {
        formData.append(`attachments`, file);
      });
    }

    // Log the FormData contents for debugging
    console.log("FormData contents:");
    for (const pair of (formData as any).entries()) {
      console.log(pair[0], pair[1]);
    }

    return api.post<Assignment>("/teacher/assignments", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },

  updateAssignment: (id: string, data: Partial<CreateAssignmentData>) =>
    api.put<Assignment>(`/teacher/assignments/${id}`, data),

  deleteAssignment: (id: string) => api.delete(`/teacher/assignments/${id}`),

  getAssignmentSubmissions: (assignmentId: string) =>
    api.get<AssignmentSubmission[]>(
      `/teacher/assignments/${assignmentId}/submissions`
    ),

  gradeSubmission: (
    assignmentId: string,
    submissionId: string,
    grade: number,
    feedback?: string
  ) =>
    api.post(
      `/teacher/assignments/${assignmentId}/submissions/${submissionId}/grade`,
      {
        grade,
        feedback,
      }
    ),

  // Student APIs
  getAllAssignments: () => api.get<AssignmentWithSubmission[]>("/assignments"),

  getStudentAssignment: (id: string) =>
    api.get<AssignmentWithSubmission>(`/assignments/${id}`),

  submitAssignment: (assignmentId: string, formData: FormData) =>
    api.post<AssignmentSubmission>(
      `/assignments/${assignmentId}/submit`,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      }
    ),

  unsubmitAssignment: (assignmentId: string) =>
    api.delete<AssignmentSubmission>(`/assignments/${assignmentId}/submit`),

  getMySubmissions: () =>
    api.get<AssignmentWithSubmission[]>("/assignments/submissions"),
};
