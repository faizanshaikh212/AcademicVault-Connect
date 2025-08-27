import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import {
  AlertTriangle,
  ChevronLeft,
  Home,
  School,
  BookOpen,
  Bell,
  ClipboardList,
  User,
  FileText,
  Settings,
} from "lucide-react";

const NotFound: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const goBack = () => {
    navigate(-1);
  };

  // Get role-specific quick links
  const getQuickLinks = () => {
    const commonLinks = [
      {
        label: "Home",
        path: "/",
        icon: Home,
        description: "Return to the homepage",
      },
      {
        label: "Projects",
        path: "/projects",
        icon: BookOpen,
        description: "Browse academic projects",
      },
      {
        label: "Blogs",
        path: "/blogs",
        icon: FileText,
        description: "Read academic blogs",
      },
    ];

    if (!user) {
      return commonLinks;
    }

    // Add profile and settings for all logged-in users
    const userLinks = [
      ...commonLinks,
      {
        label: "Profile",
        path: `/profile/${user.username}`,
        icon: User,
        description: "View your profile",
      },
      {
        label: "Settings",
        path: "/settings",
        icon: Settings,
        description: "Manage your account",
      },
    ];

    if (user.role.includes("teacher")) {
      return [
        ...userLinks,
        {
          label: "Teacher Panel",
          path: "/teacher",
          icon: School,
          description: "Access your teaching dashboard",
        },
        {
          label: "Notices",
          path: "/notices",
          icon: Bell,
          description: "Manage class notices",
        },
        {
          label: "Assignments",
          path: "/assignments",
          icon: ClipboardList,
          description: "Manage student assignments",
        },
      ];
    }

    // Student-specific links
    return [
      ...userLinks,
      {
        label: "Notices",
        path: "/notices",
        icon: Bell,
        description: "View class notices",
      },
      {
        label: "Assignments",
        path: "/assignments",
        icon: ClipboardList,
        description: "View your assignments",
      },
    ];
  };

  const quickLinks = getQuickLinks();

  return (
    <div className="min-h-[80vh] container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        {/* 404 Header */}
        <div className="text-center mb-12">
          <AlertTriangle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
          <h1 className="text-6xl font-extrabold text-gray-800 dark:text-white mb-4">
            404
          </h1>
          <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-300 mb-4">
            Page Not Found
          </h2>
          <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
            We couldn't find the page you're looking for. Here are some helpful
            links to get you back on track:
          </p>
        </div>

        {/* Quick Links Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {quickLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className="p-4 border border-gray-200 dark:border-gray-800 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all duration-200 group"
            >
              <div className="flex flex-col items-center text-center space-y-2">
                <link.icon className="w-6 h-6 text-gray-600 dark:text-gray-400 group-hover:text-blue-500 dark:group-hover:text-blue-400" />
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {link.label}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {link.description}
                </span>
              </div>
            </Link>
          ))}
        </div>

        {/* Back Button */}
        <div className="flex justify-center space-x-4">
          <Button
            onClick={goBack}
            variant="outline"
            className="flex items-center gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            Go Back
          </Button>
          <Button asChild>
            <Link to="/" className="flex items-center gap-2">
              <Home className="w-4 h-4" />
              Home
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
