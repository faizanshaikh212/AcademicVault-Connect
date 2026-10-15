import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import CodeBlock from "./CodeBlock";
import { cn } from "@/lib/utils";

interface MarkdownContentProps {
  content: string;
  className?: string;
}

const MarkdownContent: React.FC<MarkdownContentProps> = ({
  content,
  className,
}) => {
  return (
    <div
      className={cn(
        "prose dark:prose-invert max-w-none p-6 rounded-lg bg-gray-50/80 dark:bg-gray-900/80 backdrop-blur-sm border border-gray-100 dark:border-gray-800",
        className
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          img: ({ alt, src, ...props }) => (
            <img
              alt={alt}
              src={src}
              {...props}
              className="max-w-full h-auto rounded-lg"
            />
          ),
          h1: ({ children, ...props }) => (
            <h1
              className="text-4xl font-bold mb-6 pb-2 border-b border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white"
              {...props}
            >
              {children}
            </h1>
          ),
          h2: ({ children, ...props }) => (
            <h2
              className="text-3xl font-bold mb-4 pb-2 border-b border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white"
              {...props}
            >
              {children}
            </h2>
          ),
          h3: ({ children, ...props }) => (
            <h3
              className="text-2xl font-bold mb-3 text-gray-900 dark:text-white"
              {...props}
            >
              {children}
            </h3>
          ),
          h4: ({ children, ...props }) => (
            <h4
              className="text-xl font-bold mb-2 text-gray-900 dark:text-white"
              {...props}
            >
              {children}
            </h4>
          ),
          p: ({ children, ...props }) => (
            <p className="mb-4 text-gray-700 dark:text-gray-300" {...props}>
              {children}
            </p>
          ),
          ul: (props) => (
            <ul
              className="list-disc list-inside my-4 text-gray-700 dark:text-gray-300"
              {...props}
            />
          ),
          ol: (props) => (
            <ol
              className="list-decimal list-inside my-4 text-gray-700 dark:text-gray-300"
              {...props}
            />
          ),
          li: ({ children, ...props }) => (
            <li
              className="ml-4 mb-2 text-gray-700 dark:text-gray-300"
              {...props}
            >
              {children}
            </li>
          ),
          code: CodeBlock,
          a: ({ href, children }) => (
            <a
              href={href}
              className="text-blue-600 dark:text-blue-400 no-underline hover:underline"
              target={href?.startsWith("http") ? "_blank" : undefined}
              rel={href?.startsWith("http") ? "noopener noreferrer" : undefined}
            >
              {children}
            </a>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto my-4">
              <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-700">
                {children}
              </table>
            </div>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-gray-300 dark:border-gray-600 pl-4 my-4 text-gray-700 dark:text-gray-300">
              {children}
            </blockquote>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownContent;
