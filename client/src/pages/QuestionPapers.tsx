/**
 * Question Papers Page
 * Page for browsing question papers organized by degree type, course, and semester
 */

import React, { useState, useEffect } from 'react';
import { ArrowLeft, FileText, GraduationCap, Brain, Award, Building } from 'lucide-react';
import { toast } from 'react-hot-toast';
import AcademicResourceCard from '../components/shared/AcademicResourceCard';
import DocumentViewer from '../components/shared/DocumentViewer';
import { QuestionPaper, QuestionPapersBySemester } from '../types/academic';
import { questionPapersService } from '../services/academicService';
import Galaxy from '../components/background/Galaxy';

interface CategoryTile {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  degreeType: 'BE' | 'BSC' | 'PG' | 'Commerce';
}

const QuestionPapers: React.FC = () => {
  // State management
  const [currentView, setCurrentView] = useState<'categories' | 'courses' | 'papers'>('categories');
  const [selectedCategory, setSelectedCategory] = useState<CategoryTile | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<string>('');

  const [availableCourses, setAvailableCourses] = useState<string[]>([]);
  const [papersBySemester, setPapersBySemester] = useState<QuestionPapersBySemester>({});
  const [loading, setLoading] = useState(false);

  const [selectedPaper, setSelectedPaper] = useState<QuestionPaper | null>(null);
  const [showViewer, setShowViewer] = useState(false);

  // Category definitions (converted from old HTML structure)
  const categories: CategoryTile[] = [
    {
      id: 'be',
      title: 'Bachelor in Engineering (BE)',
      description: 'Engineering question papers across all branches and semesters',
      icon: <GraduationCap className="w-8 h-8" />,
      degreeType: 'BE'
    },
    {
      id: 'bsc',
      title: 'Bachelor in Science (BSC)',
      description: 'Science question papers for various specializations',
      icon: <Brain className="w-8 h-8" />,
      degreeType: 'BSC'
    },
    {
      id: 'pg',
      title: 'Post Graduate (PG)',
      description: 'Masters and postgraduate program question papers',
      icon: <Award className="w-8 h-8" />,
      degreeType: 'PG'
    },
    {
      id: 'commerce',
      title: 'Commerce (COM)',
      description: 'Commerce and business studies question papers',
      icon: <Building className="w-8 h-8" />,
      degreeType: 'Commerce'
    }
  ];

  // Fetch courses when category is selected
  useEffect(() => {
    if (selectedCategory && currentView === 'courses') {
      fetchCourses(selectedCategory.degreeType);
    }
  }, [selectedCategory, currentView]);

  // Fetch papers when course is selected
  useEffect(() => {
    if (selectedCategory && selectedCourse && currentView === 'papers') {
      fetchPapers(selectedCategory.degreeType, selectedCourse);
    }
  }, [selectedCategory, selectedCourse, currentView]);

  const fetchCourses = async (degreeType: string) => {
    try {
      setLoading(true);
      const response = await questionPapersService.getQuestionPapersByCategory(degreeType);
      setAvailableCourses(response.data as string[]);
    } catch (error) {
      console.error('Error fetching courses:', error);
      toast.error('Failed to fetch courses');
    } finally {
      setLoading(false);
    }
  };

  const fetchPapers = async (degreeType: string, course: string) => {
    try {
      setLoading(true);
      const response = await questionPapersService.getQuestionPapersByCategory(degreeType, course);
      setPapersBySemester(response.data as QuestionPapersBySemester);
    } catch (error) {
      console.error('Error fetching papers:', error);
      toast.error('Failed to fetch question papers');
    } finally {
      setLoading(false);
    }
  };

  const handleCategorySelect = (category: CategoryTile) => {
    setSelectedCategory(category);
    setCurrentView('courses');
    setSelectedCourse('');
    setPapersBySemester({});
  };

  const handleCourseSelect = (course: string) => {
    setSelectedCourse(course);
    setCurrentView('papers');
  };

  const handleBackToCategories = () => {
    setCurrentView('categories');
    setSelectedCategory(null);
    setSelectedCourse('');
    setPapersBySemester({});
  };

  const handleBackToCourses = () => {
    setCurrentView('courses');
    setSelectedCourse('');
    setPapersBySemester({});
  };

  const handleViewPaper = (paper: QuestionPaper) => {
    setSelectedPaper(paper);
    setShowViewer(true);
  };

  const handleDownloadPaper = async (paper: QuestionPaper) => {
    try {
      const response = await questionPapersService.trackDownload(paper._id);
      window.open(response.downloadUrl, '_blank');
      toast.success('Download started');
    } catch (error) {
      console.error('Error downloading paper:', error);
      toast.error('Failed to download paper');
    }
  };

  const handleCloseViewer = () => {
    setShowViewer(false);
    setSelectedPaper(null);
  };

  const renderBreadcrumb = () => {
    const items = ['Question Papers'];
    if (selectedCategory) items.push(selectedCategory.title);
    if (selectedCourse) items.push(selectedCourse);

    return (
      <nav className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-6">
        {items.map((item, index) => (
          <React.Fragment key={item}>
            {index > 0 && <span>/</span>}
            <span className={index === items.length - 1 ? 'font-medium text-gray-900 dark:text-white' : ''}>
              {item}
            </span>
          </React.Fragment>
        ))}
      </nav>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 relative">
      {/* Background Effect */}
      <Galaxy />

      <div className="relative z-10">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {currentView !== 'categories' && (
                  <button
                    onClick={currentView === 'courses' ? handleBackToCategories : handleBackToCourses}
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
                    Browse previous year question papers by category
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {renderBreadcrumb()}

          {/* Categories View */}
          {currentView === 'categories' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {categories.map((category) => (
                <div
                  key={category.id}
                  onClick={() => handleCategorySelect(category)}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 border border-gray-200 dark:border-gray-700 cursor-pointer overflow-hidden group"
                >
                  <div className="p-6 text-center">
                    <div className="flex justify-center mb-4 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                      {category.icon}
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      {category.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {category.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Courses View */}
          {currentView === 'courses' && (
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

          {/* Papers View */}
          {currentView === 'papers' && (
            <div>
              {loading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <div className="space-y-8">
                  {Object.entries(papersBySemester).map(([semester, papers]) => (
                    <div key={semester}>
                      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                        {semester}
                      </h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {papers.map((paper) => (
                          <AcademicResourceCard
                            key={paper._id}
                            resource={paper}
                            resourceType="questionPapers"
                            onView={handleViewPaper}
                            onDownload={handleDownloadPaper}
                          />
                        ))}
                      </div>
                    </div>
                  ))}

                  {Object.keys(papersBySemester).length === 0 && (
                    <div className="text-center py-12">
                      <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        No question papers found
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        No question papers are available for this course yet.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Document Viewer */}
      {showViewer && selectedPaper && (
        <DocumentViewer
          isOpen={showViewer}
          onClose={handleCloseViewer}
          fileUrl={selectedPaper.publicUrl}
          embedUrl={selectedPaper.embedUrl || ''}
          downloadUrl={selectedPaper.downloadUrl}
          title={selectedPaper.title}
          fileType={selectedPaper.fileType}
          onDownload={() => handleDownloadPaper(selectedPaper)}
        />
      )}
    </div>
  );
};

export default QuestionPapers;