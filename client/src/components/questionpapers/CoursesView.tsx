import React from "react";
import { FileText } from "lucide-react";

interface Props {
  courses: string[];
  onSelect: (course: string) => void;
  loading?: boolean;
}

const CoursesView: React.FC<Props> = ({ courses, onSelect, loading }) => {
  return (
    <div className="">
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map((course) => (
            <div
              key={course}
              onClick={() => onSelect(course)}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 border border-gray-200 dark:border-gray-700 cursor-pointer p-6 text-center"
            >
              <div className="flex justify-center mb-4 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                <FileText className="w-8 h-8" />
              </div>
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
  );
};

export default CoursesView;
