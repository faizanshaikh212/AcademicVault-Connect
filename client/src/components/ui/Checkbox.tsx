import React, { useId } from "react";
import { cn } from "@/lib/utils";

export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
  error?: string;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, error, ...props }, ref) => {
    const id = useId();

    return (
      <div className="flex items-start">
        <div className="flex items-center h-5">
          <input
            id={id}
            type="checkbox"
            ref={ref}
            className={cn(
              "w-4 h-4 text-blue-600 border-gray-300 rounded",
              "focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600",
              "bg-gray-100 dark:bg-gray-700 border",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              error && "border-red-500",
              className
            )}
            {...props}
          />
        </div>
        {label && (
          <label
            htmlFor={id}
            className={cn(
              "ml-2 text-sm font-medium text-gray-900 dark:text-gray-300",
              props.disabled && "opacity-50 cursor-not-allowed"
            )}
          >
            {label}
          </label>
        )}
        {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
      </div>
    );
  }
);

Checkbox.displayName = "Checkbox";
