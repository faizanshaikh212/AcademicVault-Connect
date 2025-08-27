import React, { useId } from "react";
import { cn } from "@/lib/utils";

export interface SwitchProps
  extends Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    "type" | "onChange"
  > {
  label?: string;
  onCheckedChange?: (checked: boolean) => void;
}

export const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  (
    { className, label, onCheckedChange, checked, defaultChecked, ...props },
    ref
  ) => {
    const id = useId();

    return (
      <label htmlFor={id} className="flex items-center cursor-pointer">
        <div className="relative">
          <input
            id={id}
            type="checkbox"
            className="peer sr-only"
            ref={ref}
            checked={checked}
            defaultChecked={defaultChecked}
            onChange={(e) => onCheckedChange?.(e.target.checked)}
            {...props}
          />
          <div
            className={cn(
              "w-11 h-6 bg-gray-200 rounded-full relative",
              "peer-checked:bg-blue-600",
              "after:content-[''] after:absolute after:top-0.5 after:left-0.5",
              "after:bg-white after:rounded-full after:h-5 after:w-5",
              "after:transition-all peer-checked:after:translate-x-5",
              "peer-focus:ring-4 peer-focus:ring-blue-300",
              "dark:bg-gray-700 dark:peer-checked:bg-blue-500 dark:peer-focus:ring-blue-800",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              className
            )}
          />
        </div>
        {label && (
          <span className="ml-3 text-sm font-medium text-gray-900 dark:text-gray-300">
            {label}
          </span>
        )}
      </label>
    );
  }
);

Switch.displayName = "Switch";
