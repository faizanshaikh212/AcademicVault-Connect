import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import api from "@/services/api";
import { Blog } from "../types";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import { Calendar, User as UserIcon, Edit } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

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
    <div className="container mx-auto max-w-4xl px-4 py-8">
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

      {/* ADDED PROSE CLASS HERE */}
      <article className="prose prose-lg dark:prose-invert max-w-none">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {blog.content}
        </ReactMarkdown>
      </article>
    </div>
  );
};

export default BlogDetail;
