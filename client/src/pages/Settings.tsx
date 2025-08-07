import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import api from "@/services/api";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { getAvatarUrl } from "@/lib/avatar";
import { Textarea } from "@/components/ui/Textarea";

const Settings: React.FC = () => {
  const { user, login, updateProfile } = useAuth();
  const [formData, setFormData] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    username: user?.username || "",
    bio: user?.profile?.bio || "",
  });
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.type === "image/gif" && !user.premium.isPremium) {
      setMessage({
        type: "error",
        text: "Animated avatars are a premium feature.",
      });
      return;
    }

    const uploadData = new FormData();
    uploadData.append("file", file);
    setIsUploading(true);
    setMessage(null);
    try {
      const { data: uploadResult } = await api.post("/upload", uploadData);

      const { data: updatedUserResponse } = await api.put("/users/profile", {
        profile: { avatar: uploadResult.filePath },
      });

      updateProfile(updatedUserResponse.profile);
      setMessage({ type: "success", text: "Avatar updated successfully!" });
    } catch (err: any) {
      setMessage({
        type: "error",
        text: err.response?.data?.message || "Avatar upload failed.",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);
    try {
      const { data: updatedUser } = await api.put("/users/profile", {
        firstName: formData.firstName,
        lastName: formData.lastName,
        username: formData.username,
        profile: { bio: formData.bio },
      });
      login({ user: updatedUser, token: localStorage.getItem("token") });
      setMessage({ type: "success", text: "Profile updated successfully!" });
    } catch (err: any) {
      let errorMsg = err.response?.data?.message || "Failed to save profile.";
      if (err.response?.data?.message === "Username already taken.") {
        errorMsg = "This username is already taken. Please choose another.";
      }
      setMessage({ type: "error", text: errorMsg });
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) return null;

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8 pt-30">
      <h1 className="text-3xl font-bold mb-6">Account Settings</h1>
      <div className="space-y-8">
        {/* Avatar Settings */}
        <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Profile Picture</h2>
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-6">
              <img
                src={getAvatarUrl(user.profile?.avatar, user.updatedAt)}
                alt="Avatar"
                className="h-24 w-24 rounded-full object-cover"
              />
              <div className="flex flex-col gap-2">
                <Input
                  type="file"
                  onChange={handleAvatarUpload}
                  disabled={isUploading}
                />
                <p className="text-xs text-gray-500">
                  PNG, JPG, GIF up to 10MB.
                </p>
                {isUploading && (
                  <p className="text-sm text-blue-500">Uploading...</p>
                )}
                {user.profile?.avatar && (
                  <Button
                    variant="destructive"
                    onClick={async () => {
                      try {
                        await api.put("/users/profile", {
                          profile: { avatar: null },
                        });
                        login({
                          user: {
                            ...user,
                            profile: { ...user.profile, avatar: "" },
                          },
                          token: localStorage.getItem("token"),
                        });
                        setMessage({
                          type: "success",
                          text: "Avatar removed successfully!",
                        });
                      } catch (err: any) {
                        setMessage({
                          type: "error",
                          text:
                            err.response?.data?.message ||
                            "Failed to remove avatar.",
                        });
                      }
                    }}
                  >
                    Remove Avatar
                  </Button>
                )}
              </div>
            </div>

            {/* Previous Avatars */}
            {user.profile?.avatarHistory &&
              user.profile.avatarHistory.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium mb-2">Previous Avatars</h3>
                  <div className="flex gap-4">
                    {user.profile.avatarHistory.map((avatarUrl, index) => (
                      <button
                        key={index}
                        onClick={async () => {
                          try {
                            const { data: updatedUser } = await api.put(
                              "/users/profile",
                              {
                                profile: { avatar: avatarUrl },
                              }
                            );
                            login({
                              user: updatedUser,
                              token: localStorage.getItem("token"),
                            });
                            setMessage({
                              type: "success",
                              text: "Avatar restored successfully!",
                            });
                          } catch (err: any) {
                            setMessage({
                              type: "error",
                              text:
                                err.response?.data?.message ||
                                "Failed to restore avatar.",
                            });
                          }
                        }}
                        className="relative group"
                      >
                        <img
                          src={getAvatarUrl(avatarUrl, user.updatedAt)}
                          alt={`Previous avatar ${index + 1}`}
                          className="h-12 w-12 rounded-full object-cover ring-2 ring-offset-2 ring-transparent group-hover:ring-blue-500"
                        />
                        <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="text-xs text-white">Restore</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
          </div>
        </div>

        {/* Account Status */}
        <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Account Status</h2>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Roles:</span>
              <div className="flex gap-2">
                {user.role.map((role: string) => (
                  <span
                    key={role}
                    className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                  >
                    {role.charAt(0).toUpperCase() + role.slice(1)}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Premium Status:</span>
              {user.premium?.isPremium ? (
                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                  Premium Member
                  {user.premium.premiumSince
                    ? ` since ${new Date(
                        user.premium.premiumSince
                      ).toLocaleDateString()}`
                    : ""}
                </span>
              ) : (
                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200">
                  Free Plan
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Profile Information */}
        <form
          onSubmit={handleProfileSave}
          className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-md space-y-4"
        >
          <h2 className="text-xl font-semibold mb-4">Profile Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="firstName"
                className="block text-sm font-medium mb-1"
              >
                First Name
              </label>
              <Input
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <label
                htmlFor="lastName"
                className="block text-sm font-medium mb-1"
              >
                Last Name
              </label>
              <Input
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
              />
            </div>
          </div>
          <div>
            <label
              htmlFor="username"
              className="block text-sm font-medium mb-1"
            >
              Username
            </label>
            <Input
              id="username"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
            />
          </div>
          <div>
            <label htmlFor="bio" className="block text-sm font-medium mb-1">
              Bio
            </label>
            <Textarea
              id="bio"
              name="bio"
              value={formData.bio}
              onChange={handleInputChange}
              rows={4}
            />
          </div>
          <Button type="submit" disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Profile"}
          </Button>
        </form>

        {message && (
          <p
            className={`text-sm mt-4 ${
              message.type === "success" ? "text-green-500" : "text-red-500"
            }`}
          >
            {message.text}
          </p>
        )}

        {/* Teacher Role Request Section */}
        {!user.role?.includes("teacher") && !user.role?.includes("admin") && (
          <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-2">Become a Teacher</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Are you an educator? Apply to get a "Teacher" role on your profile
              to gain access to additional features.
            </p>
            <Button asChild variant="outline">
              <Link to="/request-teacher-role">Apply Now</Link>
            </Button>
          </div>
        )}

        {/* Premium Request Section */}
        {!user.premium?.isPremium && (
          <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-2">Upgrade to Premium</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Want to use animated avatars and get access to exclusive features?
              Upgrade to a premium account today!
            </p>
            <Button asChild variant="outline">
              <Link to="/request-premium">Upgrade Now</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;
