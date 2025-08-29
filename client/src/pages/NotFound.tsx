import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { AlertTriangle } from "lucide-react";

const NotFound: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center text-center py-20 pt-40">
      <AlertTriangle className="h-16 w-16 text-yellow-500 mb-4" />
      <h1 className="text-6xl font-extrabold text-gray-800 dark:text-white">
        404
      </h1>
      <h2 className="text-2xl font-semibold mt-2 mb-4">Page Not Found</h2>
      <p className="text-gray-600 dark:text-gray-400 max-w-sm mb-8">
        Sorry, the page you are looking for does not exist or has been moved.
      </p>
      <Button asChild>
        <Link to="/">Go Back Home</Link>
      </Button>
    </div>
  );
};

export default NotFound;
