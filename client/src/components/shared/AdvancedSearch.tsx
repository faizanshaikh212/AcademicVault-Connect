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
  compact?: boolean;
  /**
   * If true, AdvancedSearch will automatically call `onSearch` after any
   * child filter control's `onChange` is invoked. This helps ensure filters
   * apply immediately without the user needing to press the Search button for lazy af ppl lol.
   */
  filtersAutoApply?: boolean;
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
  compact = false,
  filtersAutoApply = true,
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

  // Helper to enhance filtersNode children so that their onChange will also
  // trigger onSearch (after a tiny delay to allow parent state to update).
  const enhanceFiltersNode = (node: React.ReactNode): React.ReactNode => {
    if (!filtersAutoApply || !node) return node;

    if (Array.isArray(node)) {
      return node.map((child, idx) => {
        const enhanced = enhanceFiltersNode(child as any);
        if (React.isValidElement(enhanced)) {
          const el = enhanced as React.ReactElement<any>;
          // If element already has a key, keep it; otherwise add a stable key
          if (el.key == null) {
            return React.cloneElement(el, { key: `filt-${idx}` });
          }
        }
        // For primitives or elements with existing keys, return as-is
        return enhanced;
      });
    }

    if (React.isValidElement(node)) {
      const child: React.ReactElement<any> = node as any;
      const props = child.props || {};

      const wrappedOnChange = (e: any, ...rest: any[]) => {
        try {
          if (typeof props.onChange === "function") props.onChange(e, ...rest);
        } catch (err) {
          // ignore
        }
        // allow parent state to update, then invoke onSearch
        setTimeout(() => {
          try {
            onSearch();
          } catch (err) {
            /* ignore */
          }
        }, 80);
      };

      // If the child already has an onChange prop, clone and wrap it
      if (props.onChange) {
        return React.cloneElement(child, {
          ...props,
          onChange: wrappedOnChange,
        });
      }

      // Otherwise, recursively process its children
      if (props.children) {
        return React.cloneElement(child, {
          ...props,
          children: enhanceFiltersNode(props.children),
        });
      }

      return child;
    }

    return node;
  };

  return (
    <div className="mb-8 border-b border-gray-200 pb-6 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div>
            <h2
              className={`text-xl font-bold text-gray-900 dark:text-white ${
                compact ? "text-lg" : "text-xl"
              }`}
            >
              {title}
            </h2>
          </div>
        </div>
      </div>

      <div className={`mb-4 flex flex-col gap-3 sm:flex-row sm:items-center ${compact ? "sm:items-center" : ""}`}>
        <div className={`flex-1 relative ${compact ? "" : ""}`}>
          <Search
            className={`absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 ${
              compact ? "w-4 h-4" : "w-5 h-5"
            }`}
          />
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onSearch()}
            className={`min-w-0 w-full pl-10 pr-4 ${
              compact ? "py-1" : "py-2"
            } border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
          />
        </div>

        {rightNode && <div className="flex items-center">{rightNode}</div>}

        {showFilterButton !== false && (
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center justify-center gap-2 px-4 sm:shrink-0 ${
              compact ? "py-1" : "py-2"
            } border rounded-lg transition-colors ${
              showFilters
                ? "bg-blue-50 border-blue-300 text-blue-700 dark:bg-blue-900 dark:border-blue-600 dark:text-blue-300"
                : "border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            }`}
          >
            <Filter className={` ${compact ? "w-4 h-4" : "w-5 h-5"}`} />
            Filters
          </button>
        )}

        <button
          onClick={onSearch}
          className={`px-6 ${
            compact ? "py-1" : "py-2"
          } rounded-lg bg-blue-600 text-white transition-colors hover:bg-blue-700 sm:shrink-0`}
        >
          Search
        </button>
      </div>

      {/* Sort is handled by a separate Sort component to keep AdvancedSearch focused on search & filters */}

      {showFilters && (
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          {enhanceFiltersNode(filtersNode)}
        </div>
      )}
    </div>
  );
};

export default AdvancedSearch;
