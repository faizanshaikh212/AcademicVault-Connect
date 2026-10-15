import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

const Footer: React.FC = () => {
  const { setCookieModalOpen } = useAuth();

  return (
    <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
      <div className="container mx-auto w-full max-w-[120rem] px-4 py-12 sm:px-6 xl:px-10">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* Logo and Summary */}
          <div className="md:col-span-2 lg:col-span-1">
            <Link
              to="/"
              className="text-2xl font-bold text-gray-800 dark:text-white"
            >
              Academic<span className="text-blue-600">Vault</span>
            </Link>
            <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
              Find and share notes, past papers, syllabi, timetables, and
              projects.
            </p>
            <p className="mt-4 text-xs text-gray-500 dark:text-gray-500">
              Extension made with <span className="text-blue-500">♥</span> by
              Fayz212
            </p>
          </div>

          {/* Navigate Links */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white tracking-wider uppercase">
              Navigate
            </h3>
            <ul className="mt-4 space-y-2">
              <li>
                <Link
                  to="/projects"
                  className="text-sm text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
                >
                  Projects
                </Link>
              </li>
              <li>
                <Link
                  to="/academic/notes"
                  className="text-sm text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
                >
                  Academic Notes
                </Link>
              </li>
              <li>
                <Link
                  to="/academic/question-papers"
                  className="text-sm text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
                >
                  Question Papers
                </Link>
              </li>
              <li>
                <Link
                  to="/academic/syllabus"
                  className="text-sm text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
                >
                  Syllabus
                </Link>
              </li>
              <li>
                <Link
                  to="/academic/timetables"
                  className="text-sm text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
                >
                  Timetables
                </Link>
              </li>
              <li>
                <Link
                  to="/blogs"
                  className="text-sm text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
                >
                  Blogs
                </Link>
              </li>
              <li>
                <Link
                  to="/about-us"
                  className="text-sm text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  to="/purpose"
                  className="text-sm text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
                >
                  Our Purpose
                </Link>
              </li>
              <li>
                <Link
                  to="/network"
                  className="text-sm text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
                >
                  Our Network
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white tracking-wider uppercase">
              Legal
            </h3>
            <ul className="mt-4 space-y-2">
              <li>
                <Link
                  to="/terms"
                  className="text-sm text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
                >
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link
                  to="/privacy"
                  className="text-sm text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  to="/contact"
                  className="text-sm text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
                >
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Subscribe */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white tracking-wider uppercase">
              Subscribe
            </h3>
            <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
              Get the latest news and updates from our platform.
            </p>
            {/* Newsletter form can be added here later */}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 border-t border-gray-200 dark:border-gray-800 pt-8 flex flex-col md:flex-row items-center justify-between">
          <div className="flex items-center gap-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              &copy; {new Date().getFullYear()} Academic Vault Connect. All
              Rights Reserved.
            </p>
            <button
              onClick={() => setCookieModalOpen(true)}
              className="text-sm text-gray-600 dark:text-gray-300 underline"
              aria-label="Manage cookies"
            >
              Manage cookies
            </button>
          </div>

        </div>
      </div>
    </footer>
  );
};

export default Footer;
