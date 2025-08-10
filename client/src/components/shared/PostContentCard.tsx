import React from "react";
import { Link } from "react-router-dom";

interface PostContentCardProps {
  to: string;
  title: string;
  description: string;
}

const PostContentCard: React.FC<PostContentCardProps> = ({
  to,
  title,
  description,
}) => {
  return (
    <Link
      to={to}
      className="group relative flex flex-col h-full rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 overflow-hidden transition-all duration-200 hover:border-gray-300 dark:hover:border-gray-700 hover:shadow-md"
    >
      <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="p-4 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 group-hover:scale-110 transition-transform duration-200">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-gray-600 dark:text-gray-300"
          >
            <path d="M5 12h14" />
            <path d="M12 5v14" />
          </svg>
        </div>
      </div>
      <div className="p-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
          {title}
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {description}
        </p>
      </div>
    </Link>
  );
};

export default PostContentCard;
