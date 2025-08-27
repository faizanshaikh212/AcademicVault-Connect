import * as React from "react";
import { cn } from "@/lib/utils";

export interface TextFieldProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const TextField = React.forwardRef<HTMLInputElement, TextFieldProps>(
  ({ className, type, label, error, ...props }, ref) => {
    return (
      <div className="relative w-full">
        {label && (
          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            {label}
          </label>
        )}
        <input
          type={type}
          className={cn(
            "mt-2 flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-800 dark:bg-gray-950 dark:ring-offset-gray-950 dark:placeholder:text-gray-400 dark:focus-visible:ring-gray-300",
            className,
            error && "border-red-500"
          )}
          ref={ref}
          {...props}
        />
        {error && <span className="mt-1 text-sm text-red-500">{error}</span>}
      </div>
    );
  }
);
TextField.displayName = "TextField";

export { TextField };
