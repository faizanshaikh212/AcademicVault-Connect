import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "@/services/api";
import NewsletterSubscribe from "@/components/shared/NewsletterSubscribe";
import AdvancedSearch from "@/components/shared/AdvancedSearch";
import Sort from "@/components/shared/Sort";
import CoverMedia from "@/components/shared/CoverMedia";
import { Newspaper } from "lucide-react";
import { formatDistance } from "date-fns";

interface NewsItem {
  _id: string;
  title: string;
  summary: string;
  content: string;
  coverImage: string;
  author: {
    username: string;
  };
  createdAt: string;
  tags: string[];
}

const NewsPage: React.FC = () => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState("created-desc");

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const response = await api.get("/news");
        setNews(response.data);
      } catch (error) {
        console.error("Failed to fetch news:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-sm text-slate-500 dark:text-gray-400">
        Loading news...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pt-20 dark:bg-gray-900">
      <header className="px-5 py-10 md:px-8 md:py-14">
        <div className="container mx-auto w-full max-w-[120rem]">
          <p className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.18em] text-blue-600 dark:text-blue-400">
            <Newspaper className="h-4 w-4" aria-hidden="true" />
            Updates
          </p>
          <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-slate-950 dark:text-white sm:text-5xl">
            Latest News
          </h1>
          <p className="mt-3 max-w-2xl text-lg leading-8 text-slate-600 dark:text-gray-400">
            News and updates for the Academic Vault community.
          </p>
        </div>
      </header>
      <div className="container mx-auto w-full max-w-[120rem] px-5 py-10 md:px-8 md:py-14">

        <AdvancedSearch
          title="News"
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onSearch={() => {
            /* optional server search */
          }}
          showFilters={false}
          setShowFilters={() => {}}
          debounceMs={250}
          showFilterButton={false}
        />

        <div className="mt-4 mb-6 flex items-center justify-end">
          <Sort
            options={[
              { value: "created-desc", label: "Newest" },
              { value: "created-asc", label: "Oldest" },
              { value: "title-asc", label: "Title A-Z" },
              { value: "title-desc", label: "Title Z-A" },
            ]}
            value={sortOption}
            onChange={(v) => setSortOption(v)}
          />
        </div>
        <div className="mb-16 grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {news
            .filter((item) =>
              item.title.toLowerCase().includes(searchQuery.toLowerCase())
            )
            .sort((a, b) => {
              switch (sortOption) {
                case "created-asc":
                  return (
                    new Date(a.createdAt).getTime() -
                    new Date(b.createdAt).getTime()
                  );
                case "created-desc":
                  return (
                    new Date(b.createdAt).getTime() -
                    new Date(a.createdAt).getTime()
                  );
                case "title-asc":
                  return a.title.localeCompare(b.title);
                case "title-desc":
                  return b.title.localeCompare(a.title);
                default:
                  return 0;
              }
            })
            .map((item) => (
              <article
                key={item._id}
                className="group flex h-full flex-col overflow-hidden"
              >
                <Link to={`/news/${item._id}`} className="flex h-full flex-col">
                  <div className="aspect-[16/10] overflow-hidden bg-gray-100 dark:bg-gray-800">
                    <CoverMedia
                      src={item.coverImage || undefined}
                      alt={item.title}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-3">
                        {item.tags?.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                      <h2 className="mb-2 text-xl font-semibold text-slate-900 dark:text-white">
                        {item.title}
                      </h2>
                      <p className="text-sm leading-6 text-slate-600 dark:text-gray-400 line-clamp-3">
                        {item.summary}
                      </p>
                    </div>
                    <div className="mt-6 flex items-center border-t border-gray-200 pt-4 dark:border-gray-700">
                      <div className="flex-shrink-0">
                        <span className="sr-only">
                          {item.author?.username || "Anonymous"}
                        </span>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {item.author?.username || "Anonymous"}
                        </p>
                        <div className="flex space-x-1 text-sm text-gray-500 dark:text-gray-400">
                          <time dateTime={item.createdAt}>
                            {formatDistance(
                              new Date(item.createdAt),
                              new Date(),
                              { addSuffix: true }
                            )}
                          </time>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              </article>
            ))}
        </div>

        <NewsletterSubscribe />
      </div>
    </div>
  );
};

export default NewsPage;
