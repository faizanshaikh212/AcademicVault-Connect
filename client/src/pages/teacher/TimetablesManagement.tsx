/**
 * Teacher Timetables Management Page
 * Shows teacher's own timetables and pending review items
 */

import React, { useState } from "react";

import AcademicManagement from "./AcademicManagement";
import { timetablesService } from "../../services/academicService";

const TeacherTimetablesManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"my" | "pending">("my");

  // Service for all timetables (teachers can manage all timetables)
  const myTimetablesService = {
    getAll: async (params?: any) => {
      // Get all timetables for teachers to manage
      const response = await timetablesService.getAllTimetables({
        ...params,
        // Removed uploader filter - teachers can see all timetables
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
    upload: timetablesService.uploadTimetable,
    update: timetablesService.updateTimetable,
    delete: timetablesService.deleteTimetable,
    trackDownload: timetablesService.trackDownload,
  };

  // Service for pending review timetables
  const pendingTimetablesService = {
    getAll: async (params?: any) => {
      // Get unapproved timetables (include current user's own uploads)
      const response = await timetablesService.getAllTimetables({
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
    upload: timetablesService.uploadTimetable,
    update: timetablesService.updateTimetable,
    delete: timetablesService.deleteTimetable,
    trackDownload: timetablesService.trackDownload,
  };

  const tabs = [
    { id: "my", label: "All Timetables", count: null },
    { id: "pending", label: "Pending Review", count: null },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Timetables Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage class timetables and review submissions
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
          resourceType="timetables"
          title="All Timetables"
          service={myTimetablesService}
        />
      )}

      {activeTab === "pending" && (
        <AcademicManagement
          resourceType="timetables"
          title="Pending Review"
          service={pendingTimetablesService}
        />
      )}
    </div>
  );
};

export default TeacherTimetablesManagement;
