import React from "react";
import { Link } from "react-router-dom";
import { Blog } from "../../types";
import { ArrowRight } from "lucide-react";

interface BlogCardProps {
  blog: Blog;
}

const BlogCard: React.FC<BlogCardProps> = ({ blog }) => {
  // THE FIX: If for some reason a blog's author was deleted,
  // we prevent the component from crashing.
  if (!blog.author) {
    return null; // Or render a placeholder for a post with a deleted author
  }

  const createExcerpt = (text: string, length = 100) => {
    if (text.length <= length) return text;
    return text.substring(0, length) + "...";
  };

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-lg border bg-white shadow-sm transition-all hover:shadow-lg dark:border-gray-800 dark:bg-gray-900">
      <Link
        to={`/blogs/${blog._id}`}
        className="absolute inset-0 z-10"
        aria-label={blog.title}
      />

      <div className="aspect-video overflow-hidden">
        <img
          src={blog.coverImage}
          alt={blog.title}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
          {blog.title}
        </h3>
        <p className="mt-2 flex-1 text-sm text-gray-600 dark:text-gray-400">
          {createExcerpt(blog.content)}
        </p>
      </div>

      <div className="border-t p-4 dark:border-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img
              src={
                blog.author.profile?.avatar ||
                `https://i.pravatar.cc/40?u=${blog.author._id}`
              }
              alt={blog.author.username}
              className="h-8 w-8 rounded-full"
            />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {blog.author.username}
            </span>
          </div>
          <div className="flex items-center text-sm text-blue-600 transition-transform duration-300 group-hover:translate-x-1 dark:text-blue-400">
            Read <ArrowRight className="ml-1 h-4 w-4" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlogCard;
