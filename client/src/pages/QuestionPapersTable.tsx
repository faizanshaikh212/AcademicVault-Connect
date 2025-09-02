/**
 * Question Papers Table View
 * Shows question papers in a table format organized by degree type and course
 */

import React, { useState, useEffect, useContext } from "react";
import { ArrowLeft, FileText, Edit, Eye } from "lucide-react";
import { toast } from "react-hot-toast";
import { QuestionPaper } from "../types/academic";
import { questionPapersService } from "../services/academicService";
import { AuthContext } from "../context/AuthContext";
import Galaxy from "../components/background/Galaxy";
import QuestionPapersEditModal from "../components/shared/QuestionPapersEditModal";

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
  };

  const handleCourseSelect = (course: string) => {
    setSelectedCourse(course);
    setCurrentView("table");
  };

  const handleBackToCategories = () => {
    setCurrentView("categories");
    setSelectedDegreeType("");
    setSelectedCourse("");
    setPapersByCategory({});
  };

  const handleBackToCourses = () => {
    setCurrentView("courses");
    setSelectedCourse("");
    setPapersByCategory({});
  };

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
    const items = ["Question Papers"];
    if (selectedDegreeType) {
      const degreeType = degreeTypes.find((d) => d.id === selectedDegreeType);
      items.push(degreeType?.name || selectedDegreeType);
    }
    if (selectedCourse) items.push(selectedCourse);

    return (
      <nav className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-6">
        {items.map((item, index) => (
          <React.Fragment key={item}>
            {index > 0 && <span>/</span>}
            <span
              className={
                index === items.length - 1
                  ? "font-medium text-gray-900 dark:text-white"
                  : ""
              }
            >
              {item}
            </span>
          </React.Fragment>
        ))}
      </nav>
    );
  };

  const renderTable = () => {
    const courseData = papersByCategory[selectedDegreeType]?.[selectedCourse];
    if (!courseData) return null;

    const semesters = Object.keys(courseData).sort((a, b) => {
      if (a === "General") return 1;
      if (b === "General") return -1;
      return parseInt(a) - parseInt(b);
    });

    return (
      <div className="space-y-8">
        {semesters.map((semester) => (
          <div
            key={semester}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
          >
            <div className="bg-gray-50 dark:bg-gray-900 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {semester === "General"
                  ? "General Papers"
                  : `Semester ${semester}`}
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Paper Title
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Subject
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Year
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Downloads
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {courseData[semester].map((paper) => (
                    <tr
                      key={paper._id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {paper.title}
                        </div>
                        {paper.description && paper.description.length > 0 && (
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {paper.description.length > 60
                              ? `${paper.description.substring(0, 60)}...`
                              : paper.description}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {paper.subject || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {paper.examYear}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                          {paper.fileType.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {paper.downloadCount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handleViewPaper(paper)}
                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-1"
                            title="View Paper"
                          >
                            <Eye className="w-4 h-4" />
                            View
                          </button>
                          {isTeacher && (
                            <button
                              onClick={() => handleEditPaper(paper)}
                              className="text-yellow-600 hover:text-yellow-900 dark:text-yellow-400 dark:hover:text-yellow-300 flex items-center gap-1"
                              title="Edit Paper"
                            >
                              <Edit className="w-4 h-4" />
                              Edit
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
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

      <div className="relative z-10">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {currentView !== "categories" && (
                  <button
                    onClick={
                      currentView === "courses"
                        ? handleBackToCategories
                        : handleBackToCourses
                    }
                    className="p-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                )}
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

        {/* Content: add top padding to avoid fixed navbar covering header */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 md:pt-28 pb-6">
          {renderBreadcrumb()}

          {/* Categories View */}
          {currentView === "categories" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {degreeTypes.map((degreeType) => (
                <div
                  key={degreeType.id}
                  onClick={() => handleDegreeTypeSelect(degreeType.id)}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 border border-gray-200 dark:border-gray-700 cursor-pointer overflow-hidden group p-6 text-center"
                >
                  <div className="flex justify-center mb-4 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                    <FileText className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {degreeType.name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {degreeType.description}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Courses View */}
          {currentView === "courses" && (
            <div>
              {loading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {availableCourses.map((course) => (
                    <div
                      key={course}
                      onClick={() => handleCourseSelect(course)}
                      className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 border border-gray-200 dark:border-gray-700 cursor-pointer p-6"
                    >
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {course}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                        Click to view question papers
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
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
        </div>
      </div>
    </div>
  );
};

export default QuestionPapersTable;
