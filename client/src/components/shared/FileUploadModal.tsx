/**
 * File Upload Modal Component
 * Generic modal for uploading academic resources
 */

import React, { useState } from "react";
import { X, Upload, FileText, AlertCircle } from "lucide-react";
import { toast } from "react-hot-toast";

interface FileUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (data: FormData) => Promise<void>;
  resourceType: "notes" | "questionPapers" | "syllabus" | "timetables";
  title: string;
}

const FileUploadModal: React.FC<FileUploadModalProps> = ({
  isOpen,
  onClose,
  onUpload,
  resourceType,
  title,
}) => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    course: "",
    subject: "",
    semester: "",
    academicYear: "",
    degreeType: "",
    tags: "",
    fileUrl: "", // Add file URL field
  });
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Define allowed types based on resource type
      const allowedTypes =
        resourceType === "timetables"
          ? [
              "application/pdf",
              "application/msword",
              "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
              "application/vnd.ms-excel",
              "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
              "image/jpeg",
              "image/jpg",
              "image/png",
            ]
          : [
              "application/pdf",
              "application/msword",
              "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
              "application/vnd.ms-powerpoint",
              "application/vnd.openxmlformats-officedocument.presentationml.presentation",
              "text/plain",
            ];

      if (!allowedTypes.includes(selectedFile.type)) {
        toast.error(
          resourceType === "timetables"
            ? "Invalid file type. Only PDF, DOC, DOCX, XLS, XLSX, JPG, JPEG, and PNG files are allowed."
            : "Invalid file type. Only PDF, DOC, DOCX, PPT, PPTX, and TXT files are allowed."
        );
        return;
      }

      // Validate file size (50MB limit)
      if (selectedFile.size > 50 * 1024 * 1024) {
        toast.error("File size must be less than 50MB.");
        return;
      }

      setFile(selectedFile);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file && !formData.fileUrl) {
      toast.error(
        "Please either select a file to upload or provide a valid file URL."
      );
      return;
    }

    if (!formData.title || !formData.course || !formData.academicYear) {
      toast.error(
        "Please fill in all required fields (Title, Course, and Academic Year)."
      );
      return;
    }

    // Additional validation for question papers
    if (resourceType === "questionPapers") {
      if (!formData.subject) {
        toast.error("Subject is required for question papers.");
        return;
      }
      if (!formData.degreeType) {
        toast.error("Degree Type is required for question papers.");
        return;
      }
    }
    try {
      setUploading(true);

      const uploadData = new FormData();
      if (file) {
        uploadData.append("file", file);
      } else if (formData.fileUrl) {
        uploadData.append("fileUrl", formData.fileUrl);
      }
      uploadData.append("title", formData.title);
      uploadData.append("description", formData.description);
      uploadData.append("course", formData.course);

      if (formData.subject) uploadData.append("subject", formData.subject);
      if (formData.semester) uploadData.append("semester", formData.semester);
      if (formData.academicYear) {
        uploadData.append("academicYear", formData.academicYear);

        // For question papers, extract exam year from academic year
        if (resourceType === "questionPapers") {
          // Extract first year from academic year format (e.g., "2023-2024" -> "2023")
          const match = formData.academicYear.match(/^(\d{4})-\d{4}$/);
          if (match) {
            const examYear = parseInt(match[1]);
            if (examYear >= 2000) {
              uploadData.append("examYear", examYear.toString());
            } else {
              toast.error("Academic year must be after 2000.");
              return;
            }
          } else {
            toast.error(
              "Invalid academic year format. Please use YYYY-YYYY format (e.g., 2023-2024)."
            );
            return;
          }
        }
      }
      if (formData.degreeType)
        uploadData.append("degreeType", formData.degreeType);

      // Handle tags
      if (formData.tags) {
        const tagsArray = formData.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter((tag) => tag);
        uploadData.append("tags", JSON.stringify(tagsArray));
      }

      await onUpload(uploadData);

      // Reset form
      setFormData({
        title: "",
        description: "",
        course: "",
        subject: "",
        semester: "",
        academicYear: "",
        degreeType: "",
        tags: "",
        fileUrl: "",
      });
      setFile(null);
      onClose();

      toast.success("File uploaded successfully!");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload file. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* File Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Choose one: Upload File or Provide URL
            </label>
            <div className="space-y-4">
              {/* File URL Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  File URL
                </label>
                <input
                  type="url"
                  name="fileUrl"
                  value={formData.fileUrl}
                  onChange={handleInputChange}
                  disabled={file !== null}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed"
                  placeholder="Enter file URL (e.g., Google Drive link)"
                />
              </div>

              {/* Or Divider */}
              <div className="flex items-center">
                <div className="flex-1 border-t border-gray-300 dark:border-gray-600"></div>
                <div className="mx-4 text-sm text-gray-500">OR</div>
                <div className="flex-1 border-t border-gray-300 dark:border-gray-600"></div>
              </div>

              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Upload File
                </label>
                <div
                  className={`border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center ${
                    formData.fileUrl ? "opacity-50 pointer-events-none" : ""
                  }`}
                >
                  <input
                    type="file"
                    onChange={handleFileChange}
                    className="hidden"
                    id="file-upload"
                    accept={
                      resourceType === "timetables"
                        ? ".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                        : ".pdf,.doc,.docx,.ppt,.pptx,.txt"
                    }
                    disabled={formData.fileUrl !== ""}
                  />
                  <label
                    htmlFor="file-upload"
                    className="cursor-pointer flex flex-col items-center"
                  >
                    {file ? (
                      <>
                        <FileText className="w-12 h-12 text-green-500 mb-2" />
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {file.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </>
                    ) : (
                      <>
                        <Upload className="w-12 h-12 text-gray-400 mb-2" />
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Click to upload or drag and drop
                        </p>
                        <p className="text-xs text-gray-500">
                          PDF, DOC, DOCX, PPT, PPTX, TXT (max 50MB)
                        </p>
                      </>
                    )}
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Title *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Enter title"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Enter description"
            />
          </div>

          {/* Course */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Course *
            </label>
            <input
              type="text"
              name="course"
              value={formData.course}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="e.g., Computer Science, Mathematics"
              required
            />
          </div>

          {/* Subject (for notes and question papers) */}
          {(resourceType === "notes" || resourceType === "questionPapers") && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Subject {resourceType === "questionPapers" && "*"}
              </label>
              <input
                type="text"
                name="subject"
                value={formData.subject}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="e.g., Data Structures, Calculus"
                required={resourceType === "questionPapers"}
              />
            </div>
          )}

          {/* Degree Type (for question papers) */}
          {resourceType === "questionPapers" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Degree Type
              </label>
              <select
                name="degreeType"
                value={formData.degreeType}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">Select Degree Type</option>
                <option value="BE">Bachelor in Engineering</option>
                <option value="BSC">Bachelor in Science</option>
                <option value="PG">Post Graduate</option>
                <option value="Commerce">Commerce</option>
              </select>
            </div>
          )}

          {/* Semester */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Semester
            </label>
            <select
              name="semester"
              value={formData.semester}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">Select Semester</option>
              <option value="1">Semester 1</option>
              <option value="2">Semester 2</option>
              <option value="3">Semester 3</option>
              <option value="4">Semester 4</option>
              <option value="5">Semester 5</option>
              <option value="6">Semester 6</option>
              <option value="7">Semester 7</option>
              <option value="8">Semester 8</option>
            </select>
          </div>

          {/* Academic Year */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Academic Year *
            </label>
            <input
              type="text"
              name="academicYear"
              value={formData.academicYear}
              onChange={(e) => {
                const value = e.target.value;
                // Only allow digits and hyphen
                if (!/^[\d-]*$/.test(value)) return;

                handleInputChange(e);
              }}
              onBlur={(e) => {
                const value = e.target.value;
                if (value && !/^\d{4}-\d{4}$/.test(value)) {
                  toast.error(
                    "Please enter academic year in YYYY-YYYY format (e.g., 2023-2024)"
                  );
                } else if (value) {
                  const [startYear, endYear] = value.split("-").map(Number);
                  if (startYear < 2000) {
                    toast.error("Academic year must be after 2000");
                  } else if (endYear !== startYear + 1) {
                    toast.error("End year should be one year after start year");
                  }
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="e.g., 2023-2024"
              pattern="\d{4}-\d{4}"
              title="Please enter academic year in YYYY-YYYY format (e.g., 2023-2024)"
              required
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tags
            </label>
            <input
              type="text"
              name="tags"
              value={formData.tags}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Enter tags separated by commas"
            />
            <p className="text-xs text-gray-500 mt-1">
              Separate multiple tags with commas
            </p>
          </div>

          {/* Permission Notice */}
          {resourceType !== "notes" && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <div className="flex items-start">
                <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 mr-2" />
                <div>
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    <strong>Teacher Permission Required:</strong> Only users
                    with teacher role can upload {resourceType}.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploading}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              {uploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Upload
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FileUploadModal;
