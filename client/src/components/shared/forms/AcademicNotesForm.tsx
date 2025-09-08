import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { BookOpen } from "lucide-react";
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

const AcademicNotesForm: React.FC<Props> = ({
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
  const [courseId, setCourseId] = useState(initialValues.courseId || "");
  const [semesterId, setSemesterId] = useState(initialValues.semesterId || "");
  const [subjectId, setSubjectId] = useState(initialValues.subjectId || "");
  const [courses, setCourses] = useState<any[]>([]);
  const [semesters, setSemesters] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [courseFallback] = useState(
    typeof initialValues.course === "string" ? initialValues.course : ""
  );
  const [type, setType] = useState(
    initialValues.type ||
      (initialValues.uploader?.role?.includes("teacher")
        ? "Official"
        : "Unofficial")
  );
  const [status, setStatus] = useState(
    initialValues.status ||
      (initialValues.uploader?.role?.includes("teacher")
        ? "Approved"
        : "In for Review")
  );
  const [file, setFile] = useState<File | null>(null);
  const [fileUrl, setFileUrl] = useState(initialValues.fileUrl || "");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (createMode && !file && !fileUrl) {
      toast.error("Please provide a file or a file URL.");
      return;
    }
    if (!title) {
      toast.error("Title is required.");
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
        // resolve human readable names
        const selectedCourse = courses.find((c) => c._id === courseId);
        const selectedSemester = semesters.find((s) => s._id === semesterId);
        const selectedSubject = subjects.find((s) => s._id === subjectId);
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
        if (selectedSubject)
          fd.append(
            "subject",
            String(selectedSubject.title || selectedSubject.name)
          );
        fd.append("type", String(type));
        fd.append("status", String(status));
        await onSubmit(fd);
      } else {
        const payload: any = {
          title,
          description,
          courseId,
          semesterId,
          subjectId,
          type,
          status,
        };
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
        setCourses((res as any).data || []);
        if (courseId) {
          const s = await coursesService.listSemestersForCourse(courseId);
          if (!mounted) return;
          setSemesters((s as any).data || []);
        }
        if (semesterId) {
          const sub = await coursesService.listSubjectsForSemester(semesterId);
          if (!mounted) return;
          setSubjects((sub as any).data || []);
        }
      } catch (err) {
        console.error("Failed to load course data", err);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [courseId, semesterId]);

  return (
    <form onSubmit={handleSubmit} className="p-6">
      <div className="bg-white dark:bg-zinc-800/60 dark:border dark:border-zinc-700 rounded-lg shadow-sm p-4 space-y-4">
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

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
              Course
            </label>
            <select
              value={courseId}
              onChange={(e) => {
                setCourseId(e.target.value);
                setSemesterId("");
                setSubjectId("");
              }}
              className="mt-1 block w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-slate-100"
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
              Semester
            </label>
            <select
              value={semesterId}
              onChange={(e) => {
                setSemesterId(e.target.value);
                setSubjectId("");
              }}
              disabled={!courseId}
              className="mt-1 block w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-slate-100"
            >
              <option value="">Select Semester</option>
              {semesters.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.title || s.name || s.number}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
              Subject
            </label>
            <select
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              disabled={!semesterId}
              className="mt-1 block w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-slate-100"
            >
              <option value="">Select Subject</option>
              {subjects.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.title || s.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
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

          <div>
            <UploadZone file={file} setFile={setFile} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {!createMode && (
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="mt-1 block w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-slate-100"
              >
                <option value="Official">Official</option>
                <option value="Unofficial">Unofficial</option>
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="mt-1 block w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-slate-100"
            >
              <option value="Approved">Approved</option>
              <option value="In for Review">In for Review</option>
              <option value="Dissaproved">Dissaproved</option>
            </select>
          </div>
        </div>

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
            <BookOpen className="inline w-4 h-4 mr-2 align-middle" />
            {submitLabel || (createMode ? "Upload" : "Save")}
          </button>
        </div>
      </div>
    </form>
  );
};

export default AcademicNotesForm;
