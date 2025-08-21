import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "@/services/api";
import NewsletterSubscribe from "@/components/shared/NewsletterSubscribe";
import { formatDistance } from "date-fns";
import MarkdownContent from "@/components/shared/MarkdownContent";

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
          <article>
            <MarkdownContent content={news.content} />
          </article>
        </div>

        {/* Newsletter Subscribe */}
        <NewsletterSubscribe />
      </article>
    </div>
  );
};

export default NewsDetail;
