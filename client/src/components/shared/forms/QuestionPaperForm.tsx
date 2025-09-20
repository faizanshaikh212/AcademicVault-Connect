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

  const getInitialSubjectId = () => {
    if (initialValues.subjectId) return initialValues.subjectId;
    if (
      initialValues.subject &&
      typeof initialValues.subject === "object" &&
      initialValues.subject._id
    ) {
      return initialValues.subject._id;
    }
    // If subject is a string, we need to find the matching subject from the subjects list
    // This will be handled in useEffect after subjects are loaded
    return "";
  };

  const [courseId, setCourseId] = useState(getInitialCourseId());
  const [semesterId, setSemesterId] = useState(getInitialSemesterId());
  const [subjectId, setSubjectId] = useState(getInitialSubjectId());
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
  const [status, setStatus] = useState(() => {
    // For edit mode, show current status from the database
    if (!createMode) {
      // Map database status to display format
      if (initialValues.status) {
        const dbStatus = initialValues.status.toLowerCase();
        if (dbStatus === "approved") return "Approved";
        if (dbStatus === "pending") return "In for Review";
        if (dbStatus === "rejected") return "Disapproved";
      }
      // Fallback to isApproved field
      return initialValues.isApproved ? "Approved" : "In for Review";
    }
    // For create mode, default based on user role
    return (initialValues.uploader?.role?.includes("teacher") || initialValues.uploader?.role?.includes("admin"))
      ? "Approved"
      : "In for Review";
  });

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const c = await coursesService.listCourses();
        if (!mounted) return;
        // Handle new response format
        const loadedCourses = c?.data || c || [];
        const coursesData = Array.isArray(loadedCourses) ? loadedCourses : [];
        setCourses(coursesData);

        // If we have a course string in initialValues, find the matching course ID
        if (
          initialValues.course &&
          typeof initialValues.course === "string" &&
          !courseId
        ) {
          const matchingCourse = coursesData.find(
            (course: any) =>
              course.title === initialValues.course ||
              course.name === initialValues.course ||
              course._id === initialValues.course
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
      setSubjects([]);
      return;
    }

    let mounted = true;
    (async () => {
      try {
        const s = await coursesService.listSemestersForCourse(courseId);
        if (!mounted) return;
        // Handle new response format
        const loadedSemesters = s?.data || s || [];
        const semestersData = Array.isArray(loadedSemesters)
          ? loadedSemesters
          : [];
        setSemesters(semestersData);

        // If we have a semester string in initialValues, find the matching semester ID
        if (
          initialValues.semester &&
          typeof initialValues.semester === "string" &&
          !semesterId
        ) {
          const matchingSemester = semestersData.find(
            (semester: any) =>
              semester.title === initialValues.semester ||
              semester.name === initialValues.semester ||
              semester.number?.toString() === initialValues.semester ||
              semester._id === initialValues.semester
          );
          if (matchingSemester) {
            setSemesterId(matchingSemester._id);
          }
        }
      } catch (err) {
        console.error("Failed to load semester data", err);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [courseId, initialValues.semester, semesterId]);

  // Load subjects when semesterId changes
  useEffect(() => {
    if (!semesterId) {
      setSubjects([]);
      return;
    }

    let mounted = true;
    (async () => {
      try {
        const sub = await coursesService.listSubjectsForSemester(semesterId);
        if (!mounted) return;
        // Handle new response format
        const loadedSubjects = sub?.data || sub || [];
        const subjectsData = Array.isArray(loadedSubjects)
          ? loadedSubjects
          : [];
        setSubjects(subjectsData);

        // If we have a subject string in initialValues, find the matching subject ID
        if (
          initialValues.subject &&
          typeof initialValues.subject === "string" &&
          !subjectId
        ) {
          const matchingSubject = subjectsData.find(
            (subject: any) =>
              subject.title === initialValues.subject ||
              subject.name === initialValues.subject ||
              subject._id === initialValues.subject
          );
          if (matchingSubject) {
            setSubjectId(matchingSubject._id);
          }
        }
      } catch (err) {
        console.error("Failed to load subject data", err);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [semesterId, initialValues.subject, subjectId]);

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
      // Handle new response format
      const subjectsData = res?.data || res || [];
      setSubjects(Array.isArray(subjectsData) ? subjectsData : []);
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
        fd.append("status", String(status));

        await onSubmit(fd);
      } else {
        // For edit mode, include both the raw IDs and the human-readable
        // course/semester/subject strings so the server's update handler
        // (which updates the string fields `course`, `semester`, `subject`)
        // receives the correct values. This prevents stale display in
        // management views which rely on those string fields.
        const selectedCourse = courses.find((c) => c._id === courseId);
        const selectedSemester = semesters.find((s) => s._id === semesterId);
        const selectedSubject = subjects.find((s) => s._id === subjectId);

        const payload: any = {
          courseId,
          semesterId,
          subjectId,
          year,
          month,
          status,
          // human-readable fallbacks
          course:
            (selectedCourse && (selectedCourse.title || selectedCourse.name)) ||
            courseId,
          semester:
            (selectedSemester &&
              (selectedSemester.title ||
                selectedSemester.name ||
                selectedSemester.number)) ||
            semesterId,
          subject:
            (selectedSubject &&
              (selectedSubject.title || selectedSubject.name)) ||
            subjectId,
          // Keep examYear in sync with 'year' to update canonical examYear used
          // by various views (management lists prefer examYear)
          examYear: year,
        };
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

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
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

          {!createMode && (
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
                <option value="Disapproved">Disapproved</option>
              </select>
            </div>
          )}

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
