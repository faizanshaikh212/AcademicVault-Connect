import React from "react";
import AcademicResourceForm from "./AcademicResourceForm";

interface AcademicResource {
  _id: string;
  title: string;
  [key: string]: any;
}

interface Props {
  isOpen: boolean;
  resourceType: "notes" | "questionPapers" | "syllabus" | "timetables";
  resource: AcademicResource | null;
  // optional transformed initial values when the wrapper needs to change shape
  initialValues?: any;
  onClose: () => void;
  onSubmit: (values: any) => Promise<void>;
}

const ResourceEditModal: React.FC<Props> = ({
  isOpen,
  resourceType,
  resource,
  initialValues,
  onClose,
  onSubmit,
}) => {
  if (!isOpen || !resource) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Edit {resource?.title}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            ✕
          </button>
        </div>

        <div className="p-6">
          <AcademicResourceForm
            resourceType={resourceType as any}
            createMode={false}
            initialValues={initialValues ?? resource}
            onCancel={onClose}
            onSubmit={async (values) => {
              await onSubmit(values);
            }}
            submitLabel="Save"
          />
        </div>
      </div>
    </div>
  );
};

export default ResourceEditModal;
