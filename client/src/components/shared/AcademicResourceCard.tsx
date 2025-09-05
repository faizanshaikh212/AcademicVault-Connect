import React from 'react';
import { FileText, Download, Eye } from 'lucide-react';

// Define a generic resource type. Adjust as needed.
interface Resource {
  _id: string;
  title: string;
  description?: string;
  subject?: string;
  examYear?: number;
  fileType: string;
  downloadCount?: number;
}

interface AcademicResourceCardProps {
  resource: Resource;
  resourceType: string;
  onView: (resource: Resource) => void;
  onDownload: (resource: Resource) => void;
}

const AcademicResourceCard: React.FC<AcademicResourceCardProps> = ({ resource, onView, onDownload }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 border border-gray-200 dark:border-gray-700 overflow-hidden group">
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <FileText className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {resource.title}
              </h3>
              {resource.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {resource.description}
                </p>
              )}
            </div>
          </div>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
            {resource.fileType.toUpperCase()}
          </span>
        </div>

        <div className="mt-4 flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
          <div>
            {resource.subject && <p><strong>Subject:</strong> {resource.subject}</p>}
            {resource.examYear && <p><strong>Year:</strong> {resource.examYear}</p>}
          </div>
          <div className="text-right">
            {resource.downloadCount !== undefined && <p><strong>Downloads:</strong> {resource.downloadCount}</p>}
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-4 border-t border-gray-200 dark:border-gray-700 pt-4">
          <button
            onClick={() => onView(resource)}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
          >
            <Eye className="w-5 h-5" />
            <span>View</span>
          </button>
          <button
            onClick={() => onDownload(resource)}
            className="flex items-center gap-2 text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 transition-colors"
          >
            <Download className="w-5 h-5" />
            <span>Download</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AcademicResourceCard;
