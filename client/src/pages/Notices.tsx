import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "@/services/api";
import { formatDistance } from "date-fns";
import AdvancedSearch from "@/components/shared/AdvancedSearch";
import Sort from "@/components/shared/Sort";

interface NoticeItem {
  _id: string;
  title: string;
  summary: string;
  coverImage: string;
  author: { username: string } | null;
  createdAt: string;
  tags: string[];
}

const NoticesPage: React.FC = () => {
  const [notices, setNotices] = useState<NoticeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState("created-desc");

  useEffect(() => {
    const fetchNotices = async () => {
      try {
        const response = await api.get("/notices");
        setNotices(response.data);
      } catch (error) {
        console.error("Failed to fetch notices:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchNotices();
  }, []);

  if (loading)
    return (
      <div className="flex justify-center items-center min-h-screen">
        Loading...
      </div>
    );

  return (
    <div className="bg-white dark:bg-gray-950 min-h-screen pt-30">
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-8">
          Notices
        </h1>
        <AdvancedSearch
          title="Notices"
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

        <div className="mt-4 flex items-center justify-end">
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
        <div className="mb-4" />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {notices
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
                className="flex flex-col overflow-hidden rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 bg-white dark:bg-gray-900"
              >
                <Link to={`/notices/${item._id}`}>
                  <div className="h-48 w-full relative overflow-hidden">
                    <img
                      src={item.coverImage}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 p-6 flex flex-col">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-3">
                        {item.tags?.map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                        {item.title}
                      </h2>
                      <p className="text-gray-500 dark:text-gray-400 text-sm line-clamp-3">
                        {item.summary}
                      </p>
                    </div>
                    <div className="mt-6 flex items-center">
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
      </div>
    </div>
  );
};

export default NoticesPage;
