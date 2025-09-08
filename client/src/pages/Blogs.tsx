import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "@/services/api";
import { Blog } from "../types";
import BlogCard from "@/components/shared/BlogCard";
import { Button } from "@/components/ui/Button";
import { Plus } from "lucide-react";
import NewsletterSubscribe from "@/components/shared/NewsletterSubscribe";
import AdvancedSearch from "@/components/shared/AdvancedSearch";
import Sort from "@/components/shared/Sort";

const Blogs: React.FC = () => {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [filteredBlogs, setFilteredBlogs] = useState<Blog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // advanced search + sort state
  const [searchTerm, setSearchTerm] = useState(""); // active filter applied to list
  const [searchQuery, setSearchQuery] = useState(""); // live input
  const [showFilters, setShowFilters] = useState(false);
  const [sortOption, setSortOption] = useState<string>("newest");

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        const { data } = await api.get<Blog[]>("/blogs");
        setBlogs(data);
        setFilteredBlogs(data);
      } catch (err) {
        setError("Failed to fetch blogs. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchBlogs();
  }, []);

  useEffect(() => {
    const results = blogs.filter(
      (blog) =>
        blog.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        blog.tags.some((tag: string) =>
          tag.toLowerCase().includes(searchTerm.toLowerCase())
        )
    );
    setFilteredBlogs(results);
  }, [searchTerm, blogs]);

  const sortedAndFiltered = filteredBlogs.slice().sort((a, b) => {
    if (sortOption === "newest")
      return +new Date(b.createdAt) - +new Date(a.createdAt);
    if (sortOption === "oldest")
      return +new Date(a.createdAt) - +new Date(b.createdAt);
    if (sortOption === "title_asc") return a.title.localeCompare(b.title);
    if (sortOption === "title_desc") return b.title.localeCompare(a.title);
    return 0;
  });

  return (
    <div className="relative w-full min-h-screen pt-30">
      <div className="absolute inset-0 -z-10"></div>
      <div className="container mx-auto px-4 pb-8">
        {/* Page Header */}
        <div className="flex flex-col items-start justify-between gap-4 border-b pb-6 md:flex-row md:items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
              Community Blogs
            </h1>
            <p className="mt-2 text-gray-300">
              Insights, tutorials, and stories from our community.
            </p>
          </div>
          <Button asChild>
            <Link to="/blogs/new">
              <Plus className="mr-2 h-4 w-4" /> Write an Article
            </Link>
          </Button>
        </div>
      </div>

      <div className="bg-gray-50/90 dark:bg-gray-900/90 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-12">
          <div className="mb-6">
            <AdvancedSearch
              title={"Search articles"}
              searchQuery={searchQuery}
              onSearchChange={(v) => setSearchQuery(v)}
              onSearch={() => setSearchTerm(searchQuery)}
              showFilters={showFilters}
              setShowFilters={setShowFilters}
              showFilterButton={false}
            />

            <div className="flex items-center justify-between mt-2 mb-6">
              <div />
              <Sort
                options={[
                  { value: "newest", label: "Newest" },
                  { value: "oldest", label: "Oldest" },
                  { value: "title_asc", label: "Title A-Z" },
                  { value: "title_desc", label: "Title Z-A" },
                ]}
                value={sortOption}
                onChange={(v) => setSortOption(v)}
                className="mt-0"
              />
            </div>
          </div>

          <div className="min-h-[400px]">
            {isLoading ? (
              <p className="text-center">Loading articles...</p>
            ) : error ? (
              <p className="text-center text-red-500">{error}</p>
            ) : sortedAndFiltered.length > 0 ? (
              <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {sortedAndFiltered.map((blog) => (
                  <BlogCard
                    key={blog._id}
                    blog={blog}
                    onDelete={() =>
                      setBlogs((prevBlogs) =>
                        prevBlogs.filter((b) => b._id !== blog._id)
                      )
                    }
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center min-h-[400px] bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  No Articles Found
                </p>
                <p className="text-gray-600 dark:text-gray-400 text-center max-w-md">
                  {searchTerm
                    ? "Try different keywords or remove some filters."
                    : "Be the first to share your insights with the community!"}
                </p>
              </div>
            )}
          </div>
        </div>
        <div className="border-t border-gray-200 dark:border-gray-800">
          <div className="container mx-auto px-4 py-12">
            <NewsletterSubscribe />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Blogs;
