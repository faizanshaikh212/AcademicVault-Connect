import React from "react";
import { Search, Filter } from "lucide-react";

type AdvancedSearchProps = {
  title?: string;
  searchQuery: string;
  onSearchChange: (v: string) => void;
  onSearch: () => void;
  showFilters: boolean;
  setShowFilters: (s: boolean) => void;
  filtersNode?: React.ReactNode;
  debounceMs?: number;
  showFilterButton?: boolean;
  rightNode?: React.ReactNode;
};

const AdvancedSearch: React.FC<AdvancedSearchProps> = ({
  title,
  searchQuery,
  onSearchChange,
  onSearch,
  showFilters,
  setShowFilters,
  filtersNode,
  debounceMs,
  showFilterButton = true,
  rightNode,
}) => {
  // debounced live search: call onSearch after user stops typing
  React.useEffect(() => {
    const ms = debounceMs ?? 250;
    const id = setTimeout(() => {
      onSearch();
    }, ms);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {title}
            </h2>
          </div>
        </div>
      </div>

      <div className="flex gap-4 mb-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onSearch()}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>

        {rightNode && <div className="flex items-center">{rightNode}</div>}

        {showFilterButton !== false && (
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors ${
              showFilters
                ? "bg-blue-50 border-blue-300 text-blue-700 dark:bg-blue-900 dark:border-blue-600 dark:text-blue-300"
                : "border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            }`}
          >
            <Filter className="w-5 h-5" />
            Filters
          </button>
        )}

        <button
          onClick={onSearch}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          Search
        </button>
      </div>

      {/* Sort is handled by a separate Sort component to keep AdvancedSearch focused on search & filters */}

      {showFilters && (
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          {filtersNode}
        </div>
      )}
    </div>
  );
};

export default AdvancedSearch;
