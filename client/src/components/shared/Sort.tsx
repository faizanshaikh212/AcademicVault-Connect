import React from "react";

type Option = { value: string; label: string };

type SortProps = {
  options: Option[];
  value: string;
  onChange: (v: string) => void;
  label?: string;
  className?: string;
};

const Sort: React.FC<SortProps> = ({
  options,
  value,
  onChange,
  label = "Sort by:",
  className = "",
}) => {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <label className="text-sm text-gray-600 dark:text-gray-400">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default Sort;
