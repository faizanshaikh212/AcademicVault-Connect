import React, { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { Menu, Mail } from "lucide-react";
import { cn } from "../../lib/utils";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { useAuth } from "../../hooks/useAuth";

import {
  LayoutDashboard,
  BookOpen,
  FileText,
  Clock,
  GraduationCap,
} from "lucide-react";
const teacherNavLinks = [
  { name: "Dashboard", href: "/teacher", icon: LayoutDashboard },
  { name: "Notice Management", href: "/teacher/notices", icon: Mail },
  { name: "Course Management", href: "/teacher/courses", icon: BookOpen },
  {
    name: "Student Management",
    href: "/teacher/students",
    icon: GraduationCap,
  },
  { name: "Academic Notes", href: "/teacher/notes", icon: BookOpen },
  { name: "Question Papers", href: "/teacher/question-papers", icon: FileText },
  { name: "Syllabus", href: "/teacher/syllabus", icon: GraduationCap },
  { name: "Timetables", href: "/teacher/timetables", icon: Clock },
];

const TeacherLayout: React.FC = () => {
  const { user } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  return (
    <div className="flex flex-col min-h-screen bg-gray-100 dark:bg-gray-950">
      {/* Top Navbar */}
      <Navbar />
      <div className="flex flex-1 pt-20">
        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="lg:hidden fixed bottom-4 right-4 z-20 p-3 rounded-full bg-green-600 text-white shadow-lg"
        >
          <Menu className="h-6 w-6" />
        </button>

        {/* Sidebar - Mobile: Overlay, Desktop: Fixed */}
        <aside
          className={cn(
            "fixed inset-y-0 left-0 transform lg:relative lg:translate-x-0 transition duration-200 ease-in-out z-30 lg:z-0",
            "bg-white dark:bg-gray-900 border-r dark:border-gray-800",
            "w-64 lg:w-64 flex-shrink-0 pt-20 lg:pt-0",
            isSidebarOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <div className="h-20 flex items-center justify-center border-b dark:border-gray-800">
            <h1 className="text-xl font-bold text-green-700 dark:text-green-400">
              Teacher Panel
            </h1>
          </div>
          <nav className="p-4">
            <ul className="space-y-2">
              {teacherNavLinks.map((link) => (
                <li key={link.name}>
                  <NavLink
                    to={link.href}
                    end={link.href === "/teacher"}
                    onClick={() => setIsSidebarOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                        isActive
                          ? "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-white"
                          : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                      )
                    }
                  >
                    <link.icon className="h-5 w-5" />
                    {link.name}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        {/* Backdrop */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 lg:hidden z-20"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-20 flex items-center px-4 sm:px-8 bg-white dark:bg-gray-900 border-b dark:border-gray-800">
            <div className="flex items-center gap-4">
              {user ? (
                <a
                  href={`/profile/${user.username}`}
                  className="text-base sm:text-lg font-semibold text-green-700 dark:text-green-400 hover:underline truncate"
                >
                  Welcome, {user.username}!
                </a>
              ) : (
                <h2 className="text-base sm:text-lg font-semibold truncate">
                  Welcome, Teacher!
                </h2>
              )}
            </div>
          </header>
          <main className="app-main min-w-0 w-full flex-1 overflow-y-auto p-4 sm:p-8 xl:px-10">
            <Outlet />
          </main>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default TeacherLayout;
