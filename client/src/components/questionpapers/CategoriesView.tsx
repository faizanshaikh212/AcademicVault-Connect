import React from "react";
import { FileText } from "lucide-react";

interface DegreeType {
  id: string;
  name: string;
  description?: string;
}

interface Props {
  degreeTypes: DegreeType[];
  onSelect: (id: string) => void;
}

const CategoriesView: React.FC<Props> = ({ degreeTypes, onSelect }) => {
  return (
    <div className="">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {degreeTypes.map((degreeType) => (
          <div
            key={degreeType.id}
            onClick={() => onSelect(degreeType.id)}
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
    </div>
  );
};

export default CategoriesView;
