import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import api from "@/services/api";
import { Blog } from "../types";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import { Calendar, User as UserIcon, Edit } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

const BlogDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [blog, setBlog] = useState<Blog | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user: currentUser } = useAuth();

  useEffect(() => {
    const fetchBlog = async () => {
      if (!id) return;
      setIsLoading(true);
      try {
        const { data } = await api.get<Blog>(`/blogs/${id}`);
        setBlog(data);
      } catch (err) {
        setError("Failed to fetch blog post.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchBlog();
  }, [id]);

  if (isLoading) return <div className="text-center py-20">Loading...</div>;
  if (error)
    return <div className="text-center py-20 text-red-500">{error}</div>;
  if (!blog)
    return <div className="text-center py-20">Blog post not found.</div>;

  const isAuthor = currentUser?._id === blog.author._id;

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8 pt-30">
      <div className="relative">
        <img
          src={blog.coverImage}
          alt={blog.title}
          className="w-full h-96 object-cover rounded-lg shadow-lg mb-8"
        />
        {isAuthor && (
          <Button asChild className="absolute top-4 right-4 z-10">
            <Link to={`/blogs/edit/${blog._id}`}>
              <Edit className="mr-2 h-4 w-4" /> Edit Article
            </Link>
          </Button>
        )}
      </div>
      <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-4">
        {blog.title}
      </h1>

      <div className="flex items-center gap-6 text-sm text-gray-500 dark:text-gray-400 mb-8">
        <div className="flex items-center gap-2">
          <UserIcon className="h-5 w-5" />
          <Link
            to={`/profile/${blog.author.username}`}
            className="hover:underline"
          >
            {blog.author.username}
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          <span>{new Date(blog.createdAt).toLocaleDateString()}</span>
        </div>
      </div>

      {/* Markdown content with syntax highlighting */}
      <article className="markdown-content">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeRaw]}
          components={{
            img: ({ node, alt, src, ...props }) => (
              <img
                alt={alt}
                src={src}
                {...props}
                className="max-w-full h-auto"
              />
            ),
            ul: ({ node, ...props }) => (
              <ul className="list-disc list-inside my-4" {...props} />
            ),
            ol: ({ node, ...props }) => (
              <ol className="list-decimal list-inside my-4" {...props} />
            ),
            li: ({ node, children, ...props }) => (
              <li className="ml-4 mb-2" {...props}>
                {children}
              </li>
            ),
            h1: ({ node, children, ...props }) => (
              <h1
                className="text-4xl font-bold mb-6 pb-2 border-b border-gray-600"
                {...props}
              >
                {children}
              </h1>
            ),
            h2: ({ node, children, ...props }) => (
              <h2
                className="text-3xl font-bold mb-4 pb-2 border-b border-gray-600"
                {...props}
              >
                {children}
              </h2>
            ),
            h3: ({ node, children, ...props }) => (
              <h3 className="text-2xl font-bold mb-3" {...props}>
                {children}
              </h3>
            ),
            h4: ({ node, children, ...props }) => (
              <h4 className="text-xl font-bold mb-2" {...props}>
                {children}
              </h4>
            ),
            code: (props) => {
              const { children, className } = props;
              const language = className
                ? className.replace("language-", "")
                : "text";

              // For inline code
              if (!className) {
                return (
                  <code className="bg-[#1f2428] text-[#e6edf3] rounded px-1.5 py-0.5 text-[0.9em] font-mono">
                    {children}
                  </code>
                );
              }

              // For code blocks
              /**
               * Copies code block content to clipboard
               * Removes trailing newline for cleaner copy
               * @function copyCode
               */
              const copyCode = () => {
                navigator.clipboard.writeText(
                  String(children).replace(/\n$/, "")
                );
              };

              return (
                <div className="relative group my-4">
                  <button
                    onClick={copyCode}
                    className="absolute right-2 top-2 p-2 rounded-lg bg-[#30363d] opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10"
                    title="Copy code"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-gray-300 hover:text-white"
                    >
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                    </svg>
                  </button>
                  <SyntaxHighlighter
                    language={language}
                    style={vscDarkPlus}
                    customStyle={{
                      margin: "0",
                      padding: "16px",
                      background: "none",
                      backgroundColor: "#0d1117",
                      border: "1px solid #30363d",
                      borderRadius: "6px",
                    }}
                  >
                    {String(children).replace(/\n$/, "")}
                  </SyntaxHighlighter>
                </div>
              );
            },
            a: ({ href, children }) => (
              <a
                href={href}
                className="text-blue-600 dark:text-blue-400 no-underline hover:underline"
                target={href?.startsWith("http") ? "_blank" : undefined}
                rel={
                  href?.startsWith("http") ? "noopener noreferrer" : undefined
                }
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
          }}
        >
          {blog.content}
        </ReactMarkdown>
      </article>
    </div>
  );
};

export default BlogDetail;
