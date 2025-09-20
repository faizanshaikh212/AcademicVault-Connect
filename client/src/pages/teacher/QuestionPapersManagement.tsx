/**
 * Teacher Question Papers Management Page
 * Shows teacher's own question papers and pending review items
 */

import React, { useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import AcademicManagement from "./AcademicManagement";
import { questionPapersService } from "../../services/academicService";

const TeacherQuestionPapersManagement: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"my" | "pending">("my");

  // Service for teacher's own question papers
  const myQuestionPapersService = {
    getAll: async (params?: any) => {
      // Get only approved question papers uploaded by this teacher
      const response = await questionPapersService.getAllQuestionPapers({
        ...params,
        uploader: user?._id,
        isApproved: "true",
      });
      return {
        data: response.data.map((item: any) => ({
          ...item,
          // Prefer explicit academicYear, fall back to examYear (string) if present
          academicYear:
            item.academicYear ||
            (item.examYear !== undefined && item.examYear !== null
              ? String(item.examYear)
              : "N/A"),
          tags: item.tags || [],
        })),
        pagination: response.pagination,
      };
    },
    upload: questionPapersService.uploadQuestionPaper,
    update: questionPapersService.updateQuestionPaper,
    delete: questionPapersService.deleteQuestionPaper,
    trackDownload: questionPapersService.trackDownload,
  };

  // Service for pending review question papers
  const pendingQuestionPapersService = {
    getAll: async (params?: any) => {
      // Get all unapproved question papers (including current user's own)
      const response = await questionPapersService.getAllQuestionPapers({
        ...params,
        isApproved: false,
      });
      return {
        data: response.data.map((item: any) => ({
          ...item,
          // Prefer explicit academicYear, fall back to examYear (string) if present
          academicYear:
            item.academicYear ||
            (item.examYear !== undefined && item.examYear !== null
              ? String(item.examYear)
              : "N/A"),
          tags: item.tags || [],
        })),
        pagination: response.pagination,
      };
    },
    upload: questionPapersService.uploadQuestionPaper,
    update: questionPapersService.updateQuestionPaper,
    delete: questionPapersService.deleteQuestionPaper,
    trackDownload: questionPapersService.trackDownload,
  };

  const tabs = [
    { id: "my", label: "My Question Papers", count: null },
    { id: "pending", label: "Pending Review", count: null },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Question Papers Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage question papers and review submissions
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as "my" | "pending")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
              }`}
            >
              {tab.label}
              {tab.count !== null && tab.count > 0 && (
                <span className="ml-2 py-0.5 px-2 rounded-full text-xs bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      {activeTab === "my" && (
        <AcademicManagement
          resourceType="questionPapers"
          title="My Question Papers"
          service={myQuestionPapersService}
        />
      )}

      {activeTab === "pending" && (
        <AcademicManagement
          resourceType="questionPapers"
          title="Pending Review"
          service={pendingQuestionPapersService}
        />
      )}
    </div>
  );
};

export default TeacherQuestionPapersManagement;
