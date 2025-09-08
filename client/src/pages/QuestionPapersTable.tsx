/**
 * Question Papers Table View
 * Shows question papers in a table format organized by degree type and course
 */

import React, { useState, useEffect, useContext } from "react";
import { FileText } from "lucide-react";
import { toast } from "react-hot-toast";
import { QuestionPaper } from "../types/academic";
import { questionPapersService } from "../services/academicService";
import { AuthContext } from "../context/AuthContext";
import Galaxy from "../components/background/Galaxy";
import QuestionPapersEditModal from "../components/shared/QuestionPapersEditModal";
import CategoriesView from "../components/questionpapers/CategoriesView";
import CoursesView from "../components/questionpapers/CoursesView";
import SemesterTableView from "../components/questionpapers/SemesterTableView";

interface QuestionPapersByCategory {
  [degreeType: string]: {
    [course: string]: {
      [semester: string]: QuestionPaper[];
    };
  };
}

const QuestionPapersTable: React.FC = () => {
  const auth = useContext(AuthContext);
  const isTeacher = auth?.user?.role?.includes("teacher");

  const [currentView, setCurrentView] = useState<
    "categories" | "courses" | "table"
  >("categories");
  const [selectedDegreeType, setSelectedDegreeType] = useState<string>("");
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [selectedPaper, setSelectedPaper] = useState<QuestionPaper | null>(
    null
  );
  const [showEditModal, setShowEditModal] = useState(false);

  const [papersByCategory, setPapersByCategory] =
    useState<QuestionPapersByCategory>({});
  const [availableCourses, setAvailableCourses] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchResults, setSearchResults] = useState<QuestionPaper[] | null>(
    null
  );
  const [searchLoading, setSearchLoading] = useState(false);
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
      const response = await questionPapersService.getQuestionPapersByCategory(
        selectedDegreeType
      );

      // Type guard to ensure we have string array
      if (
        Array.isArray(response.data) &&
        (response.data.length === 0 || typeof response.data[0] === "string")
      ) {
        setAvailableCourses(response.data as string[]);
      } else {
        console.error("Unexpected response format for courses");
        setAvailableCourses([]);
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

      // Group papers by semester
      papers.forEach((paper) => {
        if (!paper || !paper._id) return; // Skip invalid papers

        const semester = (paper.semester && paper.semester.trim()) || "General";
        if (!organized[selectedDegreeType]) {
          organized[selectedDegreeType] = {};
        }
        if (!organized[selectedDegreeType][selectedCourse]) {
          organized[selectedDegreeType][selectedCourse] = {};
        }
        if (!organized[selectedDegreeType][selectedCourse][semester]) {
          organized[selectedDegreeType][selectedCourse][semester] = [];
        }
        organized[selectedDegreeType][selectedCourse][semester].push(paper);
      });

      setPapersByCategory(organized);
    } catch (error) {
      console.error("Error fetching papers:", error);
      toast.error("Failed to fetch question papers");
    } finally {
      setLoading(false);
    }
  };

  const handleDegreeTypeSelect = (degreeType: string) => {
    setSelectedDegreeType(degreeType);
    setCurrentView("courses");
    setSelectedCourse("");
    setPapersByCategory({});
    try {
      window.history.pushState({ qpView: "courses", degreeType }, "");
    } catch (e) {
      /* ignore */
    }
  };

  const handleCourseSelect = (course: string) => {
    setSelectedCourse(course);
    setCurrentView("table");
    try {
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
    setPapersByCategory({});
    try {
      window.history.pushState({ qpView: "categories" }, "");
    } catch (e) {
      /* ignore */
    }
  };

  // Manage browser history so Back button navigates sections within this page
  useEffect(() => {
    // Ensure there's an initial state for the question papers page
    try {
      if (!window.history.state || !window.history.state.qpView) {
        window.history.replaceState({ qpView: "categories" }, "");
      }
    } catch (e) {
      // ignore
    }

    const onPop = (e: PopStateEvent) => {
      const state = (e.state || {}) as any;
      if (state && state.qpView) {
        const view = state.qpView as "categories" | "courses" | "table";
        setCurrentView(view);
        if (view === "categories") {
          setSelectedDegreeType("");
          setSelectedCourse("");
        } else if (view === "courses") {
          setSelectedDegreeType(state.degreeType || "");
          setSelectedCourse("");
        } else if (view === "table") {
          setSelectedDegreeType(state.degreeType || "");
          setSelectedCourse(state.course || "");
        }
      } else {
        // Prevent navigating away from the page with a single Back; instead restore categories
        window.history.pushState(
          { qpView: "categories" },
          "",
          window.location.href
        );
        setCurrentView("categories");
        setSelectedDegreeType("");
        setSelectedCourse("");
      }
    };

    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleViewPaper = async (paper: QuestionPaper) => {
    try {
      // Open the public/file URL in a new tab (view only). Then call GET to increment view count on the server.
      const url = paper.fileUrl || paper.publicUrl;
      if (!url) {
        toast.error("No file available to view");
        return;
      }
      window.open(url, "_blank", "noopener,noreferrer");
      // GETting the paper will increment viewCount on the server (controller increments view on GET)
      await questionPapersService.getQuestionPaperById(paper._id);
    } catch (error) {
      console.error("Error viewing paper:", error);
      toast.error("Failed to open paper");
    }
  };

  const handleEditPaper = (paper: QuestionPaper) => {
    setSelectedPaper(paper);
    setShowEditModal(true);
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
      items.push({ label: selectedCourse });
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
    const q = qRaw.trim().toLowerCase();
    if (!q) {
      setSearchResults(null);
      setSearchLoading(false);
      return;
    }

    setSearchLoading(true);

    const id = setTimeout(async () => {
      try {
        // Always ask the server for search results using `keyword` to match
        // Blogs/Projects endpoints. Let the server handle short queries.
        const params: any = { keyword: qRaw, limit: 200 };

        const res = await questionPapersService.getAllQuestionPapers(params);
        // server returns AcademicResourceListResponse<QuestionPaper>
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
  }, [searchQuery]);

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

  const renderTable = () => {
    const courseData = papersByCategory[selectedDegreeType]?.[selectedCourse];
    if (!courseData) return null;

    return (
      <SemesterTableView
        papersBySemester={courseData}
        onView={handleViewPaper}
        onEdit={isTeacher ? handleEditPaper : undefined}
      />
    );
  };

  const renderSearchResults = () => {
    if (searchResults === null) return null;

    const highlightMatches = (text: string, query: string) => {
      if (!query) return text;
      const q = query.toLowerCase();
      const parts: Array<string | JSX.Element> = [];
      let idx = 0;
      const lower = text.toLowerCase();
      while (true) {
        const found = lower.indexOf(q, idx);
        if (found === -1) {
          parts.push(text.substring(idx));
          break;
        }
        if (found > idx) parts.push(text.substring(idx, found));
        const match = text.substring(found, found + q.length);
        parts.push(
          <mark
            key={`${found}-${idx}`}
            className="bg-yellow-200 dark:bg-yellow-600 text-black"
          >
            {match}
          </mark>
        );
        idx = found + q.length;
      }
      return parts;
    };

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
          <div
            ref={resultsRef}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            {searchResults.map((paper, i) => (
              <div
                key={paper._id}
                className={`rounded-lg shadow p-4 border border-gray-200 dark:border-gray-700 ${
                  focusedIndex === i
                    ? "ring-2 ring-blue-400 dark:ring-blue-300"
                    : "bg-white dark:bg-gray-800"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {highlightMatches(paper.title || "", searchQuery)}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {highlightMatches(
                        `${paper.degreeType} • ${paper.course} • ${
                          paper.semester || "General"
                        } • ${paper.examYear}`,
                        searchQuery
                      )}
                    </div>
                    {paper.description && (
                      <div className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                        {highlightMatches(paper.description, searchQuery)}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleViewPaper(paper)}
                      className="text-blue-600 hover:underline"
                    >
                      View
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const handlePaperUpdate = () => {
    fetchPapers();
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 relative">
      <Galaxy />

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

      <div className="relative z-10 pt-25">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">
          {/* Search Bar */}
          <div className="mb-4 flex items-center gap-3">
            <div className="relative flex-1">
              <input
                ref={inputRef}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search question papers by title, subject, course, year..."
                className="w-full rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2 pr-10 focus:outline-none"
                onKeyDown={(e) => {
                  if (
                    e.key === "ArrowDown" &&
                    searchResults &&
                    searchResults.length > 0
                  ) {
                    e.preventDefault();
                    setFocusedIndex(0);
                  }
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400"
                  title="Clear search"
                >
                  ✕
                </button>
              )}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {searchResults === null
                ? ""
                : `${searchResults.length} result${
                    searchResults.length === 1 ? "" : "s"
                  }`}
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
                  {loading ? (
                    <div className="flex justify-center py-12">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    </div>
                  ) : (
                    renderTable()
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
