import React, { useId } from "react";
import { cn } from "@/lib/utils";

export interface RadioOption {
  value: string;
  label: string;
}

export interface RadioGroupProps
  extends Omit<React.FieldsetHTMLAttributes<HTMLFieldSetElement>, "onChange"> {
  options: RadioOption[];
  name: string;
  value?: string;
  onChange?: (value: string) => void;
  label?: string;
  error?: string;
}

export const RadioGroup = React.forwardRef<
  HTMLFieldSetElement,
  RadioGroupProps
>(
  (
    { className, options, name, value, onChange, label, error, ...props },
    ref
  ) => {
    const groupId = useId();

    return (
      <fieldset ref={ref} className={cn("space-y-2", className)} {...props}>
        {label && (
          <legend className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
            {label}
          </legend>
        )}
        <div className="space-y-2">
          {options.map((option) => {
            const id = `${groupId}-${option.value}`;
            return (
              <div key={option.value} className="flex items-center">
                <input
                  type="radio"
                  id={id}
                  name={name}
                  value={option.value}
                  checked={value === option.value}
                  onChange={(e) => onChange?.(e.target.value)}
                  className={cn(
                    "w-4 h-4 text-blue-600 bg-gray-100 border-gray-300",
                    "focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600",
                    "dark:bg-gray-700 dark:border-gray-600",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                    error && "border-red-500"
                  )}
                />
                <label
                  htmlFor={id}
                  className={cn(
                    "ml-2 text-sm font-medium text-gray-900 dark:text-gray-300",
                    props.disabled && "opacity-50 cursor-not-allowed"
                  )}
                >
                  {option.label}
                </label>
              </div>
            );
          })}
        </div>
        {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
      </fieldset>
    );
  }
);

RadioGroup.displayName = "RadioGroup";
