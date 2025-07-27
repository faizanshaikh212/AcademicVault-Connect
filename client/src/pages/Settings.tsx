import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import api from "@/services/api";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";

const Settings: React.FC = () => {
  const { user, login } = useAuth();
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

      login({
        user: updatedUserResponse,
        token: localStorage.getItem("token"),
      });
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
      setMessage({
        type: "error",
        text: err.response?.data?.message || "Failed to save profile.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) return null;

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Account Settings</h1>
      <div className="space-y-8">
        {/* Avatar Settings */}
        <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Profile Picture</h2>
          <div className="flex items-center gap-6">
            <img
              src={
                user.profile?.avatar || `https://i.pravatar.cc/96?u=${user._id}`
              }
              alt="Avatar"
              className="h-24 w-24 rounded-full object-cover"
            />
            <div>
              <Input
                type="file"
                onChange={handleAvatarUpload}
                disabled={isUploading}
              />
              <p className="text-xs text-gray-500 mt-2">
                PNG, JPG, GIF up to 10MB.
              </p>
              {isUploading && (
                <p className="text-sm text-blue-500 mt-2">Uploading...</p>
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
        {user.role === "student" && (
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
      </div>
    </div>
  );
};

export default Settings;
