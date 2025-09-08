import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { FileText } from "lucide-react";
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

const QuestionPaperForm: React.FC<Props> = ({
  initialValues = {},
  createMode = false,
  onCancel,
  onSubmit,
  submitLabel,
  loading = false,
}) => {
  const [courseId, setCourseId] = useState(initialValues.courseId || "");
  const [semesterId, setSemesterId] = useState(initialValues.semesterId || "");
  const [subjectId, setSubjectId] = useState(initialValues.subjectId || "");
  const [year, setYear] = useState(
    initialValues.year || initialValues.examYear || ""
  );
  const [month, setMonth] = useState(initialValues.month || "");
  const [file, setFile] = useState<File | null>(null);
  const [fileUrl, setFileUrl] = useState(initialValues.fileUrl || "");
  const [courses, setCourses] = useState<any[]>([]);
  const [semesters, setSemesters] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const c = await coursesService.listCourses();
        if (!mounted) return;
        setCourses((c as any).data || []);
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

  const handleCourseChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCourseId(e.target.value);
    setSemesterId("");
    setSubjectId("");
  };

  const handleSemesterChange = async (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const sid = e.target.value;
    setSemesterId(sid);
    setSubjectId("");
    try {
      const res = await coursesService.listSubjectsForSemester(sid);
      setSubjects((res as any).data || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load subjects");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (createMode && !file && !fileUrl) {
      toast.error("Please provide a file or URL");
      return;
    }
    if (!courseId) {
      toast.error("Course required");
      return;
    }
    if (!semesterId) {
      toast.error("Semester required");
      return;
    }
    if (!subjectId) {
      toast.error("Subject required");
      return;
    }
    if (!year) {
      toast.error("Year required");
      return;
    }
    if (!month) {
      toast.error("Month required");
      return;
    }

    setSubmitting(true);
    try {
      if (createMode) {
        const fd = new FormData();
        if (file) fd.append("file", file);
        else fd.append("fileUrl", String(fileUrl));

        // Derive human-readable names if possible
        const selectedCourse = courses.find((c) => c._id === courseId);
        const selectedSemester = semesters.find((s) => s._id === semesterId);
        const selectedSubject = subjects.find((s) => s._id === subjectId);

        fd.append(
          "course",
          String(
            (selectedCourse && (selectedCourse.title || selectedCourse.name)) ||
              courseId
          )
        );
        fd.append(
          "semester",
          String(
            (selectedSemester &&
              (selectedSemester.title ||
                selectedSemester.name ||
                selectedSemester.number)) ||
              semesterId
          )
        );
        fd.append(
          "subject",
          String(
            (selectedSubject &&
              (selectedSubject.title || selectedSubject.name)) ||
              subjectId
          )
        );
        fd.append("year", String(year));
        fd.append("month", String(month));

        // examYear
        fd.append("examYear", String(year));

        await onSubmit(fd);
      } else {
        const payload = { courseId, semesterId, subjectId, year, month };
        await onSubmit(payload);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6">
      <div className="bg-white dark:bg-zinc-800/60 dark:border dark:border-zinc-700 rounded-lg shadow-sm p-4 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
              Course *
            </label>
            <select
              value={courseId}
              onChange={handleCourseChange}
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
              Semester *
            </label>
            <select
              value={semesterId}
              onChange={handleSemesterChange}
              className="mt-1 block w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-slate-100"
              disabled={!courseId}
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
            Subject *
          </label>
          <select
            value={subjectId}
            onChange={(e) => setSubjectId(e.target.value)}
            className="mt-1 block w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-slate-100"
            disabled={!semesterId}
          >
            <option value="">Select Subject</option>
            {subjects.map((s) => (
              <option key={s._id} value={s._id}>
                {s.title || s.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
              Year *
            </label>
            <input
              type="number"
              min={2000}
              max={2100}
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="mt-1 block w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-slate-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
              Month *
            </label>
            <select
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="mt-1 block w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-slate-100"
            >
              <option value="">Select Month</option>
              {[
                "January",
                "February",
                "March",
                "April",
                "May",
                "June",
                "July",
                "August",
                "September",
                "October",
                "November",
                "December",
              ].map((m) => (
                <option key={m} value={m}>
                  {m}
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
            <FileText className="inline w-4 h-4 mr-2 align-middle" />
            {submitLabel || (createMode ? "Upload" : "Save")}
          </button>
        </div>
      </div>
    </form>
  );
};

export default QuestionPaperForm;
