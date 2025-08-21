import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "@/services/api";
import NewsletterSubscribe from "@/components/shared/NewsletterSubscribe";
import { formatDistance } from "date-fns";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import CodeBlock from "@/components/shared/CodeBlock";

interface NewsItem {
  _id: string;
  title: string;
  content: string;
  coverImage: string;
  author: {
    username: string;
  };
  createdAt: string;
  tags: string[];
}

const NewsDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [news, setNews] = useState<NewsItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const response = await api.get(`/news/${id}`);
        setNews(response.data);
      } catch (error) {
        console.error("Failed to fetch news:", error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchNews();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        Loading...
      </div>
    );
  }

  if (!news) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        News not found
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-950 min-h-screen py-12 pt-30">
      <article className="container mx-auto px-4 max-w-6xl">
        {/* Cover Image */}
        <div className="w-2/3 mx-auto relative mb-8">
          <img
            src={news.coverImage}
            alt={news.title}
            className="w-full h-full object-cover rounded-lg shadow-xl"
          />
        </div>

        {/* Header */}
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            {news.title}
          </h1>

          {/* Meta information */}
          <div className="flex items-center justify-between text-gray-500 dark:text-gray-400 mb-4">
            <div className="flex items-center space-x-4">
              <span>By {news.author?.username || "Anonymous"}</span>
              <span>•</span>
              <time dateTime={news.createdAt}>
                {formatDistance(new Date(news.createdAt), new Date(), {
                  addSuffix: true,
                })}
              </time>
            </div>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2">
            {news.tags?.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
              >
                {tag}
              </span>
            ))}
          </div>
        </header>

        {/* Content */}
        <div className="border dark:border-gray-800 rounded-lg p-8 mb-16 bg-white dark:bg-gray-900">
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
                  return <CodeBlock {...props} />;
                },
                a: ({ href, children }) => (
                  <a
                    href={href}
                    className="text-blue-600 dark:text-blue-400 no-underline hover:underline"
                    target={href?.startsWith("http") ? "_blank" : undefined}
                    rel={
                      href?.startsWith("http")
                        ? "noopener noreferrer"
                        : undefined
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
              {news.content}
            </ReactMarkdown>
          </article>
        </div>

        {/* Newsletter Subscribe */}
        <NewsletterSubscribe />
      </article>
    </div>
  );
};

export default NewsDetail;
