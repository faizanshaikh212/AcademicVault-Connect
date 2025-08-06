import React, { useState, useEffect } from "react";
import { getAvatarUrl } from "@/lib/avatar";
import { useParams, Link } from "react-router-dom";
import api from "@/services/api";
import { User, Project, Blog } from "../types";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import ProjectCard from "@/components/shared/ProjectCard";
import BlogCard from "@/components/shared/BlogCard";
import { Layers, Rss, Settings } from "lucide-react";

const Stat: React.FC<{ value: number; label: string }> = ({ value, label }) => (
  <div className="text-center">
    <p className="text-xl font-bold">{value}</p>
    <p className="text-sm text-gray-500">{label}</p>
  </div>
);

const Profile: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const { user: currentUser } = useAuth();
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [activeTab, setActiveTab] = useState<"projects" | "blogs">("projects");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);

  const isOwnProfile = currentUser?.username === username;

  useEffect(() => {
    const fetchProfileData = async () => {
      if (!username) return;
      setIsLoading(true);
      setError(null);
      try {
        // Get the auth token
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

  const handleFollow = async () => {
    if (!profileUser || isOwnProfile || !currentUser) return;
    try {
      // Make the API call to toggle follow status
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
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-1 flex justify-center items-start">
            <img
              src={getAvatarUrl(
                profileUser.profile?.avatar,
                profileUser.updatedAt
              )}
              alt={profileUser.username}
              className="h-36 w-36 rounded-full object-cover"
            />
          </div>
          <div className="col-span-2 space-y-4">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-light">{profileUser.username}</h1>
              {isOwnProfile ? (
                <Button asChild variant="secondary">
                  <Link to="/settings">
                    <Settings className="mr-2 h-4 w-4" /> Edit Profile
                  </Link>
                </Button>
              ) : (
                <Button
                  onClick={handleFollow}
                  variant={isFollowing ? "secondary" : "default"}
                >
                  {isFollowing ? "Unfollow" : "Follow"}
                </Button>
              )}
            </div>
            <div className="flex items-center gap-8">
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
      <div className="border-t dark:border-gray-800">
        <div className="container mx-auto px-4 flex justify-center gap-12">
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
      <div className="container mx-auto px-4 py-12">
        {activeTab === "projects" &&
          (projects.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
              {projects.map((p) => (
                <ProjectCard key={p._id} project={p} />
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-12">
              This user hasn't posted any projects yet.
            </p>
          ))}
        {activeTab === "blogs" &&
          (blogs.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
              {blogs.map((b) => (
                <BlogCard key={b._id} blog={b} />
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-12">
              This user hasn't posted any blogs yet.
            </p>
          ))}
      </div>
    </div>
  );
};

export default Profile;
