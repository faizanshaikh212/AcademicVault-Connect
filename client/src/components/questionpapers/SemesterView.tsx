import React, { useEffect, useState } from "react";
import { QuestionPaper } from "../../types/academic";
import SubjectTableView from "./SubjectTableView";
import coursesService from "../../services/courses.service";
import { questionPapersService } from "../../services/academicService";
import { FileText } from "lucide-react";

interface Props {
  degreeType: string;
  course: string;
  initialSelectedSemester?: string;
  // Optional key that parent can bump to force re-fetch of semesters/papers
  refreshKey?: number;
  // onSemesterSelect will receive raw semester id and human label: (rawId, label)
  onSemesterSelect?: (rawId: string, label: string) => void;
  onView?: (paper: any) => void;
  onEdit?: (paper: any) => void;
  currentUserId?: string;
}

const SemesterView: React.FC<Props> = ({
  degreeType,
  course,
  initialSelectedSemester,
  refreshKey,
  onSemesterSelect,
  onView,
  onEdit,
  currentUserId,
}) => {
  const [semesters, setSemesters] = useState<any[]>([]);
  const [selectedSemester, setSelectedSemester] = useState<string>(
    initialSelectedSemester || ""
  );
  const [papersBySemester, setPapersBySemester] = useState<
    Record<string, QuestionPaper[]>
  >({});
  const [loading, setLoading] = useState<boolean>(true);
  const [subjectsBySemester, setSubjectsBySemester] = useState<
    Record<string, any[]>
  >({});

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    (async () => {
      try {
        // resolve course id if the provided course looks like a label
        let courseId = course;
        const looksLikeId = /^[0-9a-fA-F]{24}$/.test(String(course || ""));
        if (!looksLikeId) {
          try {
            const all: any = await coursesService.listCourses();
            const items: any[] = all?.data || [];
            const found = items.find((c) => {
              const label = (c.title || c.name || c.course || "").toString();
              return label.toLowerCase() === String(course || "").toLowerCase();
            });
            if (found && found._id) courseId = found._id;
          } catch (e) {
            // ignore
          }
        }

        // Fetch authoritative semesters for this course (if available)
        if (courseId) {
          try {
            const res: any = await coursesService.listSemestersForCourse(
              courseId
            );
            if (!mounted) return;
            setSemesters(Array.isArray(res?.data) ? res.data : []);

            // fetch subjects for each semester
            const subjMap: Record<string, any[]> = {};
            await Promise.all(
              (res?.data || []).map(async (s: any) => {
                try {
                  const semId = String(s._id || s);
                  const r: any = await coursesService.listSubjectsForSemester(
                    semId
                  );
                  subjMap[semId] = Array.isArray(r?.data) ? r.data : [];
                } catch (e) {
                  subjMap[String(s._id || s)] = [];
                }
              })
            );
            if (mounted) setSubjectsBySemester(subjMap);
          } catch (e) {
            // ignore
            if (mounted) {
              setSemesters([]);
              setSubjectsBySemester({});
            }
          }
        }

        // Fetch question papers grouped by semester from the API
        try {
          const qpRes: any =
            await questionPapersService.getQuestionPapersByCategory(
              degreeType,
              course
            );
          const data = qpRes?.data || {};

          if (data && typeof data === "object" && !Array.isArray(data)) {
            const mapped: Record<string, QuestionPaper[]> = {};
            Object.keys(data).forEach((k) => {
              mapped[k] = Array.isArray(data[k]) ? data[k] : [];
            });

            if (mounted) setPapersBySemester(mapped);

            // Also create a mapping by semester ObjectId for the papersByRawId
            const papersByRawIdMap: Record<string, QuestionPaper[]> = {};

            // If we have canonical semesters, map papers to their ObjectIds
            if (semesters && semesters.length > 0) {
              semesters.forEach((s: any, i: number) => {
                const rawId = String(s._id || s);
                let semesterLabel = (s.title || s.name || s.semester || "")
                  .toString()
                  .replace(/Auto[- ]generated\s*/i, "")
                  .trim();
                if (!semesterLabel || /^[0-9a-fA-F]{6,}$/.test(semesterLabel)) {
                  semesterLabel = `Semester ${i + 1}`;
                }

                // Find papers for this semester by matching the label
                const papersForSemester = mapped[semesterLabel] || [];
                papersByRawIdMap[rawId] = papersForSemester;
              });
            } else {
              // If no canonical semesters, use the semester names as both key and value
              Object.keys(mapped).forEach((semesterName) => {
                papersByRawIdMap[semesterName] = mapped[semesterName];
              });
            }
          } else {
            if (mounted) setPapersBySemester({});
          }
        } catch (e) {
          if (mounted) setPapersBySemester({});
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [degreeType, course, refreshKey]);

  // Keep internal selectedSemester in sync when parent changes initialSelectedSemester (deselect/select)
  useEffect(() => {
    const next = initialSelectedSemester || "";
    if (next !== selectedSemester) {
      setSelectedSemester(next);
    }
    // note: we intentionally do not call onSemesterSelect here to avoid loops; parent already manages history
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialSelectedSemester]);

  // helper: compute human label map for current semesters
  const buildLabelMap = () => {
    const idToLabel: Record<string, string> = {};
    const looksLikeObjectId = (v: string) => /^[0-9a-fA-F]{6,}$/.test(v);

    // If we have canonical semesters from coursesService, use them
    if (semesters && semesters.length > 0) {
      semesters.forEach((s: any, i: number) => {
        const id = String(s._id || s);
        let raw = (s.title || s.name || s.semester || "")
          .toString()
          .replace(/Auto[- ]generated\s*/i, "")
          .trim();
        if (!raw || looksLikeObjectId(raw)) raw = `Semester ${i + 1}`;
        idToLabel[id] = raw;
      });
      return idToLabel;
    }

    // Fallback: derive semesters from papersBySemester keys (labels)
    const paperKeys = Object.keys(papersBySemester || {});
    paperKeys.forEach((k, i) => {
      const id = String(k);
      const raw = k || `Semester ${i + 1}`;
      idToLabel[id] = raw;
    });
    return idToLabel;
  };

  const idToLabel = buildLabelMap();

  // visible data for child component (map rawId -> papers/subjects)
  const papersByRawId: Record<string, QuestionPaper[]> = {};

  // Map semester ObjectIds to papers
  if (semesters && semesters.length > 0) {
    semesters.forEach((s: any, i: number) => {
      const rawId = String(s._id || s);
      let semesterLabel = (s.title || s.name || s.semester || "")
        .toString()
        .replace(/Auto[- ]generated\s*/i, "")
        .trim();
      if (!semesterLabel || /^[0-9a-fA-F]{6,}$/.test(semesterLabel)) {
        semesterLabel = `Semester ${i + 1}`;
      }

      // Find papers for this semester by matching the label
      const papersForSemester = papersBySemester[semesterLabel] || [];
      papersByRawId[rawId] = papersForSemester;
    });
  } else {
    // If no canonical semesters, use the semester names as both key and value
    Object.keys(papersBySemester || {}).forEach((k) => {
      const raw = String(k);
      papersByRawId[raw] = papersBySemester[k] || [];
    });
  }
  const subjectsByRawId: Record<string, any[]> = {};
  Object.keys(subjectsBySemester || {}).forEach((k) => {
    const raw = String(k);
    subjectsByRawId[raw] = subjectsByRawId[raw] || [];
    subjectsByRawId[raw].push(...(subjectsBySemester[k] || []));
  });

  // (no-op) papers resolved via papersByRawId/idToLabel maps above; helper removed to avoid unused symbol

  // selectedSemester holds raw id (String(s._id) or raw key)
  const handleSemesterClick = (rawId: string) => {
    const newRaw = rawId;
    // compute next state (toggle)
    const next = selectedSemester === newRaw ? "" : newRaw;
    setSelectedSemester(next);
    const label = next ? idToLabel[next] || next : "";
    // Parent manages history; notify with raw id (or empty string when deselecting) and human label
    if (onSemesterSelect) onSemesterSelect(next, label);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  const handleView = (paper: QuestionPaper) => {
    if (onView) onView(paper as any);
  };

  if (selectedSemester) {
    const raw = String(selectedSemester);
    const label = idToLabel[raw] || raw;
    // Build subjects id->title map for this semester (keyed by raw id)
    const subjectsIdMapForRaw: { [id: string]: string } = {};
    const subjList = subjectsByRawId[raw] || [];
    subjList.forEach((s: any) => {
      if (s && typeof s === "object") {
        subjectsIdMapForRaw[String(s._id || s)] =
          s.title || s.name || String(s._id || s);
      } else {
        subjectsIdMapForRaw[String(s)] = String(s);
      }
    });

    return (
      <SubjectTableView
        // SubjectTableView expects keys to be strings; we provide the human label as the displayed semester but
        // keep internal grouping by subject titles. Provide papers keyed under the human label for rendering.
        papersBySemester={{ [label]: papersByRawId[raw] || [] }}
        subjectsBySemester={{
          [label]: (subjectsByRawId[raw] || []).map((s) => (s && s.title) || s),
        }}
        subjectsIdMap={{ [label]: subjectsIdMapForRaw }}
        onView={handleView}
        onEdit={onEdit}
        currentUserId={currentUserId}
      />
    );
  }

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-6">
        {semesters.length === 0 ? (
          // If no semesters are defined, show semesters from the question papers directly
          Object.keys(papersBySemester).length > 0 ? (
            Object.keys(papersBySemester).map((semesterName) => (
              <div
                key={semesterName}
                onClick={() => handleSemesterClick(semesterName)}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 border border-gray-200 dark:border-gray-700 cursor-pointer overflow-hidden group p-6 text-center"
              >
                <div className="flex flex-col items-center">
                  <div className="flex justify-center mb-4 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                    <FileText className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {semesterName}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {papersBySemester[semesterName]?.length || 0} papers
                    available
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center text-gray-600 dark:text-gray-400">
              <p>No semesters or question papers found for this course.</p>
              <p className="text-sm mt-2">
                Make sure papers are uploaded and approved by admin.
              </p>
            </div>
          )
        ) : (
          semesters.map((s: any, idx: number) => {
            const rawId = String(s._id || s);
            const label = idToLabel[rawId] || `Semester ${idx + 1}`;
            return (
              <div
                key={rawId}
                onClick={() => handleSemesterClick(rawId)}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 border border-gray-200 dark:border-gray-700 cursor-pointer overflow-hidden group p-6 text-center"
              >
                <div className="flex flex-col items-center">
                  <div className="flex justify-center mb-4 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                    <FileText className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {label}
                  </h3>
                  {s.description ? (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {s.description}
                    </p>
                  ) : (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Click to view papers
                    </p>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default SemesterView;
