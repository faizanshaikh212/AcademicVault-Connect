/**
 * Teacher Notes Management Page
 * Shows teacher's own notes and "In Review" notes from students
 */

import React, { useState } from "react";
import AcademicManagement from "./AcademicManagement";
import { notesService } from "../../services/academicService";


const TeacherNotesManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"my-notes" | "pending">(
    "my-notes"
  );

  // Service for all notes (teachers can manage all notes)
  const myNotesService = {
    getAll: async (params?: any) => {
      // Get all notes for teachers to manage
      const response = await notesService.getAllNotes({
        ...params,
        // Removed uploader filter - teachers can see all notes
      });
      return response;
    },
    upload: notesService.uploadNote,
    update: notesService.updateNote,
    delete: notesService.deleteNote,
    trackDownload: notesService.trackDownload,
  };

  // Service for pending notes ("In Review" and "Disapproved" notes from any user)
  const pendingService = {
    getAll: async (params?: any) => {
      // Get notes that are not approved (both "In Review" and "Disapproved")
      const response = await notesService.getAllNotes({
        ...params,
        isApproved: "false",
      });
      return response;
    },
    upload: notesService.uploadNote,
    update: notesService.updateNote,
    delete: notesService.deleteNote,
    trackDownload: notesService.trackDownload,
  };

  const tabs = [
    { id: "my-notes", label: "All Notes", service: myNotesService },
    { id: "pending", label: "Pending Review", service: pendingService },
  ];

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex space-x-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === tab.id
                ? "bg-blue-600 text-white"
                : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
            >
              {tab.label}
              {tab.id === "pending" && (
                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                  Pending
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content based on active tab */}
      {tabs.map(
        (tab) =>
          activeTab === tab.id && (
            <AcademicManagement
              key={tab.id}
              resourceType="notes"
              title={
                tab.id === "my-notes" ? "All Academic Notes" : "Pending Notes"
              }
              service={tab.service}
            />
          )
      )}
    </div>
  );
};

export default TeacherNotesManagement;
