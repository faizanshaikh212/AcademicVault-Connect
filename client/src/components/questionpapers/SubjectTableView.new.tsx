import React, { useState } from "react";
import { QuestionPaper } from "../../types/academic";
import {
  Eye,
  Edit,
  Calendar,
  FileText,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface Props {
  papersBySemester: { [semester: string]: QuestionPaper[] };
  subjectsBySemester?: { [semester: string]: string[] };
  // Optional mapping of semester -> { subjectId: subjectTitle }
  subjectsIdMap?: { [semester: string]: { [id: string]: string } };
  onView: (paper: QuestionPaper) => void;
  onEdit?: (paper: QuestionPaper) => void;
  currentUserId?: string;
}

const SubjectTableView: React.FC<Props> = ({
  papersBySemester,
  subjectsBySemester = {},
  subjectsIdMap = {},
  onView,
  onEdit,
  currentUserId,
}) => {
  const [expandedSubjects, setExpandedSubjects] = useState<Set<string>>(() => {
    // Auto-expand all subjects by default
    const allSubjects = new Set<string>();
    Object.keys(papersBySemester || {}).forEach((semester) => {
      const papers = papersBySemester[semester] || [];
      const subjects = [
        ...new Set(papers.map((p) => (p as any).subject || "General")),
      ];
      subjects.forEach((subject) => {
        allSubjects.add(`${semester}-${subject}`);
      });
    });
    return allSubjects;
  });
  const isTeacher = onEdit !== undefined;

  const toggleSubject = (subjectKey: string) => {
    const newExpanded = new Set(expandedSubjects);
    if (newExpanded.has(subjectKey)) {
      newExpanded.delete(subjectKey);
    } else {
      newExpanded.add(subjectKey);
    }
    setExpandedSubjects(newExpanded);
  };

  // Combine semester keys from papers and explicit subjects list
  const paperKeys = Object.keys(papersBySemester || {});
  const subjectKeys = Object.keys(subjectsBySemester || {});
  const allSemestersSet = new Set<string>([...paperKeys, ...subjectKeys]);
  const semestersSorted = Array.from(allSemestersSet).sort((a, b) => {
    if (a === "General") return 1;
    if (b === "General") return -1;
    // if semester labels are like "Semester 1", try to extract numeric suffix
    const extractNum = (s: string) => {
      const m = String(s).match(/(\d+)$/);
      return m ? parseInt(m[1], 10) : NaN;
    };
    const na = extractNum(a);
    const nb = extractNum(b);
    if (!isNaN(na) && !isNaN(nb)) return na - nb;
    if (!isNaN(na)) return -1;
    if (!isNaN(nb)) return 1;
    return String(a).localeCompare(String(b));
  });

  // Flatten into subject groups under each semester
  return (
    <div className="space-y-6">
      {semestersSorted.map((semester) => {
        const papers = papersBySemester[semester] || [];
        const declaredSubjects = subjectsBySemester?.[semester] || [];
        const idToTitleMap = subjectsIdMap?.[semester] || {};
        // group by subject title (always use a string title as key)
        const bySubject: { [subjectTitle: string]: QuestionPaper[] } = {};

        // normalize declared subjects into canonical titles and build a case-insensitive map
        const declaredTitles = (declaredSubjects || []).map((s: any) => {
          if (!s) return "General";
          if (typeof s === "string") return s.trim();
          // object
          return (
            s.title ||
            s.name ||
            s.subject ||
            (s._id ? String(s._id) : "General")
          )
            .toString()
            .trim();
        });

        const declNormMap: { [norm: string]: string } = {};
        declaredTitles.forEach((title) => {
          const norm = (title || "").toString().trim().toLowerCase();
          if (norm) declNormMap[norm] = title;
          if (!bySubject[title]) bySubject[title] = [];
        });

        const resolveSubjectTitle = (raw: any) => {
          if (!raw) return "General";
          // If raw is a string - normalize and match case-insensitively
          if (typeof raw === "string") {
            const trimmed = raw.trim();
            const norm = trimmed.toLowerCase();
            if (declNormMap[norm]) return declNormMap[norm];
            // if raw looks like an id, try id->title map
            if (idToTitleMap && idToTitleMap[raw]) return idToTitleMap[raw];
            return trimmed || raw;
          }
          // object form
          if (typeof raw === "object" && raw !== null) {
            const candidate = (
              raw.title ||
              raw.name ||
              raw.subject ||
              (raw._id ? idToTitleMap[raw._id] || String(raw._id) : "")
            )
              .toString()
              .trim();
            const norm = candidate.toLowerCase();
            if (declNormMap[norm]) return declNormMap[norm];
            return candidate || "General";
          }
          // fallback
          return "General";
        };

        papers.forEach((p) => {
          const subjTitle = resolveSubjectTitle((p as any).subject);
          if (!bySubject[subjTitle]) bySubject[subjTitle] = [];
          bySubject[subjTitle].push(p);
        });

        // Create subject cards instead of semester-based organization
        const subjectCards = Object.keys(bySubject).map((subject) => {
          const subjectKey = `${semester}-${subject}`;
          const isExpanded = expandedSubjects.has(subjectKey);
          const papers = bySubject[subject];

          return (
            <div
              key={subjectKey}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden transition-all duration-300 hover:shadow-xl hover:scale-[1.02]"
            >
              {/* Subject Header */}
              <div
                className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 px-6 py-4 border-b border-gray-200 dark:border-gray-700 cursor-pointer"
                onClick={() => toggleSubject(subjectKey)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                      <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {subject}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {papers.length} question paper
                        {papers.length !== 1 ? "s" : ""} available
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs font-medium rounded-full">
                      {semester}
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-gray-400 transition-transform duration-200" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400 transition-transform duration-200" />
                    )}
                  </div>
                </div>
              </div>

              {/* Papers Table - FIXED WITH PROPER BORDERS AND CENTERING */}
              <div
                className={`transition-all duration-300 ease-in-out ${
                  isExpanded ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                } overflow-hidden`}
              >
                <div className="p-6">
                  {papers.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No question papers found for this subject.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full border-collapse border border-gray-300 dark:border-gray-600">
                        <thead className="bg-gray-50 dark:bg-gray-900">
                          <tr>
                            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider border border-gray-300 dark:border-gray-600">
                              <div className="flex items-center justify-center space-x-1">
                                <Calendar className="w-4 h-4" />
                                <span>Year</span>
                              </div>
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider border border-gray-300 dark:border-gray-600">
                              Month
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider border border-gray-300 dark:border-gray-600">
                              Type
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider border border-gray-300 dark:border-gray-600">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-300 dark:divide-gray-600">
                          {papers.map((paper, index) => (
                            <tr
                              key={paper._id}
                              className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-150"
                              style={{ animationDelay: `${index * 50}ms` }}
                            >
                              <td className="px-4 py-4 whitespace-nowrap text-center border border-gray-300 dark:border-gray-600">
                                <div className="flex items-center justify-center space-x-2">
                                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                                    {(paper as any).year ||
                                      paper.examYear ||
                                      "-"}
                                  </span>
                                </div>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300 text-center border border-gray-300 dark:border-gray-600">
                                {(paper as any).month ||
                                  (paper as any).examMonth ||
                                  "-"}
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-center border border-gray-300 dark:border-gray-600">
                                <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs font-medium rounded-full">
                                  {paper.examType || "Final"}
                                </span>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-center border border-gray-300 dark:border-gray-600">
                                <div className="flex items-center justify-center space-x-3">
                                  <button
                                    onClick={() => onView(paper)}
                                    className="inline-flex items-center space-x-1 px-3 py-1.5 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900 dark:hover:bg-blue-800 text-blue-700 dark:text-blue-300 text-sm font-medium rounded-lg transition-colors duration-150"
                                  >
                                    <Eye className="w-4 h-4" />
                                    <span>View</span>
                                  </button>
                                  {isTeacher &&
                                    paper.uploader &&
                                    (paper.uploader as any)._id ===
                                      currentUserId && (
                                      <button
                                        onClick={() => onEdit!(paper)}
                                        className="inline-flex items-center space-x-1 px-3 py-1.5 bg-amber-100 hover:bg-amber-200 dark:bg-amber-900 dark:hover:bg-amber-800 text-amber-700 dark:text-amber-300 text-sm font-medium rounded-lg transition-colors duration-150"
                                      >
                                        <Edit className="w-4 h-4" />
                                        <span>Edit</span>
                                      </button>
                                    )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        });

        return (
          <div key={semester} className="space-y-4">
            {subjectCards}
          </div>
        );
      })}
    </div>
  );
};

export default SubjectTableView;
