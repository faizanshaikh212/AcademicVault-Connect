/**
 * Teacher Syllabus Management Page
 * Shows teacher's own syllabi and pending review items
 */

import React, { useState } from "react";

import AcademicManagement from "./AcademicManagement";
import { syllabusService } from "../../services/academicService";

const TeacherSyllabusManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"my" | "pending">("my");

  // Service for all syllabi (teachers can manage all syllabi)
  const mySyllabusService = {
    getAll: async (params?: any) => {
      // Get all syllabi for teachers to manage
      const response = await syllabusService.getAllSyllabus({
        ...params,
        // Removed uploader filter - teachers can see all syllabi
      });
      return {
        data: response.data.map((item: any) => ({
          ...item,
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
    upload: syllabusService.uploadSyllabus,
    update: syllabusService.updateSyllabus,
    delete: syllabusService.deleteSyllabus,
    trackDownload: syllabusService.trackDownload,
  };

  // Service for pending review syllabi
  const pendingSyllabusService = {
    getAll: async (params?: any) => {
      // Get all unapproved syllabi (including current user's own)
      const response = await syllabusService.getAllSyllabus({
        ...params,
        isApproved: "false",
      });
      return {
        data: response.data.map((item: any) => ({
          ...item,
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
    upload: syllabusService.uploadSyllabus,
    update: syllabusService.updateSyllabus,
    delete: syllabusService.deleteSyllabus,
    trackDownload: syllabusService.trackDownload,
  };

  const tabs = [
    { id: "my", label: "All Syllabi", count: null },
    { id: "pending", label: "Pending Review", count: null },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Syllabus Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage course syllabi and review submissions
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
              className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === tab.id
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
          resourceType="syllabus"
          title="All Syllabi"
          service={mySyllabusService}
        />
      )}

      {activeTab === "pending" && (
        <AcademicManagement
          resourceType="syllabus"
          title="Pending Review"
          service={pendingSyllabusService}
        />
      )}
    </div>
  );
};

export default TeacherSyllabusManagement;
