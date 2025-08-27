import api from "./api";
import { uploadToDrive } from "@/lib/googleDrive";

export interface Notice {
  _id: string;
  title: string;
  description: string;
  coverImage: string;
  tags: string[];
  attachments: Array<{
    filename: string;
    fileUrl: string;
    driveFileId: string;
    mimeType: string;
    size: number;
  }>;
  target: {
    course: string;
    allSemesters: boolean;
    semesters: number[];
  };
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

interface CreateNoticeDto {
  title: string;
  description: string;
  coverImage?: File;
  tags: string[];
  attachments: File[];
  target: {
    course: string;
    allSemesters: boolean;
    semesters: number[];
  };
}

class NoticeService {
  async createNotice(notice: CreateNoticeDto) {
    const formData = new FormData();
    formData.append("title", notice.title);
    formData.append("description", notice.description);
    formData.append("target", JSON.stringify(notice.target));
    formData.append("tags", JSON.stringify(notice.tags));

    // Upload cover image if provided
    if (notice.coverImage) {
      const coverImageResponse = await uploadToDrive(notice.coverImage);
      formData.append("coverImage", coverImageResponse.webContentLink);
    }

    // Upload attachments to Google Drive
    const attachmentPromises = notice.attachments.map(uploadToDrive);
    const attachmentResults = await Promise.all(attachmentPromises);
    formData.append("attachments", JSON.stringify(attachmentResults));

    const { data } = await api.post("/notices", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return data;
  }

  async getNotices(params: {
    courseId?: string;
    semester?: number;
    page?: number;
    limit?: number;
    search?: string;
    tags?: string[];
  }) {
    const { data } = await api.get("/notices", { params });
    return data;
  }

  async getNoticeById(id: string) {
    const { data } = await api.get(`/notices/${id}`);
    return data;
  }

  async updateNotice(id: string, notice: Partial<CreateNoticeDto>) {
    const { data } = await api.patch(`/notices/${id}`, notice);
    return data;
  }

  async deleteNotice(id: string) {
    const { data } = await api.delete(`/notices/${id}`);
    return data;
  }

  async getTeacherNotices(params: {
    page?: number;
    limit?: number;
    search?: string;
    tags?: string[];
  }) {
    const { data } = await api.get("/notices/teacher", { params });
    return data;
  }
}

export default new NoticeService();
