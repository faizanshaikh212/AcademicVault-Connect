import React from "react";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";
import CodeBlock from "./CodeBlock";

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
      <h1 className="text-3xl font-bold mb-8 text-white">{title}</h1>
      <div className="markdown-content github-markdown prose-invert max-w-none bg-gray-900 p-8 rounded-lg">
        <ReactMarkdown
          rehypePlugins={[rehypeRaw]}
          remarkPlugins={[remarkGfm]}
          className="text-white [&_h1]:text-white [&_h2]:text-white [&_h3]:text-white [&_p]:text-white [&_li]:text-white [&_ul]:text-white [&_ol]:text-white [&_a]:text-blue-400 [&_a:hover]:text-blue-300"
          components={{
            code: CodeBlock,
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    </div>
  );
};

export default MarkdownPage;
