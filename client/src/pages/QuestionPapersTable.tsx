/**
 * Question Papers Table View
 * Shows question papers in a table format organized by degree type and course
 */

import React, { useState, useEffect, useContext } from "react";
import { FileText, Search, Filter } from "lucide-react";
import { toast } from "react-hot-toast";
import { QuestionPaper } from "../types/academic";
import { questionPapersService } from "../services/academicService";
import { AuthContext } from "../context/AuthContext";
import QuestionPapersEditModal from "../components/shared/QuestionPapersEditModal";
import CategoriesView from "../components/questionpapers/CategoriesView";
import CoursesView from "../components/questionpapers/CoursesView";
import SemesterView from "../components/questionpapers/SemesterView";
import SubjectTableView from "../components/questionpapers/SubjectTableView";
import coursesService from "../services/courses.service";

interface QuestionPapersByCategory {
  [degreeType: string]: {
    [course: string]: {
      [semester: string]: QuestionPaper[];
    };
  };
}

const QuestionPapersTable: React.FC = () => {
  const auth = useContext(AuthContext);
  const isTeacher = auth?.user?.role?.includes("teacher") || auth?.user?.role?.includes("admin");

  const [currentView, setCurrentView] = useState<
    "categories" | "courses" | "table"
  >("categories");
  const [selectedDegreeType, setSelectedDegreeType] = useState<string>("");
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  // Track both raw semester id and human label
  const [selectedSemester, setSelectedSemester] = useState<string | null>(null);
  const [selectedSemesterLabel, setSelectedSemesterLabel] = useState<
    string | null
  >(null);
  const [selectedPaper, setSelectedPaper] = useState<QuestionPaper | null>(
    null
  );
  const [showEditModal, setShowEditModal] = useState(false);

  // course/semester/subject data will be managed by SemesterView
  const [availableCourses, setAvailableCourses] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchResults, setSearchResults] = useState<QuestionPaper[] | null>(
    null
  );
  const [searchLoading, setSearchLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [filterCourses, setFilterCourses] = useState<string[]>([]);
  const [filterSemesters, setFilterSemesters] = useState<string[]>([]);
  const [selectedCourseFilter, setSelectedCourseFilter] = useState("");
  const [selectedSemesterFilter, setSelectedSemesterFilter] = useState("");
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const resultsRef = React.useRef<HTMLDivElement | null>(null);

  // Degree type categories
  const degreeTypes = [
    {
      id: "BE",
      name: "Bachelor in Engineering (BE)",
      description: "Engineering question papers across all branches",
    },
    {
      id: "BSC",
      name: "Bachelor in Science (BSC)",
      description: "Science question papers for various specializations",
    },
    {
      id: "PG",
      name: "Post Graduate (PG)",
      description: "Masters and postgraduate program question papers",
    },
    {
      id: "Commerce",
      name: "Commerce (COM)",
      description: "Commerce and business studies question papers",
    },
  ];

  useEffect(() => {
    if (selectedDegreeType && currentView === "courses") {
      fetchCourses();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDegreeType, currentView]);

  useEffect(() => {
    if (selectedDegreeType && selectedCourse && currentView === "table") {
      fetchPapers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDegreeType, selectedCourse, currentView]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      // Try to load canonical courses from the courses service for this degree type
      try {
        const res = await coursesService.listCourses();
        const items: any[] = res?.data || [];
        // Filter by matching type/degreeType (support legacy degreeType field)
        const filtered = items
          .filter((c) => {
            const t = c.type || c.degreeType || (c.metadata && c.metadata.type);
            return (
              t === selectedDegreeType ||
              (t === "Commerce" && selectedDegreeType === "Commerce")
            );
          })
          .map((c) => c.title || c.name || c.course || c);

        if (filtered.length > 0) {
          setAvailableCourses(filtered);
        } else {
          // Fallback to existing questionPapersService endpoint
          const response =
            await questionPapersService.getQuestionPapersByCategory(
              selectedDegreeType
            );
          if (
            Array.isArray(response.data) &&
            (response.data.length === 0 || typeof response.data[0] === "string")
          ) {
            setAvailableCourses(response.data as string[]);
          } else {
            setAvailableCourses([]);
          }
        }
      } catch (err) {
        // fallback to questionPapersService if courses service fails
        const response =
          await questionPapersService.getQuestionPapersByCategory(
            selectedDegreeType
          );
        if (Array.isArray(response.data))
          setAvailableCourses(response.data as string[]);
        else setAvailableCourses([]);
      }
    } catch (error) {
      console.error("Error fetching courses:", error);
      toast.error("Failed to fetch courses");
    } finally {
      setLoading(false);
    }
  };

  const fetchPapers = async () => {
    try {
      setLoading(true);
      const response = await questionPapersService.getQuestionPapersByCategory(
        selectedDegreeType,
        selectedCourse
      );

      // Organize papers by semester
      const organized: QuestionPapersByCategory = {};
      if (!organized[selectedDegreeType]) {
        organized[selectedDegreeType] = {};
      }
      if (!organized[selectedDegreeType][selectedCourse]) {
        organized[selectedDegreeType][selectedCourse] = {};
      }

      // Type guard and handle the response
      let papers: QuestionPaper[] = [];
      if (
        response.data &&
        typeof response.data === "object" &&
        !Array.isArray(response.data)
      ) {
        // If it's QuestionPapersBySemester format
        const papersBySemester = response.data as Record<
          string,
          QuestionPaper[]
        >;
        Object.values(papersBySemester).forEach((semesterPapers) => {
          if (Array.isArray(semesterPapers)) {
            papers.push(
              ...semesterPapers.filter(
                (paper) => paper && typeof paper === "object"
              )
            );
          }
        });
      } else if (Array.isArray(response.data)) {
        // Check if it's an array of QuestionPaper objects (not strings)
        const dataArray = response.data as unknown[];
        if (
          dataArray.length > 0 &&
          typeof dataArray[0] === "object" &&
          dataArray[0] !== null &&
          "_id" in dataArray[0]
        ) {
          // It's an array of QuestionPaper objects
          papers = (dataArray as QuestionPaper[]).filter(
            (paper) => paper && typeof paper === "object" && paper._id
          );
        } else {
          // It's likely an array of strings (courses), which shouldn't happen in this context
          console.warn(
            "Received string array when expecting QuestionPaper objects"
          );
          papers = [];
        }
      }

      // We no longer store papersByCategory here; SemesterView will fetch and render the per-semester papers.
    } catch (error) {
      console.error("Error fetching papers:", error);
      toast.error("Failed to fetch question papers");
    } finally {
      setLoading(false);
      setInitialLoad(false);
    }
  };

  const handleDegreeTypeSelect = (degreeType: string) => {
    setSelectedDegreeType(degreeType);
    setCurrentView("courses");
    setSelectedCourse("");
    // reset handled by SemesterView; keep UI navigation state
    try {
      // include course as empty to make state shape consistent
      window.history.pushState(
        { qpView: "courses", degreeType, course: "" },
        ""
      );
    } catch (e) {
      /* ignore */
    }
  };

  const handleCourseSelect = (course: string) => {
    setSelectedCourse(course);
    setCurrentView("table");
    setSelectedSemester(null);
    try {
      // push full state (qpView + degreeType + course) so popstate can restore properly
      window.history.pushState(
        { qpView: "table", degreeType: selectedDegreeType, course },
        ""
      );
    } catch (e) {
      /* ignore */
    }
  };

  const handleBackToCategories = () => {
    setCurrentView("categories");
    setSelectedDegreeType("");
    setSelectedCourse("");
    setSelectedSemester(null);
    // navigation back to categories handled below
    try {
      window.history.pushState(
        { qpView: "categories", degreeType: "", course: "" },
        ""
      );
    } catch (e) {
      /* ignore */
    }
  };

  // Manage browser history so Back button navigates sections within this page
  useEffect(() => {
    // Ensure there's an initial state for the question papers page
    try {
      if (!window.history.state || !window.history.state.qpView) {
        window.history.replaceState(
          { qpView: "categories", degreeType: "", course: "" },
          ""
        );
      }
    } catch (e) {
      // ignore
    }

    const onPop = (e: PopStateEvent) => {
      const state = (e.state || {}) as any;
      if (state && state.qpView) {
        const view = state.qpView as
          | "categories"
          | "courses"
          | "table"
          | "semester";
        setCurrentView(view === "semester" ? "table" : view);
        // Restore degreeType and course when present
        setSelectedDegreeType(state.degreeType || "");
        setSelectedCourse(state.course || "");
        // support both older 'semester' and new 'semesterRawId' keys
        setSelectedSemester(state.semesterRawId || state.semester || null);
        setSelectedSemesterLabel(state.semesterLabel || state.semester || null);
      } else {
        // If no state, normalize to categories instead of trying to push extra states repeatedly
        setCurrentView("categories");
        setSelectedDegreeType("");
        setSelectedCourse("");
        setSelectedSemester(null);
        try {
          window.history.replaceState(
            { qpView: "categories", degreeType: "", course: "" },
            ""
          );
        } catch (err) {
          /* ignore */
        }
      }
    };

    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // FIXED: Handle view paper - use same approach as AcademicResourceCard
  const handleViewPaper = async (paper: QuestionPaper) => {
    try {
      const url = paper.fileUrl || paper.publicUrl;
      if (!url) {
        toast.error("No file available to view");
        return;
      }

      // For question papers, use the download tracking endpoint (same as AcademicResourceCard)
      try {
        await questionPapersService.trackDownload(paper._id);
      } catch (err) {
        // ignore tracking errors
      }

      // Open the URL directly in a new tab (same as AcademicResourceCard)
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (error) {
      console.error("Error viewing paper:", error);
      toast.error("Failed to open paper");
    }
  };

  const handleEditPaper = (paper: QuestionPaper) => {
    setSelectedPaper(paper);
    setShowEditModal(true);
  };

  // semesterSelect is called with rawId and label
  const handleSemesterSelect = (
    semesterRawId: string,
    semesterLabel?: string
  ) => {
    // if raw id is empty -> deselect (show semester grid)
    if (!semesterRawId) {
      setSelectedSemester(null);
      setSelectedSemesterLabel(null);
      try {
        // Back to table view for the course (no semester selected)
        window.history.pushState(
          {
            qpView: "table",
            degreeType: selectedDegreeType,
            course: selectedCourse,
          },
          ""
        );
      } catch (e) { }
      return;
    }

    setSelectedSemester(semesterRawId);
    setSelectedSemesterLabel(semesterLabel || null);
    try {
      // push full state so browser back can restore degreeType/course/semester
      window.history.pushState(
        {
          qpView: "semester",
          degreeType: selectedDegreeType,
          course: selectedCourse,
          semesterRawId,
          semesterLabel,
        },
        ""
      );
    } catch (e) { }
  };

  const renderBreadcrumb = () => {
    // Hide breadcrumb on root categories view
    if (currentView === "categories") return null;

    // Build clickable breadcrumb items
    const items: Array<{
      label: string;
      onClick?: () => void;
    }> = [];

    // First item: Categories (acts as root)
    items.push({
      label: "Categories",
      onClick: () => {
        handleBackToCategories();
      },
    });

    if (selectedDegreeType) {
      const degree = degreeTypes.find((d) => d.id === selectedDegreeType);
      items.push({
        label: degree?.name || selectedDegreeType,
        onClick: () => handleDegreeTypeSelect(selectedDegreeType),
      });
    }

    if (selectedCourse) {
      items.push({
        label: selectedCourse,
        onClick: () => {
          // Explicitly clear selected semester and go back to the course's semester grid
          setCurrentView("table");
          setSelectedSemester(null);
          setSelectedSemesterLabel(null);
          try {
            window.history.pushState(
              {
                qpView: "table",
                degreeType: selectedDegreeType,
                course: selectedCourse,
              },
              ""
            );
          } catch (e) { }
        },
      });
      if (selectedSemesterLabel)
        items.push({
          label: selectedSemesterLabel,
          onClick: () => handleSemesterSelect("", ""),
        });
      else if (selectedSemester)
        items.push({
          label: selectedSemester,
          onClick: () => handleSemesterSelect("", ""),
        });
    }

    return (
      <nav className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-6">
        {items.map((it, index) => (
          <React.Fragment key={`${it.label}-${index}`}>
            {index > 0 && <span>/</span>}
            {it.onClick ? (
              <button
                onClick={it.onClick}
                className={
                  index === items.length - 1
                    ? "font-medium text-gray-900 dark:text-white"
                    : "text-blue-600 hover:underline"
                }
              >
                {it.label}
              </button>
            ) : (
              <span
                className={
                  index === items.length - 1
                    ? "font-medium text-gray-900 dark:text-white"
                    : ""
                }
              >
                {it.label}
              </span>
            )}
          </React.Fragment>
        ))}
      </nav>
    );
  };

  // Debounced search effect with client-side fuzzy substring matching
  useEffect(() => {
    const qRaw = searchQuery || "";
    // Perform search when user types or filters change. If there is no
    // search term and no filters selected, treat as no-search (show normal views).
    const shouldSearch =
      !!qRaw || !!selectedCourseFilter || !!selectedSemesterFilter;
    if (!shouldSearch) {
      setSearchResults(null);
      setSearchLoading(false);
      return;
    }

    setSearchLoading(true);

    const id = setTimeout(async () => {
      try {
        const params: any = { keyword: qRaw || undefined, limit: 200 };
        if (selectedCourseFilter) params.course = selectedCourseFilter;
        if (selectedSemesterFilter) params.semester = selectedSemesterFilter;

        const res = await questionPapersService.getAllQuestionPapers(params);
        const papers: QuestionPaper[] = Array.isArray(res.data)
          ? res.data
          : (res.data as any) || [];
        setSearchResults(papers);
      } catch (err) {
        console.error("Search failed:", err);
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 250);

    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, selectedCourseFilter, selectedSemesterFilter]);

  // Load filter options (courses) for the AdvancedSearch filters
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res: any = await coursesService.listCourses();
        if (!mounted) return;
        const items: any[] = res?.data || [];
        const courseNames = items.map((c: any) =>
          String(
            c && (c.name || c.title || c.course)
              ? c.name || c.title || c.course
              : c
          )
        );
        setFilterCourses(courseNames);
      } catch (err) {
        // ignore
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedCourseFilter) {
      setFilterSemesters([]);
      return;
    }
    let mounted = true;
    (async () => {
      try {
        const res: any = await coursesService.listSemestersForCourse(
          selectedCourseFilter
        );
        if (!mounted) return;
        const items: any[] = res?.data || [];
        const sems = items.map((s: any) =>
          String(
            s && (s.title || s.name || s.semester)
              ? s.title || s.name || s.semester
              : s
          )
        );
        setFilterSemesters(sems);
      } catch (err) {
        // ignore
      }
    })();
    return () => {
      mounted = false;
    };
  }, [selectedCourseFilter]);

  // Keyboard shortcuts and navigation
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // '/' focuses search (when not typing in an input)
      if (e.key === "/" && document.activeElement?.tagName !== "INPUT") {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === "Escape") {
        setSearchQuery("");
        setSearchResults(null);
        setFocusedIndex(-1);
      }
      if (
        (e.key === "ArrowDown" || e.key === "ArrowUp") &&
        searchResults &&
        searchResults.length > 0
      ) {
        e.preventDefault();
        setFocusedIndex((prev) => {
          const len = searchResults.length;
          if (e.key === "ArrowDown") return Math.min(prev + 1, len - 1);
          return Math.max(prev - 1, 0);
        });
      }
      if (
        e.key === "Enter" &&
        focusedIndex >= 0 &&
        searchResults &&
        searchResults[focusedIndex]
      ) {
        e.preventDefault();
        handleViewPaper(searchResults[focusedIndex]);
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchResults, focusedIndex]);

  // Table rendering now handled by SemesterView which provides semester filter

  const renderSearchResults = () => {
    if (searchResults === null) return null;

    // When we have a non-null searchResults array, transform it into the
    // structure expected by SubjectTableView (papers grouped by semester), and
    // render SubjectTableView so users see subject-level tables instead of
    // individual cards. This also keeps behavior consistent with the
    // non-searching 'table' view.
    const papersBySemester: { [semester: string]: QuestionPaper[] } = {};
    (searchResults || []).forEach((p) => {
      // Prefer explicit semester label fields if available, fall back to
      // `semester` or `General`.
      const sem = (p as any).semesterLabel || (p as any).semester || "General";
      const key = String(sem || "General");
      if (!papersBySemester[key]) papersBySemester[key] = [];
      papersBySemester[key].push(p);
    });

    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Search results</h3>
        {searchLoading ? (
          <div className="flex justify-center py-6">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
          </div>
        ) : searchResults.length === 0 ? (
          <div className="text-gray-600">No results found</div>
        ) : (
          <div ref={resultsRef} className="">
            {/* Directly render SubjectTableView with the grouped search results
                so users see subject-level tables matching their filters/queries. */}
            <SubjectTableView
              papersBySemester={papersBySemester}
              subjectsBySemester={{}}
              subjectsIdMap={{}}
              onView={handleViewPaper}
              onEdit={isTeacher ? handleEditPaper : undefined}
              currentUserId={auth?.user?._id}
            />
          </div>
        )}
      </div>
    );
  };

  const handlePaperUpdate = () => {
    // Refresh the current course/semester listing
    fetchPapers();
    // bump refresh key so SemesterView re-fetches its data when mounted
    setRefreshKey((r) => r + 1);
    // If the user is currently viewing search results, refresh that list as well
    if (searchResults !== null) {
      (async () => {
        try {
          const params: any = { keyword: searchQuery || undefined, limit: 200 };
          if (selectedCourseFilter) params.course = selectedCourseFilter;
          if (selectedSemesterFilter) params.semester = selectedSemesterFilter;
          const res = await questionPapersService.getAllQuestionPapers(params);
          const papers: QuestionPaper[] = Array.isArray(res.data)
            ? res.data
            : (res.data as any) || [];
          setSearchResults(papers);
        } catch (err) {
          console.error("Search refresh failed:", err);
        }
      })();
    }
    // Notify other parts of the app that a question paper has been updated so
    // they can refresh their own lists (teacher management, etc.).
    try {
      window.dispatchEvent(new CustomEvent("questionPaper:updated", {}));
    } catch (e) {
      // ignore
    }
    try {
      // include id so listeners can refetch a single authoritative resource if needed
      window.dispatchEvent(
        new CustomEvent("questionPaper:updated", {
          detail: { id: selectedPaper?._id },
        })
      );
    } catch (e) {
      // ignore
    }
  };

  return (
    <div className="min-h-screen bg-white pt-20 dark:bg-gray-900">

      {/* Edit Modal */}
      {selectedPaper && (
        <QuestionPapersEditModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedPaper(null);
          }}
          paper={selectedPaper}
          onSubmit={async (values) => {
            await questionPapersService.updateQuestionPaper(
              selectedPaper._id,
              values
            );
            handlePaperUpdate();
          }}
        />
      )}

      <div className="relative z-10">
        {/* Header */}
        <div className="border-b border-slate-200 bg-white dark:border-gray-800 dark:bg-gray-900">
          <div className="mx-auto w-full max-w-[120rem] px-5 py-8 md:px-8">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                {/* back button removed (history navigation is handled via popstate and breadcrumb) */}
                <FileText className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Question Papers
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400">
                    Browse previous year question papers organized by category
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="mx-auto w-full max-w-[120rem] px-5 py-8 md:px-8">
          <div className="mb-8 border-b border-gray-200 pb-6 dark:border-gray-700">
            <div className="mb-4 flex items-start justify-between">
              <div className="flex-1">
                {/* Search bar styled like AcademicNotes/Syllabus */}
                <div className="mb-2 flex flex-col gap-3 sm:flex-row">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      ref={inputRef}
                      type="text"
                      placeholder="Search question papers by title, course, or tags..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && (() => { })}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`flex items-center justify-center gap-2 rounded-lg border px-4 py-2 transition-colors sm:w-auto ${showFilters
                        ? "bg-blue-50 border-blue-300 text-blue-700 dark:bg-blue-900 dark:border-blue-600 dark:text-blue-300"
                        : "border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                      }`}
                  >
                    <Filter className="w-5 h-5" />
                    Filters
                  </button>
                  <button
                    onClick={() => {
                      /* immediate search handled by effect */
                    }}
                    className="rounded-lg bg-blue-600 px-6 py-2 text-white transition-colors hover:bg-blue-700 sm:w-auto"
                  >
                    Search
                  </button>
                </div>

                {/* Filters node (keeps original controls) */}
                {showFilters ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Course
                      </label>
                      <select
                        value={selectedCourseFilter}
                        onChange={(e) => {
                          const v = e.target.value;
                          setSelectedCourseFilter(v);
                          // navigate to table view for selected course
                          if (v) {
                            // choose course and trigger SemesterView
                            setSelectedCourse(v);
                            setCurrentView("table");
                            setSearchResults(null);
                            setSelectedSemester(null);
                            setSelectedSemesterLabel(null);
                          }
                        }}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="">All Courses</option>
                        {filterCourses.map((course, idx) => (
                          <option
                            key={`${String(course)}-${idx}`}
                            value={course}
                          >
                            {course}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Semester
                      </label>
                      <select
                        value={selectedSemesterFilter}
                        onChange={(e) => {
                          const v = e.target.value;
                          setSelectedSemesterFilter(v);
                          if (v) {
                            // when semester selected, ensure course is selected and show semester view
                            setCurrentView("table");
                            setSelectedSemester(v);
                            setSelectedSemesterLabel(v);
                            setSearchResults(null);
                          }
                        }}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="">All Semesters</option>
                        {filterSemesters.map((s, idx) => (
                          <option key={`${String(s)}-${idx}`} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="md:col-span-2 flex justify-end items-end">
                      <button
                        onClick={() => {
                          setSelectedCourseFilter("");
                          setSelectedSemesterFilter("");
                          // reset search results and navigation
                          setSearchResults(null);
                          setCurrentView("categories");
                          setSelectedCourse("");
                          setSelectedSemester(null);
                          setSelectedSemesterLabel(null);
                        }}
                        className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                      >
                        Clear Filters
                      </button>
                    </div>
                  </div>
                ) : null}

                <div className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  {searchResults === null
                    ? ""
                    : `${searchResults.length} result${searchResults.length === 1 ? "" : "s"
                    }`}
                </div>
              </div>
            </div>
          </div>

          {searchResults !== null ? (
            renderSearchResults()
          ) : (
            <>
              {renderBreadcrumb()}

              {/* Categories View */}
              {currentView === "categories" && (
                <CategoriesView
                  degreeTypes={degreeTypes as any}
                  onSelect={handleDegreeTypeSelect}
                />
              )}

              {/* Courses View */}
              {currentView === "courses" && (
                <CoursesView
                  courses={availableCourses}
                  onSelect={handleCourseSelect}
                  loading={loading}
                />
              )}

              {/* Table View */}
              {currentView === "table" && (
                <div>
                  {loading && initialLoad ? (
                    <div className="flex justify-center py-12">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    </div>
                  ) : (
                    <div>
                      {/* small inline spinner during refresh */}
                      {loading && !initialLoad && (
                        <div className="mb-4 flex justify-center">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
                        </div>
                      )}
                      {/* Instead of directly rendering the table, render SemesterView which provides semester filter then SubjectTableView */}
                      <SemesterView
                        degreeType={selectedDegreeType}
                        course={selectedCourse}
                        refreshKey={refreshKey}
                        initialSelectedSemester={selectedSemester || undefined}
                        onSemesterSelect={handleSemesterSelect}
                        onView={handleViewPaper}
                        onEdit={isTeacher ? handleEditPaper : undefined}
                        currentUserId={auth?.user?._id}
                      />
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuestionPapersTable;
