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
  RefreshCcw,
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
import CopyTooltip from "@/components/ui/CopyTooltip";

const navLinks = [
  { name: "Our Purpose", href: "/purpose", icon: Users },
  { name: "Our Network", href: "/network", icon: Code },
  { name: "News", href: "/news", icon: Rss },
  { name: "Blogs", href: "/blogs", icon: Rss },
  { name: "Projects", href: "/projects", icon: Layers },
];

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isRelogging, setIsRelogging] = useState(false);
  const [copied, setCopied] = useState<{ type: "name" | "username" | null }>({
    type: null,
  });
  const scrollDirection = useScrollDirection();

  const handleRelogin = async () => {
    setIsRelogging(true);
    try {
      const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
      if (!currentUser.username) {
        setIsRelogging(false);
        return;
      }

      import("@/services/api")
        .then(async ({ default: api }) => {
          // Get fresh user data
          const { data } = await api.get(`/users/${currentUser.username}`);

          if (data) {
            // Update local storage with fresh user data
            localStorage.setItem(
              "user",
              JSON.stringify({
                ...currentUser, // Keep existing data
                role: data.role, // Update role
                premium: data.premium, // Update premium status
                profile: data.profile, // Update profile
              })
            );

            // Reload page to update all states
            window.location.reload();
          }
        })
        .catch((error) => {
          console.error("Failed to refresh:", error);
          setIsRelogging(false);
        });
    } catch (error) {
      console.error("Relogin failed:", error);
      setIsRelogging(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    // Add a small delay to ensure the animation is visible
    setTimeout(() => {
      window.location.reload();
    }, 300);
  };

  const handleCopy = (text: string, type: "name" | "username") => {
    navigator.clipboard.writeText(text);
    setCopied({ type });
    setTimeout(() => setCopied({ type: null }), 1500);
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
                <DropdownMenuTrigger asChild>
                  <button>
                    <img
                      className="h-10 w-10 rounded-full object-cover cursor-pointer ring-2 ring-offset-2 ring-transparent hover:ring-blue-500 transition-all"
                      src={getAvatarUrl(
                        user.profile?.avatar,
                        user.premium?.isPremium,
                        user.updatedAt
                      )}
                      alt={user.username}
                    />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <div className="px-4 pt-4 pb-2 flex flex-col items-start gap-2 relative">
                    <div className="flex flex-col gap-1 w-full">
                      <button
                        className="text-base font-semibold text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 px-2 py-1 rounded w-fit relative"
                        onClick={() =>
                          handleCopy(
                            `${user.firstName} ${user.lastName}`,
                            "name"
                          )
                        }
                      >
                        {user.firstName} {user.lastName}
                        {copied.type === "name" && (
                          <CopyTooltip show={true} text="Copied!" />
                        )}
                      </button>
                      <button
                        className="text-xs text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 px-2 py-1 rounded w-fit relative"
                        onClick={() => handleCopy(user.username, "username")}
                      >
                        @{user.username}
                        {copied.type === "username" && (
                          <CopyTooltip show={true} text="Copied!" />
                        )}
                      </button>
                    </div>
                  </div>
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
                  <DropdownMenuItem>
                    <Link
                      to="/projects/new"
                      className="flex items-center w-full"
                    >
                      <Layers className="mr-2 h-4 w-4" />
                      <span>Post Project</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Link to="/blogs/new" className="flex items-center w-full">
                      <Rss className="mr-2 h-4 w-4" />
                      <span>Post Blog</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={isRefreshing ? undefined : handleRefresh}
                    className={`${
                      isRefreshing ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  >
                    <RotateCw
                      className={`mr-2 h-4 w-4 ${
                        isRefreshing ? "animate-spin" : ""
                      }`}
                    />
                    <span>Refresh Page</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={isRelogging ? undefined : handleRelogin}
                    className={`${
                      isRelogging ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  >
                    <RefreshCcw
                      className={`mr-2 h-4 w-4 ${
                        isRelogging ? "animate-spin" : ""
                      }`}
                    />
                    <span>Refresh Profile</span>
                  </DropdownMenuItem>
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
        <div className="md:hidden flex items-center gap-4">
          {user && (
            <Link to={`/profile/${user.username}`}>
              <img
                className="h-8 w-8 rounded-full object-cover ring-2 ring-offset-2 ring-transparent hover:ring-blue-500 transition-all"
                src={getAvatarUrl(
                  user.profile?.avatar,
                  user.premium?.isPremium,
                  user.updatedAt
                )}
                alt={user.username}
              />
            </Link>
          )}
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
                <>
                  <NavLink
                    to={`/profile/${user.username}`}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-3 rounded-md p-2 text-base font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
                  >
                    <User className="h-5 w-5" />
                    My Profile
                  </NavLink>
                  <NavLink
                    to="/settings"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-3 rounded-md p-2 text-base font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
                  >
                    <Settings className="h-5 w-5" />
                    Settings
                  </NavLink>
                  <NavLink
                    to="/projects/new"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-3 rounded-md p-2 text-base font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
                  >
                    <Layers className="h-5 w-5" />
                    Post Project
                  </NavLink>
                  <NavLink
                    to="/blogs/new"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-3 rounded-md p-2 text-base font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
                  >
                    <Rss className="h-5 w-5" />
                    Post Blog
                  </NavLink>
                  <Button
                    onClick={() => {
                      logout();
                      setIsMobileMenuOpen(false);
                    }}
                    variant="outline"
                    className="mt-2"
                  >
                    <LogOut className="mr-2 h-5 w-5" />
                    Logout
                  </Button>
                </>
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
