import React from "react";
import { NavLink, Outlet } from "react-router-dom";
import { LayoutDashboard, Users, UserCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import Navbar from "./Navbar";
import { useAuth } from "@/hooks/useAuth";

const adminNavLinks = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "User Management", href: "/admin/users", icon: Users },
  { name: "Role Requests", href: "/admin/requests", icon: UserCheck },
  { name: "Customer Care", href: "/admin/customer-care", icon: UserCheck },
];

const AdminLayout: React.FC = () => {
  const { user } = useAuth();
  return (
    <div className="flex flex-col min-h-screen bg-gray-100 dark:bg-gray-950">
      {/* Top Navbar */}
      <Navbar />
      <div className="flex flex-1 pt-20">
        {" "}
        {/* Add pt-20 to push content below fixed navbar */}
        {/* Sidebar */}
        <aside className="w-64 flex-shrink-0 bg-white dark:bg-gray-900 border-r dark:border-gray-800">
          <div className="h-20 flex items-center justify-center border-b dark:border-gray-800">
            <h1 className="text-xl font-bold">Admin Panel</h1>
          </div>
          <nav className="p-4">
            <ul className="space-y-2">
              {adminNavLinks.map((link) => (
                <li key={link.name}>
                  <NavLink
                    to={link.href}
                    end={link.href === "/admin"} // 'end' prop for exact match on parent route
                    className={({ isActive }) =>
                      cn(
                        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                        isActive
                          ? "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-white"
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
        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          <header className="h-20 flex items-center px-8 bg-white dark:bg-gray-900 border-b dark:border-gray-800">
            {/* Show admin username as link to profile */}
            {user ? (
              <a
                href={`/profile/${user.username}`}
                className="text-lg font-semibold text-blue-600 hover:underline"
              >
                Welcome, {user.username}!
              </a>
            ) : (
              <h2 className="text-lg font-semibold">Welcome, Admin!</h2>
            )}
          </header>
          <main className="flex-1 p-8 overflow-y-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
