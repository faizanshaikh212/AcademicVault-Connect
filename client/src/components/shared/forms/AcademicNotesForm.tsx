import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { BookOpen } from "lucide-react";
import UploadZone from "../UploadZone";
import coursesService from "../../../services/courses.service";
import { useRole } from "../../../contexts/RoleContext";

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
  const [courses, setCourses] = useState<any[]>([]);
  const [semesters, setSemesters] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [courseFallback] = useState(
    typeof initialValues.course === "string" ? initialValues.course : ""
  );
  const [academicYear, setAcademicYear] = useState(
    initialValues.academicYear ||
    initialValues.year ||
    new Date().getFullYear().toString()
  );
  const { getAcademicNoteDefaults } = useRole();
  const noteDefaults = getAcademicNoteDefaults();

  const [type, setType] = useState(() => {
    if (!createMode) {
      // For edit mode, use existing value
      return initialValues.type || noteDefaults.type;
    }
    // For create mode, use role-based defaults
    return noteDefaults.type;
  });

  const [status, setStatus] = useState(() => {
    if (!createMode) {
      // For edit mode, show current status from the database
      return (
        initialValues.status ||
        (initialValues.isApproved ? "Approved" : "In for Review")
      );
    }
    // For create mode, use role-based defaults
    return noteDefaults.status;
  });
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
    if (!description.trim()) {
      toast.error("Description is required.");
      return;
    }
    if (!courseId) {
      toast.error("Course selection is required.");
      return;
    }
    if (!subjectId) {
      toast.error("Subject selection is required.");
      return;
    }
    if (!academicYear) {
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
        fd.append("academicYear", String(academicYear));
        // Do NOT send type/status from client when creating a new note.
        // Server will determine defaults based on authenticated user's roles
        // (teacher -> Official/Approved, student -> Unofficial/In for Review).
        await onSubmit(fd);
      } else {
        const payload: any = {
          title,
          description,
          courseId,
          semesterId,
          subjectId,
          academicYear,
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
      setSubjects([]);
      return;
    }

    let mounted = true;
    (async () => {
      try {
        const s = await coursesService.listSemestersForCourse(courseId);
        if (!mounted) return;
        const loadedSemesters = (s as any).data || [];
        setSemesters(loadedSemesters);

        // If we have a semester string in initialValues, find the matching semester ID
        if (
          initialValues.semester &&
          typeof initialValues.semester === "string" &&
          !semesterId
        ) {
          const matchingSemester = loadedSemesters.find(
            (s: any) =>
              s.title === initialValues.semester ||
              s.name === initialValues.semester ||
              s.number?.toString() === initialValues.semester ||
              s._id === initialValues.semester
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
        const loadedSubjects = (sub as any).data || [];
        setSubjects(loadedSubjects);

        // If we have a subject string in initialValues, find the matching subject ID
        if (
          initialValues.subject &&
          typeof initialValues.subject === "string" &&
          !subjectId
        ) {
          const matchingSubject = loadedSubjects.find(
            (s: any) =>
              s.title === initialValues.subject ||
              s.name === initialValues.subject ||
              s._id === initialValues.subject
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
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
            Description *
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-1 block w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-slate-100"
            rows={4}
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
              Course *
            </label>
            <select
              value={courseId}
              onChange={(e) => {
                setCourseId(e.target.value);
                setSemesterId("");
                setSubjectId("");
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
              Subject *
            </label>
            <select
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              disabled={!semesterId}
              className="mt-1 block w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-slate-100"
              required
            >
              <option value="">Select Subject</option>
              {subjects.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.title || s.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
              Academic Year *
            </label>
            <input
              type="number"
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
              placeholder="2024"
              className="mt-1 block w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-slate-100"
              required
            />
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
            <>
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
            </>
          )}
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
