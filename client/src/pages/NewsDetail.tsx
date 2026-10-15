import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "@/services/api";
import NewsletterSubscribe from "@/components/shared/NewsletterSubscribe";
import { formatDistance } from "date-fns";
import MarkdownContent from "@/components/shared/MarkdownContent";
import CoverMedia from "@/components/shared/CoverMedia";
import { isIframeSupported, getIframeSrc } from "@/utils/fileUtils";

interface Attachment {
  _id: string;
  title: string;
  url: string;
}

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
  attachments: Attachment[];
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
      <div className="flex min-h-[60vh] items-center justify-center text-sm text-slate-500 dark:text-gray-400">
        Loading...
      </div>
    );
  }

  if (!news) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-sm text-slate-500 dark:text-gray-400">
        News not found
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white py-12 pt-28 dark:bg-gray-900">
      <article className="container mx-auto w-full max-w-5xl px-5 sm:px-6">
        {/* Cover Image */}
        <div className="relative mx-auto mb-8 max-w-4xl overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800">
          <CoverMedia
            src={news.coverImage || undefined}
            alt={news.title}
            className="aspect-[16/9] w-full object-cover"
          />
        </div>

        {/* Header */}
        <header className="mb-8">
          <h1 className="mb-4 text-4xl font-extrabold tracking-tight text-slate-950 dark:text-white sm:text-5xl">
            {news.title}
          </h1>

          {/* Meta information */}
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 text-gray-500 dark:text-gray-400">
            <div className="flex flex-wrap items-center gap-2 sm:gap-4">
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
        <div className="mb-16 border-t border-gray-200 pt-8 dark:border-gray-700">
          <article>
            <MarkdownContent content={news.content} />
          </article>

          {/* Attachments Section */}
          {news.attachments && news.attachments.length > 0 && (
            <div className="mt-8 border-t dark:border-gray-700 pt-6">
              <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                Attachments
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {news.attachments.map((attachment) => {
                  const isIframe = isIframeSupported(attachment.url);
                  return (
                    <div
                      key={attachment._id}
                      className="flex flex-col bg-gray-50 dark:bg-gray-800 rounded-lg overflow-hidden"
                    >
                      {isIframe ? (
                        <div className="relative w-full pt-[56.25%]">
                          <iframe
                            src={getIframeSrc(attachment.url)}
                            className="absolute top-0 left-0 w-full h-full border-0"
                            allowFullScreen
                            title={attachment.title}
                          />
                        </div>
                      ) : (
                        <div className="p-4">
                          <div className="flex items-center space-x-3">
                            <svg
                              className="w-6 h-6 text-gray-500 dark:text-gray-400 flex-shrink-0"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                              />
                            </svg>
                            <a
                              href={attachment.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 dark:text-blue-400 hover:underline line-clamp-1"
                            >
                              {attachment.title}
                            </a>
                          </div>
                        </div>
                      )}
                      <div className="p-4 bg-gray-100 dark:bg-gray-700">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600 dark:text-gray-300 line-clamp-1">
                            {attachment.title}
                          </span>
                          <a
                            href={attachment.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-2 p-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                            title="Open in new tab"
                          >
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                              />
                            </svg>
                          </a>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Newsletter Subscribe */}
        <NewsletterSubscribe />
      </article>
    </div>
  );
};

export default NewsDetail;
