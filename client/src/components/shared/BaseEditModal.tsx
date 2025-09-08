import React from "react";
import { X } from "lucide-react";

interface BaseEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
}

export const BaseEditModal: React.FC<
  React.PropsWithChildren<BaseEditModalProps>
> = ({ isOpen, onClose, title, description, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start sm:items-center justify-center z-50 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-3xl w-full mx-4 my-8 sm:my-12 max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {title}
            </h2>
            {description && (
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {description}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="overflow-y-auto max-h-[calc(90vh-96px)]">
          {children}
        </div>
      </div>
    </div>
  );
};

export const FormField: React.FC<{
  label: string;
  id: string;
  children: React.ReactNode;
}> = ({ label, id, children }) => (
  <div>
    <label
      htmlFor={id}
      className="block text-sm font-medium text-gray-700 dark:text-gray-300"
    >
      {label}
    </label>
    {children}
  </div>
);

export const InputField: React.FC<{
  type?: "text" | "number" | "url";
  id: string;
  value: string | number;
  onChange: (value: string) => void;
  placeholder?: string;
  min?: number;
  max?: number;
  required?: boolean;
  disabled?: boolean;
}> = ({
  type = "text",
  id,
  value,
  onChange,
  placeholder,
  min,
  max,
  required,
  disabled,
}) => (
  <input
    type={type}
    id={id}
    value={value}
    onChange={(e) => onChange(e.target.value)}
    className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
      disabled ? "opacity-50 cursor-not-allowed" : ""
    }`}
    placeholder={placeholder}
    min={min}
    max={max}
    required={required}
    disabled={disabled}
  />
);

export const SelectField: React.FC<{
  id: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  required?: boolean;
}> = ({ id, value, onChange, options, required }) => (
  <select
    id={id}
    value={value}
    onChange={(e) => onChange(e.target.value)}
    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
    required={required}
  >
    <option value="">Select Option</option>
    {options.map((option) => (
      <option key={option.value} value={option.value}>
        {option.label}
      </option>
    ))}
  </select>
);

export const TextAreaField: React.FC<{
  id: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
}> = ({ id, value, onChange, rows = 3 }) => (
  <textarea
    id={id}
    value={value}
    onChange={(e) => onChange(e.target.value)}
    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
    rows={rows}
  />
);

export const FormActions: React.FC<{
  onClose: () => void;
  loading?: boolean;
  submitLabel?: string;
}> = ({ onClose, loading = false, submitLabel = "Save Changes" }) => (
  <div className="flex justify-end space-x-3 pt-4">
    <button
      type="button"
      onClick={onClose}
      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
    >
      Cancel
    </button>
    <button
      type="submit"
      disabled={loading}
      className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? "Saving..." : submitLabel}
    </button>
  </div>
);

export default BaseEditModal;
