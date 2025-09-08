import React, { useState, useEffect } from "react";
import { Upload, FileText, AlertCircle } from "lucide-react";
import { toast } from "react-hot-toast";

type ResourceType = "notes" | "questionPapers" | "syllabus" | "timetables";

interface FormValues {
  title: string;
  description: string;
  course: string;
  subject: string;
  semester: string;
  academicYear: string;
  degreeType: string;
  tags: string;
  fileUrl: string;
}

interface Props {
  initialValues?: Partial<FormValues>;
  resourceType: ResourceType;
  createMode?: boolean; // true = create/upload, false = edit
  onCancel: () => void;
  onSubmit: (data: FormData | Partial<FormValues>) => Promise<void>;
  submitLabel?: string;
  loading?: boolean;
}

const AcademicResourceForm: React.FC<Props> = ({
  initialValues = {},
  resourceType,
  createMode = false,
  onCancel,
  onSubmit,
  submitLabel,
  loading = false,
}) => {
  const [formData, setFormData] = useState<FormValues>({
    title: initialValues.title || "",
    description: initialValues.description || "",
    course: initialValues.course || "",
    subject: initialValues.subject || "",
    semester: initialValues.semester || "",
    academicYear: initialValues.academicYear || "",
    degreeType: initialValues.degreeType || "",
    tags: Array.isArray((initialValues as any).tags)
      ? (initialValues as any).tags.join(",")
      : (initialValues.tags as string) || "",
    fileUrl: initialValues.fileUrl || "",
  });

  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      title: initialValues.title || "",
      description: initialValues.description || "",
      course: initialValues.course || "",
      subject: initialValues.subject || "",
      semester: initialValues.semester || "",
      academicYear: initialValues.academicYear || "",
      degreeType: initialValues.degreeType || "",
      tags: Array.isArray((initialValues as any).tags)
        ? (initialValues as any).tags.join(",")
        : (initialValues.tags as string) || "",
      fileUrl: initialValues.fileUrl || "",
    }));
    // reset file selection when initial changes
    setFile(null);
  }, [initialValues]);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target as HTMLInputElement;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
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
        toast.error("Invalid file type for this resource type.");
        return;
      }

      if (selectedFile.size > 50 * 1024 * 1024) {
        toast.error("File size must be less than 50MB.");
        return;
      }

      setFile(selectedFile);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // basic validation
    if (createMode && !file && !formData.fileUrl) {
      toast.error("Please provide a file or file URL.");
      return;
    }

    if (!formData.title || !formData.course || !formData.academicYear) {
      toast.error("Title, Course and Academic Year are required.");
      return;
    }

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
      setSubmitting(true);

      if (createMode) {
        const fd = new FormData();
        if (file) fd.append("file", file);
        else if (formData.fileUrl) fd.append("fileUrl", formData.fileUrl);

        fd.append("title", formData.title);
        if (formData.description)
          fd.append("description", formData.description);
        fd.append("course", formData.course);
        if (formData.subject) fd.append("subject", formData.subject);
        if (formData.semester) fd.append("semester", formData.semester);
        if (formData.academicYear)
          fd.append("academicYear", formData.academicYear);
        if (formData.degreeType) fd.append("degreeType", formData.degreeType);

        if (formData.tags) {
          const tagsArray = formData.tags
            .split(",")
            .map((t) => t.trim())
            .filter((t) => t);
          fd.append("tags", JSON.stringify(tagsArray));
        }

        // For question papers derive examYear from academicYear if possible
        if (resourceType === "questionPapers" && formData.academicYear) {
          const match = formData.academicYear.match(/^(\d{4})-\d{4}$/);
          if (match) {
            fd.append("examYear", match[1]);
          }
        }

        await onSubmit(fd);
      } else {
        // edit mode - send a plain object with changed values
        const payload: any = {
          title: formData.title,
          description: formData.description || undefined,
          course: formData.course || undefined,
          subject: formData.subject || undefined,
          semester: formData.semester || undefined,
          academicYear: formData.academicYear || undefined,
          degreeType: formData.degreeType || undefined,
        };

        if (formData.tags) {
          const tagsArray = formData.tags
            .split(",")
            .map((t) => t.trim())
            .filter((t) => t);
          payload.tags = JSON.stringify(tagsArray);
        }

        if (resourceType === "questionPapers" && formData.academicYear) {
          const match = formData.academicYear.match(/^(\d{4})-\d{4}$/);
          if (match) payload.examYear = parseInt(match[1]);
        }

        // if a fileUrl was provided in edit, include it
        if (formData.fileUrl) payload.fileUrl = formData.fileUrl;

        await onSubmit(payload);
      }
    } catch (err) {
      console.error("Submit error:", err);
      toast.error("Failed to submit. Please try again.");
      throw err;
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-4">
      {/* File Selection */}
      {createMode && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Choose one: Upload File or Provide URL
          </label>
          <div className="space-y-4">
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
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:bg-gray-100"
                placeholder="Enter file URL (e.g., Google Drive link)"
              />
            </div>

            <div className="flex items-center">
              <div className="flex-1 border-t border-gray-300 dark:border-gray-600"></div>
              <div className="mx-4 text-sm text-gray-500">OR</div>
              <div className="flex-1 border-t border-gray-300 dark:border-gray-600"></div>
            </div>

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
                  id="file-upload-edit"
                  accept={
                    resourceType === "timetables"
                      ? ".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                      : ".pdf,.doc,.docx,.ppt,.pptx,.txt"
                  }
                  disabled={formData.fileUrl !== ""}
                />
                <label
                  htmlFor="file-upload-edit"
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
      )}

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
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          placeholder="e.g., Computer Science"
          required
        />
      </div>

      {/* Subject */}
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
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            placeholder="e.g., Data Structures"
            required={resourceType === "questionPapers"}
          />
        </div>
      )}

      {/* Degree Type */}
      {resourceType === "questionPapers" && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Degree Type
          </label>
          <select
            name="degreeType"
            value={formData.degreeType}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
            if (!/^[\d-]*$/.test(value)) return;
            handleInputChange(e as any);
          }}
          onBlur={(e) => {
            const value = e.target.value;
            if (value && !/^\d{4}-\d{4}$/.test(value)) {
              toast.error(
                "Please enter academic year in YYYY-YYYY format (e.g., 2023-2024)"
              );
            } else if (value) {
              const [startYear, endYear] = value.split("-").map(Number);
              if (startYear < 2000)
                toast.error("Academic year must be after 2000");
              else if (endYear !== startYear + 1)
                toast.error("End year should be one year after start year");
            }
          }}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          placeholder="e.g., 2023-2024"
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
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
                <strong>Teacher Permission Required:</strong> Only users with
                teacher role can upload {resourceType}.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Buttons */}
      <div className="flex justify-end gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting || loading}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors flex items-center gap-2"
        >
          {submitting || loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              {submitLabel || (createMode ? "Upload" : "Save")}
            </>
          ) : (
            <>
              <Upload className="w-4 h-4" />
              {submitLabel || (createMode ? "Upload" : "Save")}
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export default AcademicResourceForm;
