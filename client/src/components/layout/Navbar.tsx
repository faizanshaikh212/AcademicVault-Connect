import React, { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import {
  Menu,
  X,
  Code,
  Users,
  Rss,
  Layers,
  User,
  Settings,
  LogOut,
  ShieldCheck,
  RotateCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getAvatarUrl } from "@/lib/avatar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/DropdownMenu";
import NotificationBell from "./NotificationBell";
import { useScrollDirection } from "@/hooks/useScrollDirection";

const navLinks = [
  { name: "Our Purpose", href: "/purpose", icon: Users },
  { name: "Our Network", href: "/network", icon: Code },
  { name: "Blogs", href: "/blogs", icon: Rss },
  { name: "Projects", href: "/projects", icon: Layers },
];

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const scrollDirection = useScrollDirection();

  const handleRefresh = () => {
    setIsRefreshing(true);
    // Add a small delay to ensure the animation is visible
    setTimeout(() => {
      window.location.reload();
    }, 300);
  };

  return (
    <header
      className={cn(
        scrollDirection === "down" ? "-translate-y-full" : "translate-y-0",
        "fixed top-0 left-0 z-50 w-full transition-all duration-300",
        "border-b border-gray-200/50 bg-white/80 backdrop-blur-lg dark:bg-gray-900/70 dark:border-gray-800/50"
      )}
    >
      <div className="container mx-auto flex h-20 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Link
            to="/"
            className="text-2xl font-bold text-gray-800 dark:text-white"
          >
            Academic<span className="text-blue-600">Vault</span>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRefresh}
            className={`transition-transform duration-300 ${
              isRefreshing ? "animate-spin" : "hover:rotate-90"
            }`}
            title="Refresh page"
            disabled={isRefreshing}
          >
            <RotateCw className="h-5 w-5" />
          </Button>
        </div>
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <NavLink
              key={link.name}
              to={link.href}
              className={({ isActive }) =>
                cn(
                  "text-sm font-medium text-gray-600 transition-colors hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400",
                  { "text-blue-600 dark:text-blue-500": isActive }
                )
              }
            >
              {link.name}
            </NavLink>
          ))}
          {/*Conditionally render Admin Panel link */}
          {user && user.role.includes("admin") && (
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                cn(
                  "text-sm font-medium text-red-500 transition-colors hover:text-red-600 dark:text-red-400 dark:hover:text-red-500 flex items-center gap-1",
                  { "font-bold": isActive }
                )
              }
            >
              <ShieldCheck className="h-4 w-4" />
              Admin Panel
            </NavLink>
          )}
        </nav>
        <div className="hidden md:flex items-center gap-4">
          {user ? (
            <>
              <NotificationBell />
              <DropdownMenu>
                <DropdownMenuTrigger>
                  <img
                    className="h-10 w-10 rounded-full object-cover cursor-pointer ring-2 ring-offset-2 ring-transparent hover:ring-blue-500 transition-all"
                    src={getAvatarUrl(user.profile?.avatar, user.updatedAt)}
                    alt={user.username}
                  />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>
                    <Link
                      to={`/profile/${user.username}`}
                      className="flex items-center w-full"
                    >
                      <User className="mr-2 h-4 w-4" />
                      <span>My Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Link to="/settings" className="flex items-center w-full">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Button asChild variant="ghost">
                <Link to="/login">Login</Link>
              </Button>
              <Button asChild>
                <Link to="/register">Register</Link>
              </Button>
            </>
          )}
        </div>
        <div className="md:hidden">
          <Button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            variant="ghost"
            size="icon"
          >
            {isMobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </Button>
        </div>
      </div>
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200/50 bg-white/95 dark:bg-gray-900/95 dark:border-gray-800/50">
          <nav className="flex flex-col space-y-2 p-4">
            {navLinks.map((link) => (
              <NavLink
                key={link.name}
                to={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 rounded-md p-2 text-base font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800",
                    { "bg-gray-100 dark:bg-gray-800": isActive }
                  )
                }
              >
                <link.icon className="h-5 w-5" />
                {link.name}
              </NavLink>
            ))}
            {/* THE FIX: Conditionally render Admin Panel link in mobile menu */}
            {user && user.role.includes("admin") && (
              <NavLink
                to="/admin"
                onClick={() => setIsMobileMenuOpen(false)}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 rounded-md p-2 text-base font-medium text-red-500 hover:bg-gray-100 dark:hover:bg-gray-800",
                    { "bg-gray-100 dark:bg-gray-800": isActive }
                  )
                }
              >
                <ShieldCheck className="h-5 w-5" />
                Admin Panel
              </NavLink>
            )}
            <div className="border-t border-gray-200/50 dark:border-gray-800/50 pt-4 mt-2 flex flex-col space-y-2">
              {user ? (
                <Button
                  onClick={() => {
                    logout();
                    setIsMobileMenuOpen(false);
                  }}
                  variant="outline"
                >
                  Logout
                </Button>
              ) : (
                <>
                  <Button asChild variant="outline">
                    <Link
                      to="/login"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Login
                    </Link>
                  </Button>
                  <Button asChild>
                    <Link
                      to="/register"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Register
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Navbar;
