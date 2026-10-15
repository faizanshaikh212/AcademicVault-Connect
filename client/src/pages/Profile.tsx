/**
 * Profile Page Component
 * Displays user profile information, projects, and blogs
 * Supports user interactions like following/unfollowing
 * Handles premium user features and role-based content display
 * @module pages/Profile
 */

import React, { useState, useEffect } from "react";
import { getAvatarUrl } from "@/lib/avatar";
import { useParams, Link } from "react-router-dom";
import api from "@/services/api";
import { User, Project, Blog } from "../types";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import ProjectCard from "@/components/shared/ProjectCard";
import BlogCard from "@/components/shared/BlogCard";
import { Layers, Rss } from "lucide-react";
import PostContentCard from "@/components/shared/PostContentCard";

/**
 * Stat Component
 * Displays a statistic with a value and label in a consistent format
 * Used for showing follower counts, project counts, etc.
 *
 * @component
 * @param {Object} props - Component props
 * @param {number} props.value - The numeric value to display
 * @param {string} props.label - The label describing the statistic
 * @returns {JSX.Element} A formatted statistic display
 */
const Stat: React.FC<{ value: number; label: string }> = ({ value, label }) => (
  <div className="text-center">
    <p className="text-xl font-bold">{value}</p>
    <p className="text-sm text-gray-500">{label}</p>
  </div>
);

/**
 * Profile Page Container Component
 * Manages the state and logic for displaying user profiles
 *
 * @component
 * @returns {JSX.Element} The profile page component
 */
const Profile: React.FC = () => {
  // Route parameters
  const { username } = useParams<{ username: string }>();
  const { user: currentUser } = useAuth();

  // Main profile data states
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [blogs, setBlogs] = useState<Blog[]>([]);

  // UI states
  const [activeTab, setActiveTab] = useState<"projects" | "blogs">("projects");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);

  const isOwnProfile = currentUser?.username === username;

  /**
   * Effect hook to fetch profile data when username changes
   * Loads user profile, projects, and blogs in parallel
   * Updates following status and handles errors
   */
  useEffect(() => {
    /**
     * Fetches all profile-related data from the API
     * Includes user details, projects, and blog posts
     */
    const fetchProfileData = async () => {
      if (!username) return;
      setIsLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem("token");

        // Make the request with explicit headers
        const userRes = await api.get<User>(`/users/${username}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const fetchedUser = userRes.data;
        setProfileUser(fetchedUser);

        // Explicitly check if isFollowing is true, default to false otherwise
        setIsFollowing(fetchedUser.isFollowing === true);

        const [projectsRes, blogsRes] = await Promise.all([
          api.get<Project[]>(`/projects/user/${fetchedUser._id}`),
          api.get<Blog[]>(`/blogs/user/${fetchedUser._id}`),
        ]);
        setProjects(projectsRes.data);
        setBlogs(blogsRes.data);
      } catch (err) {
        setError("Could not find user profile.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfileData();
  }, [username, currentUser]); // Re-run when the logged-in user changes

  /**
   * Handles the follow/unfollow action for a user
   * - Toggles follow status through API call
   * - Updates local state optimistically
   * - Updates follower count in profile
   *
   * @async
   * @function handleFollow
   * @throws {Error} When API call fails
   */
  const handleFollow = async () => {
    if (!profileUser || isOwnProfile || !currentUser) return;
    try {
      const response = await api.post(`/users/${profileUser._id}/follow`);
      const isNowFollowing = response.data.action === "followed";

      // Update the local follow state
      setIsFollowing(isNowFollowing);

      // Then update the state with the server's response
      setIsFollowing(isNowFollowing);
      setProfileUser((prev) => {
        if (!prev) return null;
        const newFollowersCount = isNowFollowing
          ? prev.socials!.followersCount + 1
          : prev.socials!.followersCount - 1;
        return {
          ...prev,
          socials: { ...prev.socials!, followersCount: newFollowersCount },
        };
      });
    } catch (error) {
      console.error("Follow action failed", error);
    }
  };

  if (isLoading)
    return <div className="text-center py-20">Loading profile...</div>;
  if (error)
    return <div className="text-center py-20 text-red-500">{error}</div>;
  if (!profileUser) return null;

  return (
    <div className="bg-white dark:bg-gray-950 min-h-screen pt-30">
      <div className="container mx-auto px-4 py-8">
        <div className="mx-auto grid max-w-5xl grid-cols-1 items-start gap-6 sm:grid-cols-[auto_minmax(0,1fr)] sm:gap-8">
          <div className="flex justify-center sm:justify-end">
            <img
              src={getAvatarUrl(
                profileUser.profile?.avatar,
                profileUser.premium?.isPremium,
                profileUser.updatedAt
              )}
              alt={profileUser.username}
              className="h-24 w-24 rounded-full object-cover ring-4 ring-white shadow-lg dark:ring-gray-900 sm:h-32 sm:w-32"
            />
          </div>
          <div className="min-w-0 space-y-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-normal">{profileUser.username}</h1>
                {profileUser.premium?.isPremium && (
                  <div className="inline-flex items-center justify-center w-5 h-5 bg-gradient-to-r from-amber-400 to-yellow-500 rounded-full shadow-sm">
                    <svg
                      className="w-3 h-3 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3">
                {isOwnProfile ? (
                  <Link
                    to="/settings"
                    className="flex-1 sm:flex-none inline-flex justify-center px-4 py-1.5 rounded-md border border-gray-300 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 active:bg-gray-100 dark:active:bg-gray-700 transition-colors duration-150 ease-in-out"
                  >
                    Edit Profile
                  </Link>
                ) : (
                  <Button
                    onClick={handleFollow}
                    variant="default"
                    className={`flex-1 sm:flex-none px-6 py-1.5 font-medium transition-all duration-150 ${
                      isFollowing
                        ? "bg-gray-100 hover:bg-red-50 hover:text-red-600 hover:border-red-500 dark:bg-gray-800 dark:hover:bg-red-950 dark:hover:border-red-500 dark:hover:text-red-400"
                        : "bg-blue-500 hover:bg-blue-600 text-white border-transparent dark:bg-blue-600 dark:hover:bg-blue-700"
                    }`}
                  >
                    {isFollowing ? "Unfollow" : "Follow"}
                  </Button>
                )}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
              <Stat value={projects.length} label="projects" />
              <Stat
                value={profileUser.socials?.followersCount ?? 0}
                label="followers"
              />
              <Stat
                value={profileUser.socials?.followingCount ?? 0}
                label="following"
              />
            </div>
            <div>
              <p className="font-semibold">
                {profileUser.firstName} {profileUser.lastName}
              </p>
              <p className="text-gray-600 dark:text-gray-400">
                {profileUser.profile.bio || "No bio provided."}
              </p>
            </div>
          </div>
        </div>
      </div>
      {/* Content Type Navigation Tabs
       * Toggles between projects and blogs display
       * Uses dynamic styling based on active tab
       */}
      <div className="border-t dark:border-gray-800">
        <div className="container mx-auto flex w-full justify-center gap-6 px-4 sm:gap-12">
          <button
            onClick={() => setActiveTab("projects")}
            className={`py-3 font-medium border-t-2 flex items-center gap-2 ${
              activeTab === "projects"
                ? "border-gray-900 dark:border-white text-gray-900 dark:text-white"
                : "border-transparent text-gray-500"
            }`}
          >
            <Layers className="h-5 w-5" /> PROJECTS
          </button>
          <button
            onClick={() => setActiveTab("blogs")}
            className={`py-3 font-medium border-t-2 flex items-center gap-2 ${
              activeTab === "blogs"
                ? "border-gray-900 dark:border-white text-gray-900 dark:text-white"
                : "border-transparent text-gray-500"
            }`}
          >
            <Rss className="h-5 w-5" /> BLOGS
          </button>
        </div>
      </div>
      {/* Content Display Grid
       * Responsive grid layout for projects and blogs
       * Shows "Add New" card for own profile
       * Handles empty states with appropriate messages
       */}
      <div className="container mx-auto w-full px-4 py-12">
        {activeTab === "projects" && (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
              {/* Display first set of projects
               * Shows fewer items if it's user's own profile to make room for "Add New" card
               */}
              {projects.slice(0, isOwnProfile ? 2 : 3).map((p) => (
                <ProjectCard key={p._id} project={p} />
              ))}
              {/* "Add New" card only shown on user's own profile */}
              {isOwnProfile && (
                <div className="hidden sm:block">
                  <PostContentCard
                    to="/projects/new"
                    title="Add New Project"
                    description="Share your latest work with the community"
                  />
                </div>
              )}
              {projects.slice(2).map((p) => (
                <ProjectCard key={p._id} project={p} />
              ))}
            </div>
            {!isOwnProfile && projects.length === 0 && (
              <p className="text-center text-gray-500 py-12">
                This user hasn't posted any projects yet.
              </p>
            )}
          </>
        )}
        {activeTab === "blogs" && (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
              {blogs.slice(0, isOwnProfile ? 2 : 3).map((b) => (
                <BlogCard key={b._id} blog={b} />
              ))}
              {isOwnProfile && (
                <div className="hidden sm:block">
                  <PostContentCard
                    to="/blogs/new"
                    title="Write New Blog"
                    description="Share your thoughts and experiences"
                  />
                </div>
              )}
              {blogs.slice(2).map((b) => (
                <BlogCard key={b._id} blog={b} />
              ))}
            </div>
            {!isOwnProfile && blogs.length === 0 && (
              <p className="text-center text-gray-500 py-12">
                This user hasn't posted any blogs yet.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Profile;
