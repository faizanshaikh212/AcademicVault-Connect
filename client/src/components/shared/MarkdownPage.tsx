import React from "react";
import { cn } from "@/lib/utils";
import MarkdownContent from "./MarkdownContent";

interface MarkdownPageProps {
  title: string;
  content: string;
  className?: string;
}

const MarkdownPage: React.FC<MarkdownPageProps> = ({
  title,
  content,
  className,
}) => {
  return (
    <div
      className={cn("container mx-auto px-4 py-8 max-w-7xl pt-30", className)}
    >
      <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">
        {title}
      </h1>
      <div className="bg-white dark:bg-gray-900 p-8 rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm">
        <MarkdownContent content={content} />
      </div>
    </div>
  );
};

export default MarkdownPage;
