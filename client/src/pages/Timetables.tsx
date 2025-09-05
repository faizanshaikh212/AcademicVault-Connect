/**
 * Timetables Page Component
 * Page for browsing and managing class timetables
 */

import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Clock,
  Plus
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Timetable, TimetableSearchParams } from '../types/academic';
import Galaxy from '../components/background/Galaxy';
import AcademicResourceCard from '../components/shared/AcademicResourceCard';
import DocumentViewer from '../components/shared/DocumentViewer';
import FileUploadModal from '../components/shared/FileUploadModal';
import { timetablesService } from '../services/academicService';
import { useAuth } from '../hooks/useAuth';

const TimetablesPage: React.FC = () => {
  const { user } = useAuth();
  // State management
  const [timetables, setTimetables] = useState<Timetable[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useState<TimetableSearchParams>({
    page: 1,
    limit: 12,
    sortBy: 'effectiveFrom',
    sortOrder: 'desc',
  });
  const [pagination, setPagination] = useState({
    current: 1,
    pages: 1,
    total: 0,
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTimetable, setSelectedTimetable] = useState<Timetable | null>(null);
  const [showViewer, setShowViewer] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [showActiveOnly, setShowActiveOnly] = useState(false);

  // Filter options
  const [filterOptions, setFilterOptions] = useState({
    courses: [] as string[],
    semesters: [] as string[],
    academicYears: [] as string[],
    types: [] as string[],
  });

  useEffect(() => {
    fetchTimetables();
  }, [searchParams]);

  const fetchTimetables = async () => {
    try {
      setLoading(true);
      const response = await timetablesService.getAllTimetables(searchParams);
      setTimetables(response.data);
      setPagination(response.pagination);

      // Extract filter options from the data
      const courses = [...new Set(response.data.map(timetable => timetable.course))];
      const semesters = [...new Set(response.data.map(timetable => timetable.semester))];
      const years = [...new Set(response.data.map(timetable => timetable.academicYear))];
      const types = [...new Set(response.data.map(timetable => timetable.timetableType))];

      setFilterOptions({
        courses,
        semesters,
        academicYears: years,
        types,
      });
    } catch (error) {
      console.error('Error fetching timetables:', error);
      toast.error('Failed to fetch timetables');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    const newParams: TimetableSearchParams = {
      ...searchParams,
      page: 1,
      search: searchQuery || undefined,
      course: selectedCourse || undefined,
      semester: selectedSemester || undefined,
      academicYear: selectedYear || undefined,
      timetableType: selectedType || undefined,
      isActive: showActiveOnly || undefined,
    };
    setSearchParams(newParams);
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedCourse('');
    setSelectedSemester('');
    setSelectedYear('');
    setSelectedType('');
    setShowActiveOnly(false);
    setSearchParams({
      page: 1,
      limit: 12,
      sortBy: 'effectiveFrom',
      sortOrder: 'desc',
    });
  };

  const handlePageChange = (page: number) => {
    setSearchParams({ ...searchParams, page });
  };

  const handleViewTimetable = (timetable: Timetable) => {
    setSelectedTimetable(timetable);
    setShowViewer(true);
  };

  const handleDownloadTimetable = async (timetable: Timetable) => {
    try {
      const response = await timetablesService.trackDownload(timetable._id);
      window.open(response.downloadUrl, '_blank');
      toast.success('Download started');

      // Update download count in the local state
      setTimetables(prevTimetables =>
        prevTimetables.map(t =>
          t._id === timetable._id ? { ...t, downloadCount: t.downloadCount + 1 } : t
        )
      );
    } catch (error) {
      console.error('Error downloading timetable:', error);
      toast.error('Failed to download timetable');
    }
  };

  const handleCloseViewer = () => {
    setShowViewer(false);
    setSelectedTimetable(null);
  };

  const handleUpload = async (formData: FormData) => {
    try {
      await timetablesService.uploadTimetable(formData);
      fetchTimetables(); // Refresh the timetables list
      toast.success('Timetable uploaded successfully!');
    } catch (error) {
      console.error('Upload error:', error);
      throw error; // Let the modal handle the error display
    }
  };

  const isTeacher = user && Array.isArray(user.role) && user.role.includes('teacher');

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
                <Clock className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Class Timetables
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400">
                    Browse and download class schedules and timetables
                  </p>
                </div>
              </div>

              {isTeacher && (
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  Upload Timetable
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
            {/* Search Bar */}
            <div className="flex gap-4 mb-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search timetables by course, description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors ${showFilters
                  ? 'bg-blue-50 border-blue-300 text-blue-700 dark:bg-blue-900 dark:border-blue-600 dark:text-blue-300'
                  : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
              >
                <Filter className="w-5 h-5" />
                Filters
              </button>
              <button
                onClick={handleSearch}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Search
              </button>
            </div>

            {/* Filters */}
            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Course
                  </label>
                  <select
                    value={selectedCourse}
                    onChange={(e) => setSelectedCourse(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">All Courses</option>
                    {filterOptions.courses.map((course) => (
                      <option key={course} value={course}>
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
                    value={selectedSemester}
                    onChange={(e) => setSelectedSemester(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">All Semesters</option>
                    {filterOptions.semesters.map((semester) => (
                      <option key={semester} value={semester}>
                        {semester}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Academic Year
                  </label>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">All Years</option>
                    {filterOptions.academicYears.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Type
                  </label>
                  <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">All Types</option>
                    {filterOptions.types.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="lg:col-span-4 flex items-center justify-between">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={showActiveOnly}
                      onChange={(e) => setShowActiveOnly(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Show active only</span>
                  </label>
                  <button
                    onClick={handleClearFilters}
                    className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Results */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-gray-600 dark:text-gray-400">
                {loading ? 'Loading...' : `${pagination.total} timetables found`}
              </p>

              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600 dark:text-gray-400">Sort by:</label>
                <select
                  value={`${searchParams.sortBy}-${searchParams.sortOrder}`}
                  onChange={(e) => {
                    const [sortBy, sortOrder] = e.target.value.split('-');
                    setSearchParams({
                      ...searchParams,
                      sortBy,
                      sortOrder: sortOrder as 'asc' | 'desc',
                      page: 1,
                    });
                  }}
                  className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                >
                  <option value="effectiveFrom-desc">Newest First</option>
                  <option value="effectiveFrom-asc">Oldest First</option>
                  <option value="title-asc">Title A-Z</option>
                  <option value="title-desc">Title Z-A</option>
                  <option value="downloadCount-desc">Most Downloaded</option>
                  <option value="viewCount-desc">Most Viewed</option>
                </select>
              </div>
            </div>

            {/* Timetables Grid */}
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, index) => (
                  <div key={index} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 animate-pulse">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
                    <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  </div>
                ))}
              </div>
            ) : timetables.length === 0 ? (
              <div className="text-center py-12">
                <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No timetables found
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Try adjusting your search criteria or upload some timetables to get started.
                </p>
                {isTeacher && (
                  <button
                    onClick={() => setShowUploadModal(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                    Upload Timetable
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {timetables.map((timetable) => (
                  <AcademicResourceCard
                    key={timetable._id}
                    resource={timetable}
                    resourceType="timetables"
                    onView={handleViewTimetable}
                    onDownload={handleDownloadTimetable}
                  />
                ))}
              </div>
            )}

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="flex justify-center mt-8">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePageChange(pagination.current - 1)}
                    disabled={pagination.current === 1}
                    className="px-3 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>

                  {[...Array(pagination.pages)].map((_, index) => {
                    const page = index + 1;
                    return (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`px-3 py-2 rounded ${page === pagination.current
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                          }`}
                      >
                        {page}
                      </button>
                    );
                  })}

                  <button
                    onClick={() => handlePageChange(pagination.current + 1)}
                    disabled={pagination.current === pagination.pages}
                    className="px-3 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Document Viewer */}
      {showViewer && selectedTimetable && (
        <DocumentViewer
          isOpen={showViewer}
          onClose={handleCloseViewer}
          fileUrl={selectedTimetable.publicUrl}
          embedUrl={selectedTimetable.embedUrl || ''}
          downloadUrl={selectedTimetable.downloadUrl}
          title={selectedTimetable.title}
          fileType={selectedTimetable.fileType}
          onDownload={() => handleDownloadTimetable(selectedTimetable)}
        />
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <FileUploadModal
          isOpen={showUploadModal}
          onClose={() => setShowUploadModal(false)}
          onUpload={handleUpload}
          resourceType="timetables"
          title="Upload Class Timetable"
        />
      )}
    </div>
  );
};

export default TimetablesPage;