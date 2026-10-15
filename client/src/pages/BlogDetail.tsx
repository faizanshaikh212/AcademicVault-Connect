import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import api from "@/services/api";
import { Blog } from "../types";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import { Calendar, User as UserIcon, Edit } from "lucide-react";
import MarkdownContent from "@/components/shared/MarkdownContent";
import CoverMedia from "@/components/shared/CoverMedia";

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
    <div className="min-h-screen bg-white px-5 py-10 pt-28 dark:bg-gray-900 md:px-8">
      <article className="mx-auto w-full max-w-4xl">
      <div className="relative">
        <CoverMedia
          src={blog.coverImage || undefined}
          alt={blog.title}
          className="mb-8 aspect-[16/9] w-full rounded-lg object-cover"
        />
        {isAuthor && (
          <Button asChild className="absolute top-4 right-4 z-10">
            <Link to={`/blogs/edit/${blog._id}`}>
              <Edit className="mr-2 h-4 w-4" /> Edit Article
            </Link>
          </Button>
        )}
      </div>
      <h1 className="mb-4 text-4xl font-bold text-gray-900 dark:text-white md:text-5xl">
        {blog.title}
      </h1>

      <div className="mb-8 flex flex-wrap items-center gap-6 text-sm text-gray-500 dark:text-gray-400">
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
      <article>
        <MarkdownContent content={blog.content} />
      </article>
      </article>
    </div>
  );
};

export default BlogDetail;
