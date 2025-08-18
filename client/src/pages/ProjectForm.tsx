import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "@/services/api";
import { Project } from "../types";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { useAuth } from "@/hooks/useAuth";

const ProjectForm: React.FC = (): JSX.Element => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isEditMode = Boolean(id);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    coverImage: "",
    coverImageUrl: "",
    screenshots: [] as string[],
    projectLink: "",
    sourceCodeLink: "",
    tags: "",
    socialMediaLinks: {
      github: "",
      linkedin: "",
      twitter: "",
      instagram: "",
      facebook: "",
      youtube: "",
      website: "",
    },
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isEditMode) {
      const fetchProject = async () => {
        setIsLoading(true);
        try {
          const { data } = await api.get<Project>(`/projects/${id}`);
          // Explicitly set each field to ensure type safety
          setFormData({
            title: data.title,
            description: data.description,
            coverImage: data.coverImage,
            coverImageUrl: "", // Always set this field for type safety
            screenshots: data.screenshots ?? [],
            projectLink: data.projectLink ?? "",
            sourceCodeLink: data.sourceCodeLink ?? "",
            tags: data.tags.join(", "),
            socialMediaLinks: {
              github: data.socialMediaLinks?.github || "",
              linkedin: data.socialMediaLinks?.linkedin || "",
              twitter: data.socialMediaLinks?.twitter || "",
              instagram: data.socialMediaLinks?.instagram || "",
              facebook: data.socialMediaLinks?.facebook || "",
              youtube: data.socialMediaLinks?.youtube || "",
              website: data.socialMediaLinks?.website || "",
            },
          });
        } catch (err: unknown) {
          const errorMessage =
            err instanceof Error
              ? err.message
              : "Failed to load project data for editing.";
          setError(errorMessage);
        } finally {
          setIsLoading(false);
        }
      };
      fetchProject();
    }
  }, [id, isEditMode]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Use the user from the component scope
    const isPremium = user?.premium?.isPremium;

    // Set size limit based on premium status
    const MAX_FILE_SIZE = isPremium ? 20 * 1024 * 1024 : 5 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      setError(
        isPremium
          ? "File size exceeds 20MB limit for premium users"
          : "File size exceeds 5MB limit for basic users"
      );
      e.target.value = "";
      return;
    }

    // Set allowed types based on premium status
    const basicTypes = ["image/jpeg", "image/png", "image/gif"];
    const premiumTypes = [...basicTypes, "video/mp4", "video/webm"];
    const allowedTypes = isPremium ? premiumTypes : basicTypes;

    if (!allowedTypes.includes(file.type)) {
      setError(
        user?.premium
          ? "Please upload a JPEG, PNG, GIF, MP4, or WEBM file"
          : "Please upload a JPEG, PNG, or GIF image"
      );
      e.target.value = "";
      return;
    }

    const uploadData = new FormData();
    uploadData.append("file", file);

    setIsUploading(true);
    setError(null);

    try {
      const { data } = await api.post("/upload", uploadData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      if (data.filePath) {
        setFormData((prevData) => ({ ...prevData, coverImage: data.filePath }));
      } else {
        throw new Error("No file path received from server");
      }
    } catch (err: any) {
      console.error("Upload error:", err);
      setError(
        err.response?.data?.message || "File upload failed. Please try again."
      );
      // Reset the file input to allow re-uploading the same file
      e.target.value = "";
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // Use uploaded image, or URL, or default
    let coverImageFinal = formData.coverImage || formData.coverImageUrl;
    if (!coverImageFinal) {
      coverImageFinal =
        "https://res.cloudinary.com/dy7fw9h6s/image/upload/v1754894472/23_cetqb9.jpg"; // Set your default image path here
    }

    // Filter out empty social media links
    const socialMediaLinks = Object.entries(formData.socialMediaLinks).reduce(
      (acc, [key, value]) => {
        if (value.trim()) {
          acc[key] = value.trim();
        }
        return acc;
      },
      {} as Record<string, string>
    );

    const submissionData = {
      title: formData.title,
      description: formData.description,
      coverImage: coverImageFinal,
      projectLink: formData.projectLink,
      sourceCodeLink: formData.sourceCodeLink,
      tags: formData.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      socialMediaLinks,
      screenshots: formData.screenshots,
    };

    try {
      if (isEditMode) {
        await api.put(`/projects/${id}`, submissionData);
      } else {
        await api.post("/projects", submissionData);
      }
      navigate("/projects");
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          "An error occurred while saving the project."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8 pt-30">
      {/* Page Header */}
      <h1 className="text-3xl font-bold mb-6">
        {isEditMode ? "Edit Project" : "Create a New Project"}
      </h1>
      <form
        onSubmit={handleSubmit}
        className="space-y-6 bg-white dark:bg-gray-900 p-8 rounded-lg shadow-md"
      >
        <div>
          <label htmlFor="title" className="block text-sm font-medium mb-1">
            Title
          </label>
          <Input
            id="title"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            required
          />
        </div>
        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium mb-1"
          >
            Description (Markdown supported)
          </label>
          <Textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows={10}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Cover Image</label>
          <Input
            type="file"
            onChange={handleFileUpload}
            disabled={isUploading}
          />
          <div className="mt-2">
            <label
              htmlFor="coverImageUrl"
              className="block text-xs font-medium mb-1"
            >
              Or use a cover image URL
            </label>
            <Input
              id="coverImageUrl"
              name="coverImageUrl"
              value={formData.coverImageUrl}
              onChange={handleInputChange}
              placeholder="https://example.com/image.jpg"
            />
          </div>
          {isUploading && (
            <p className="text-sm text-blue-500 mt-2">Uploading image...</p>
          )}
          {(formData.coverImage || formData.coverImageUrl) && (
            <div className="mt-4 relative">
              <img
                src={formData.coverImage || formData.coverImageUrl}
                alt="Cover preview"
                className="h-32 w-auto rounded"
              />
              <Button
                type="button"
                onClick={() =>
                  setFormData((prev) => ({
                    ...prev,
                    coverImage: "",
                    coverImageUrl: "",
                  }))
                }
                className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-2 rounded-full"
                size="icon"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </Button>
            </div>
          )}
        </div>
        <div>
          <label
            htmlFor="projectLink"
            className="block text-sm font-medium mb-1"
          >
            Project Link
          </label>
          <Input
            id="projectLink"
            name="projectLink"
            value={formData.projectLink}
            onChange={handleInputChange}
          />
        </div>
        <div>
          <label
            htmlFor="sourceCodeLink"
            className="block text-sm font-medium mb-1"
          >
            Source Code Link
          </label>
          <Input
            id="sourceCodeLink"
            name="sourceCodeLink"
            value={formData.sourceCodeLink}
            onChange={handleInputChange}
          />
        </div>
        <div>
          <label htmlFor="tags" className="block text-sm font-medium mb-1">
            Tags (comma-separated)
          </label>
          <Input
            id="tags"
            name="tags"
            value={formData.tags}
            onChange={handleInputChange}
          />
        </div>

        {/* Social Media Links Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Social Media Links (Optional)</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="github"
                className="block text-sm font-medium mb-1"
              >
                GitHub
              </label>
              <Input
                id="github"
                name="socialMediaLinks.github"
                value={formData.socialMediaLinks.github}
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    socialMediaLinks: {
                      ...formData.socialMediaLinks,
                      github: e.target.value,
                    },
                  });
                }}
                placeholder="https://github.com/username"
              />
            </div>

            <div>
              <label
                htmlFor="linkedin"
                className="block text-sm font-medium mb-1"
              >
                LinkedIn
              </label>
              <Input
                id="linkedin"
                name="socialMediaLinks.linkedin"
                value={formData.socialMediaLinks.linkedin}
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    socialMediaLinks: {
                      ...formData.socialMediaLinks,
                      linkedin: e.target.value,
                    },
                  });
                }}
                placeholder="https://linkedin.com/in/username"
              />
            </div>

            <div>
              <label
                htmlFor="twitter"
                className="block text-sm font-medium mb-1"
              >
                Twitter
              </label>
              <Input
                id="twitter"
                name="socialMediaLinks.twitter"
                value={formData.socialMediaLinks.twitter}
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    socialMediaLinks: {
                      ...formData.socialMediaLinks,
                      twitter: e.target.value,
                    },
                  });
                }}
                placeholder="https://twitter.com/username"
              />
            </div>

            <div>
              <label
                htmlFor="instagram"
                className="block text-sm font-medium mb-1"
              >
                Instagram
              </label>
              <Input
                id="instagram"
                name="socialMediaLinks.instagram"
                value={formData.socialMediaLinks.instagram}
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    socialMediaLinks: {
                      ...formData.socialMediaLinks,
                      instagram: e.target.value,
                    },
                  });
                }}
                placeholder="https://instagram.com/username"
              />
            </div>

            <div>
              <label
                htmlFor="facebook"
                className="block text-sm font-medium mb-1"
              >
                Facebook
              </label>
              <Input
                id="facebook"
                name="socialMediaLinks.facebook"
                value={formData.socialMediaLinks.facebook}
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    socialMediaLinks: {
                      ...formData.socialMediaLinks,
                      facebook: e.target.value,
                    },
                  });
                }}
                placeholder="https://facebook.com/username"
              />
            </div>

            <div>
              <label
                htmlFor="youtube"
                className="block text-sm font-medium mb-1"
              >
                YouTube
              </label>
              <Input
                id="youtube"
                name="socialMediaLinks.youtube"
                value={formData.socialMediaLinks.youtube}
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    socialMediaLinks: {
                      ...formData.socialMediaLinks,
                      youtube: e.target.value,
                    },
                  });
                }}
                placeholder="https://youtube.com/c/username"
              />
            </div>

            <div>
              <label
                htmlFor="website"
                className="block text-sm font-medium mb-1"
              >
                Personal Website
              </label>
              <Input
                id="website"
                name="socialMediaLinks.website"
                value={formData.socialMediaLinks.website}
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    socialMediaLinks: {
                      ...formData.socialMediaLinks,
                      website: e.target.value,
                    },
                  });
                }}
                placeholder="https://example.com"
              />
            </div>
          </div>
        </div>

        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}

        <Button
          type="submit"
          disabled={isLoading || isUploading}
          className="w-full"
        >
          {isLoading
            ? "Saving..."
            : isEditMode
            ? "Update Project"
            : "Create Project"}
        </Button>
      </form>
    </div>
  );
};

export default ProjectForm;
