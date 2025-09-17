import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { Clock } from "lucide-react";
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

const TimetableForm: React.FC<Props> = ({
  initialValues = {},
  createMode = false,
  onCancel,
  onSubmit,
  submitLabel,
  loading = false,
}) => {
  const [title, setTitle] = useState(initialValues.title || "");
  const [description, setDescription] = useState(
    initialValues.description || ""
  );
  const getInitialCourseId = () => {
    if (initialValues.courseId) return initialValues.courseId;
    if (
      initialValues.course &&
      typeof initialValues.course === "object" &&
      initialValues.course._id
    ) {
      return initialValues.course._id;
    }
    // Will try to resolve after courses are loaded
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
    return "";
  };

  const [courseId, setCourseId] = useState(getInitialCourseId());
  const [semesterId, setSemesterId] = useState(getInitialSemesterId());
  const [courses, setCourses] = useState<any[]>([]);
  const [semesters, setSemesters] = useState<any[]>([]);
  const [courseFallback] = useState(
    typeof initialValues.course === "string" ? initialValues.course : ""
  );
  const [type, setType] = useState(
    initialValues.timetableType || initialValues.type || ""
  );
  // For edit mode allow setting status (Approved / In for Review)
  const [status, setStatus] = useState(
    !createMode ? (initialValues.isApproved ? "Approved" : "In for Review") : ""
  );
  const [academicYear, setAcademicYear] = useState(
    initialValues.academicYear || ""
  );
  // Timetables only use isApproved boolean, no status string field
  const [file, setFile] = useState<File | null>(null);
  const [fileUrl, setFileUrl] = useState(initialValues.fileUrl || "");
  const [submitting, setSubmitting] = useState(false);

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
    if (!semesterId) {
      toast.error("Semester selection is required.");
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
        // derive human-readable names
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
        if (type) fd.append("timetableType", String(type));
        if (academicYear) fd.append("academicYear", String(academicYear));
        await onSubmit(fd);
      } else {
        const payload: any = {
          title,
          description,
          courseId,
          semesterId,
          timetableType: type,
          academicYear,
        };
        if (fileUrl) payload.fileUrl = fileUrl;
        // Include status in update payload so server can set isApproved accordingly
        if (status) payload.status = status;
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
        const coursesData = (res as any).data || [];
        setCourses(coursesData);

        // If editing, find the course ID based on the course name
        if (!createMode && initialValues.course) {
          const matchingCourse = coursesData.find(
            (c: any) =>
              c.title === initialValues.course ||
              c.name === initialValues.course ||
              c._id === initialValues.course
          );
          if (matchingCourse) {
            setCourseId(matchingCourse._id);
          }
        }

        // Load semesters for the selected course
        const currentCourseId =
          courseId ||
          coursesData.find(
            (c: any) =>
              c.title === initialValues.course ||
              c.name === initialValues.course ||
              c._id === initialValues.course
          )?._id;

        if (currentCourseId) {
          const s = await coursesService.listSemestersForCourse(
            currentCourseId
          );
          if (!mounted) return;
          const semestersData = (s as any).data || [];
          setSemesters(semestersData);

          // If editing, find the semester ID based on the semester name
          if (!createMode && initialValues.semester) {
            const matchingSemester = semestersData.find(
              (sem: any) =>
                sem.title === initialValues.semester ||
                sem.name === initialValues.semester ||
                sem.number === initialValues.semester ||
                sem._id === initialValues.semester
            );
            if (matchingSemester) {
              setSemesterId(matchingSemester._id);
            }
          }
        }
      } catch (err) {
        console.error("Failed to load course data", err);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [courseId, createMode, initialValues.course, initialValues.semester]);

  return (
    <form onSubmit={handleSubmit} className="p-6">
      <div className="bg-white dark:bg-zinc-800/60 dark:border dark:border-zinc-700 rounded-lg shadow-sm p-4 space-y-4">
        <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          <span className="font-medium">* Required fields</span>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
            Title *
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 block w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-slate-100"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-1 block w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-slate-100"
            rows={4}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
              Course *
            </label>
            <select
              value={courseId}
              onChange={(e) => {
                setCourseId(e.target.value);
                setSemesterId("");
              }}
              className="mt-1 block w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-slate-100"
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
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
              Semester *
            </label>
            <select
              value={semesterId}
              onChange={(e) => setSemesterId(e.target.value)}
              disabled={!courseId}
              className="mt-1 block w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-slate-100"
              required
            >
              <option value="">Select Semester</option>
              {semesters.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.title || s.name || s.number}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
            Academic Year *
          </label>
          <input
            value={academicYear}
            onChange={(e) => setAcademicYear(e.target.value)}
            className="mt-1 block w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-slate-100"
            placeholder="e.g., 2023-2024"
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
              Type
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="mt-1 block w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-slate-100"
            >
              <option value="Regular">Regular</option>
              <option value="Exam">Exam</option>
              <option value="Special">Special</option>
              <option value="Holiday">Holiday</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
              File URL
            </label>
            <input
              value={fileUrl}
              onChange={(e) => setFileUrl(e.target.value)}
              className="mt-1 block w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-slate-100"
            />
          </div>
        </div>

        {/* Show Status selection in edit mode so teachers/admins can change approval */}
        {!createMode && (
          <div className="mt-3">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="mt-1 block w-48 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-slate-100"
            >
              <option value="Approved">Approved</option>
              <option value="In for Review">In for Review</option>
            </select>
          </div>
        )}

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
            <Clock className="inline w-4 h-4 mr-2 align-middle" />
            {submitLabel || (createMode ? "Upload" : "Save")}
          </button>
        </div>
      </div>
    </form>
  );
};

export default TimetableForm;
