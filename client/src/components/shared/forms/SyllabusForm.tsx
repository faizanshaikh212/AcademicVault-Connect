import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import UploadZone from "../UploadZone";
import coursesService from "../../../services/courses.service";

interface Props {
  initialValues?: any;
  createMode?: boolean;
  onCancel: () => void;
  onSubmit: (data: FormData | any) => Promise<void>;
  submitLabel?: string;
  loading?: boolean;
}

const SyllabusForm: React.FC<Props> = ({
  initialValues = {},
  createMode = false,
  onCancel,
  onSubmit,
  submitLabel,
  loading = false,
}) => {
  // Map resource fields to form fields
  const getInitialCourseId = () => {
    if (initialValues.courseId) return initialValues.courseId;
    if (
      initialValues.course &&
      typeof initialValues.course === "object" &&
      initialValues.course._id
    ) {
      return initialValues.course._id;
    }
    // If course is a string, we need to find the matching course from the courses list
    // This will be handled in useEffect after courses are loaded
    return "";
  };

  const getInitialSemesterId = () => {
    if (initialValues.semesterId) return initialValues.semesterId;
    if (
      initialValues.semester &&
      typeof initialValues.semester === "object" &&
      initialValues.semester._id
    ) {
      return initialValues.semester._id;
    }
    // If semester is a string, we need to find the matching semester from the semesters list
    // This will be handled in useEffect after semesters are loaded
    return "";
  };

  const [title, setTitle] = useState(initialValues.title || "");
  const [description, setDescription] = useState(
    initialValues.description || ""
  );
  const [courseId, setCourseId] = useState(getInitialCourseId());
  const [courses, setCourses] = useState<any[]>([]);
  const [semesters, setSemesters] = useState<any[]>([]);
  // If the initial data had a plain course string (no id) keep it as fallback
  const [courseFallback] = useState(
    typeof initialValues.course === "string" ? initialValues.course : ""
  );
  const [year, setYear] = useState(
    initialValues.academicYear || initialValues.year || ""
  );
  const [isApproved, setIsApproved] = useState(
    createMode ? true : initialValues.isApproved || false // Default to Approved for new uploads
  );
  const [file, setFile] = useState<File | null>(null);
  const [fileUrl, setFileUrl] = useState(initialValues.fileUrl || "");
  const [submitting, setSubmitting] = useState(false);
  const [semesterId, setSemesterId] = useState(getInitialSemesterId());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (!title.trim()) {
      toast.error("Title is required.");
      return;
    }
    if (!courseId) {
      toast.error("Course selection is required.");
      return;
    }
    if (!year.trim()) {
      toast.error("Academic Year is required.");
      return;
    }
    if (createMode && !file && !fileUrl.trim()) {
      toast.error("Please provide a file or a file URL.");
      return;
    }
    setSubmitting(true);
    try {
      if (createMode) {
        const fd = new FormData();
        if (file) fd.append("file", file);
        else fd.append("fileUrl", String(fileUrl));
        fd.append("title", String(title));
        if (description) fd.append("description", String(description));
        // derive human-readable course/semester
        const selectedCourse = courses.find((c) => c._id === courseId);
        const selectedSemester = semesters.find((s) => s._id === semesterId);
        fd.append(
          "course",
          String(
            (selectedCourse && (selectedCourse.title || selectedCourse.name)) ||
              courseFallback ||
              courseId
          )
        );
        if (selectedSemester)
          fd.append(
            "semester",
            String(
              selectedSemester.title ||
                selectedSemester.name ||
                selectedSemester.number
            )
          );
        if (year) fd.append("academicYear", String(year));
        fd.append("isApproved", String(isApproved));
        await onSubmit(fd);
      } else {
        const payload: any = {
          title,
          description,
          courseId,
          academicYear: year,
          isApproved,
        };

        // Add semester - empty string for "All Semesters", or specific semester name
        if (semesterId === "") {
          // "All Semesters" selected - send empty string to clear semester field
          payload.semester = "";
        } else {
          const selectedSemester = semesters.find((s) => s._id === semesterId);
          if (selectedSemester) {
            payload.semester = String(
              selectedSemester.title ||
                selectedSemester.name ||
                selectedSemester.number
            );
          }
        }

        if (fileUrl) payload.fileUrl = fileUrl;
        await onSubmit(payload);
      }
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await coursesService.listCourses();
        if (!mounted) return;
        const loadedCourses = (res as any).data || [];
        setCourses(loadedCourses);

        // If we have a course string in initialValues, find the matching course ID
        if (
          initialValues.course &&
          typeof initialValues.course === "string" &&
          !courseId
        ) {
          const matchingCourse = loadedCourses.find(
            (c: any) =>
              c.title === initialValues.course ||
              c.name === initialValues.course ||
              c._id === initialValues.course
          );
          if (matchingCourse) {
            setCourseId(matchingCourse._id);
          }
        }
      } catch (err) {
        console.error("Failed to load course data", err);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Load semesters when courseId changes
  useEffect(() => {
    if (!courseId) {
      setSemesters([]);
      setSemesterId(""); // Reset semester when course is cleared
      return;
    }

    let mounted = true;
    (async () => {
      try {
        const s = await coursesService.listSemestersForCourse(courseId);
        if (!mounted) return;
        const loadedSemesters = (s as any).data || [];
        setSemesters(loadedSemesters);

        // Only try to match semester if we have initial values
        if (
          initialValues.semester &&
          typeof initialValues.semester === "string" &&
          !semesterId
        ) {
          // Check if it's "All Semesters" (empty or common indicators)
          if (
            !initialValues.semester.trim() ||
            initialValues.semester.toLowerCase() === "all semesters" ||
            initialValues.semester.toLowerCase() === "all"
          ) {
            // Keep semesterId as empty string for "All Semesters"
            setSemesterId("");
          } else {
            // Try to find matching semester
            const matchingSemester = loadedSemesters.find(
              (s: any) =>
                s.title === initialValues.semester ||
                s.name === initialValues.semester ||
                s.number?.toString() === initialValues.semester ||
                s._id === initialValues.semester
            );
            if (matchingSemester) {
              setSemesterId(matchingSemester._id);
            } else {
              // If no match found, assume it's "All Semesters"
              setSemesterId("");
            }
          }
        } else if (courseId !== getInitialCourseId()) {
          // If course changed, reset semester
          setSemesterId("");
        }
      } catch (err) {
        console.error("Failed to load semester data", err);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [courseId]); // Removed semesterId from dependencies to avoid infinite loops

  return (
    <form onSubmit={handleSubmit} className="p-6">
      <div className="bg-white dark:bg-zinc-800/60 dark:border dark:border-zinc-700 rounded-lg shadow-sm p-4 space-y-4">
        <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          <span className="font-medium">* Required fields</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
              Title *
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 block w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-slate-100 dark:placeholder:text-zinc-500"
              aria-required
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
              Course *
            </label>
            <select
              value={courseId}
              onChange={(e) => {
                setCourseId(e.target.value);
                setSemesterId(""); // Reset semester when course changes
              }}
              className="mt-1 block w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-slate-100 dark:placeholder:text-zinc-500"
              required
            >
              <option value="">Select Course</option>
              {courses.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.title || c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-1 block w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-slate-100 dark:placeholder:text-zinc-500"
            rows={4}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
              Academic Year *
            </label>
            <input
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="mt-1 block w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-slate-100 dark:placeholder:text-zinc-500"
              placeholder="e.g., 2023-2024"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
              Semester (optional)
            </label>
            <select
              key={`semester-${courseId}`} // Force re-render when course changes
              value={semesterId}
              onChange={(e) => setSemesterId(e.target.value)}
              className="mt-1 block w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-slate-100 dark:placeholder:text-zinc-500"
            >
              <option value="">All Semesters</option>
              {semesters.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.title || s.name || s.number}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
              File URL (optional)
            </label>
            <input
              value={fileUrl}
              onChange={(e) => setFileUrl(e.target.value)}
              className="mt-1 block w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-slate-100 dark:placeholder:text-zinc-500"
              placeholder="https://example.com/file.pdf"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
              Status
            </label>
            <select
              value={isApproved ? "Approved" : "In Review"}
              onChange={(e) => setIsApproved(e.target.value === "Approved")}
              className="mt-1 block w-full max-w-xs rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-slate-100"
            >
              <option value="Approved">Approved</option>
              <option value="In Review">In Review</option>
            </select>
          </div>
        </div>

        <UploadZone file={file} setFile={setFile} />

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-md border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-slate-200"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={submitting || loading}
            className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            {submitLabel || (createMode ? "Upload" : "Save")}
          </button>
        </div>
      </div>
    </form>
  );
};

export default SyllabusForm;
