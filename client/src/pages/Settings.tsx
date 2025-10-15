import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import api from "@/services/api";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { getAvatarUrl } from "@/lib/avatar";
import { Textarea } from "@/components/ui/Textarea";
import SettingsLayout from "@/components/layout/SettingsLayout";
import { useEmailVerification } from "@/hooks/useEmailVerification";
import EmailVerificationModal from "@/components/auth/EmailVerificationModal";

const Settings: React.FC = () => {
  const { user, login, updateProfile } = useAuth();
  const { requireEmailVerification, showModal, closeModal, featureName } = useEmailVerification();
  const [isCheckingSubscription, setIsCheckingSubscription] = useState(false);

  // Check subscription status on mount
  useEffect(() => {
    let mounted = true;

    const checkSubscription = async () => {
      if (!user?.email) return;

      setIsCheckingSubscription(true);
      try {
        const { data: subscriptionStatus } = await api.get(
          `/news/check-subscription/${user.email}`
        );

        if (!mounted) return;

        if (!subscriptionStatus || !subscriptionStatus.isActive) {
          // Only update if we currently think we're subscribed
          if (user.newsletterSubscription?.isActive) {
            const { data: updatedUser } = await api.get("/users/me");
            if (mounted) {
              login({
                user: updatedUser,
                token: localStorage.getItem("token"),
              });
            }
          }
        }
      } catch (error) {
        console.error("Subscription check failed:", error);
        // On error, update only if we think we're subscribed
        if (mounted && user.newsletterSubscription?.isActive) {
          login({
            user: {
              ...user,
              newsletterSubscription: {
                ...user.newsletterSubscription,
                isActive: false,
              },
            },
            token: localStorage.getItem("token"),
          });
        }
      } finally {
        if (mounted) {
          setIsCheckingSubscription(false);
        }
      }
    };

    checkSubscription();

    return () => {
      mounted = false;
    };
    // `login` is recreated by AuthProvider on every render. Including it here
    // makes this effect run again after its own state update, causing a request
    // loop on the settings page. User identity is sufficient for this check.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?._id, user?.email]);

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

    // Check email verification before allowing avatar upload
    if (!requireEmailVerification('avatar upload')) {
      return;
    }

    if (file.type === "image/gif" && !user.premium?.isPremium) {
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

    // Check email verification before allowing profile save
    if (!requireEmailVerification('profile updates')) {
      return;
    }

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
    <SettingsLayout>
      <div className="space-y-8">



        <div className="space-y-8">
          {/* Avatar Settings */}
          <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Profile Picture</h2>
            <div className="flex flex-col gap-6">
              <div className="flex items-center gap-6">
                <img
                  src={getAvatarUrl(
                    user.profile?.avatar,
                    user.premium?.isPremium,
                    user.updatedAt
                  )}
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
                            src={getAvatarUrl(
                              avatarUrl,
                              user.premium?.isPremium,
                              user.updatedAt
                            )}
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
                  {(Array.isArray(user.role) ? user.role : []).map((role: string) => (
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
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">
                    Newsletter Subscription:
                  </span>
                  <span
                    className={`px-2 py-1 text-xs font-semibold rounded-full ${isCheckingSubscription
                      ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                      : user.newsletterSubscription?.isActive
                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                        : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                      }`}
                  >
                    {isCheckingSubscription
                      ? "Checking..."
                      : user.newsletterSubscription?.isActive
                        ? "Subscribed"
                        : "Not Subscribed"}
                  </span>
                </div>
                <Button
                  size="sm"
                  variant={
                    user.newsletterSubscription?.isActive
                      ? "destructive"
                      : "default"
                  }
                  disabled={isCheckingSubscription}
                  onClick={async () => {
                    try {
                      if (user.newsletterSubscription?.isActive) {
                        // If already subscribed, deactivate
                        await api.put(
                          `/news/subscribers/${user.newsletterSubscription._id}`,
                          {
                            isActive: false,
                          }
                        );
                        setMessage({
                          type: "success",
                          text: "Newsletter subscription deactivated",
                        });
                      } else {
                        // If not subscribed, activate or reactivate
                        await api.post("/news/subscribe", {
                          email: user.email,
                          userId: user._id,
                        });
                        setMessage({
                          type: "success",
                          text: "Newsletter subscription activated",
                        });
                      }

                      // Always refresh user data after subscription change
                      const { data: updatedUser } = await api.get("/users/me");
                      login({
                        user: updatedUser,
                        token: localStorage.getItem("token"),
                      });
                    } catch (error: any) {
                      console.error(
                        "Subscription error:",
                        error.response?.data || error
                      );
                      // If already subscribed, try to reactivate instead
                      if (
                        error.response?.data?.message ===
                        "Email already subscribed"
                      ) {
                        try {
                          const { data: subscriber } = await api.get(
                            `/news/check-subscription/${user.email}`
                          );
                          if (subscriber) {
                            await api.put(`/news/subscribers/${subscriber._id}`, {
                              isActive: true,
                              userId: user._id,
                            });
                            const { data: updatedUser } = await api.get(
                              "/users/me"
                            );
                            login({
                              user: updatedUser,
                              token: localStorage.getItem("token"),
                            });
                            setMessage({
                              type: "success",
                              text: "Newsletter subscription activated",
                            });
                            return;
                          }
                        } catch (reactivateError) {
                          console.error("Reactivation error:", reactivateError);
                        }
                      }
                      setMessage({
                        type: "error",
                        text:
                          error.response?.data?.message ||
                          "Failed to update newsletter subscription",
                      });
                    }
                  }}
                >
                  {user.newsletterSubscription?.isActive
                    ? "Unsubscribe"
                    : "Subscribe"}
                </Button>
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
              className={`text-sm mt-4 ${message.type === "success" ? "text-green-500" : "text-red-500"
                }`}
            >
              {message.text}
            </p>
          )}

          {/* Teacher Role Request Section */}
          {Array.isArray(user.role) && !user.role.includes("teacher") && (
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

      <EmailVerificationModal
        isOpen={showModal}
        onClose={closeModal}
        feature={featureName}
      />
    </SettingsLayout>
  );
};

export default Settings;
