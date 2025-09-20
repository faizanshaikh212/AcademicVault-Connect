import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "@/services/api";
import { Project } from "../types";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import ConfirmDialog from "@/components/shared/ConfirmDialog";

const ProjectForm: React.FC = (): JSX.Element => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const isEditMode = Boolean(id);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

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
  const [screenshotUrlInput, setScreenshotUrlInput] = useState("");
  const [isValidScreenshotUrl, setIsValidScreenshotUrl] = useState(false);

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
    const { name, value } = e.target;

    // Check if user is trying to add a GIF URL without premium
    if (name === "coverImageUrl" && value) {
      const isGif =
        value.toLowerCase().endsWith(".gif") ||
        value.toLowerCase().includes("/image/gif") ||
        value.toLowerCase().includes("format=gif");
      if (isGif && !user?.premium?.isPremium) {
        setError("Please upgrade to premium to use animated GIF images.");
        return;
      }
    }

    setFormData({ ...formData, [name]: value });
    setError(null);
  };

  /**
   * Handles uploading one or more screenshots and appending their URLs to form state
   */
  const handleScreenshotsUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const isPremium = user?.premium?.isPremium;
    const MAX_FILE_SIZE = isPremium ? 20 * 1024 * 1024 : 5 * 1024 * 1024;

    setIsUploading(true);
    setError(null);

    try {
      // Upload files sequentially to avoid overloading the server
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.size > MAX_FILE_SIZE) {
          setError(
            isPremium
              ? "One of the files exceeds 20MB limit for premium users"
              : "One of the files exceeds 5MB limit for basic users"
          );
          continue;
        }
        if (file.type === "image/gif" && !isPremium) {
          setError("Please upgrade to premium to use animated GIF images.");
          continue;
        }
        const allowedTypes = [
          "image/jpeg",
          "image/jpg",
          "image/png",
          "image/gif",
        ];
        if (!allowedTypes.includes(file.type)) {
          setError("Please upload only JPEG, JPG, PNG, or GIF images.");
          continue;
        }

        const uploadData = new FormData();
        uploadData.append("file", file);

        const { data } = await api.post("/upload", uploadData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        if (data.filePath) {
          setFormData((prev) => ({
            ...prev,
            screenshots: [...prev.screenshots, data.filePath],
          }));
        }
      }
    } catch (err: any) {
      console.error("Screenshots upload error:", err);
      setError(err.response?.data?.message || "Screenshot upload failed.");
    } finally {
      // Reset input so same file can be re-selected in future
      if (e.target) e.target.value = "";
      setIsUploading(false);
    }
  };

  const handleAddScreenshotUrl = () => {
    const url = screenshotUrlInput.trim();
    if (!url) return;
    // basic validation for image URL
    const isImage = /(https?:\/\/.+\.(jpg|jpeg|png|gif)(\?.*)?$)/i.test(url);
    if (!isImage) {
      setIsValidScreenshotUrl(false);
      setError(
        "Please enter a valid image URL (jpg, jpeg, png, gif). Use a direct image link."
      );
      return;
    }
    setFormData((prev) => ({
      ...prev,
      screenshots: [...prev.screenshots, url],
    }));
    setScreenshotUrlInput("");
    setIsValidScreenshotUrl(false);
    setError(null);
  };

  const handleRemoveScreenshot = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      screenshots: prev.screenshots.filter((_, i) => i !== index),
    }));
  };

  /**
   * Handles file upload for project media
   * - Validates file type and size
   * - Supports different file types for premium users
   * - Uploads to Cloudinary and updates form state
   *
   * @param {React.ChangeEvent<HTMLInputElement>} e - File input change event
   * @returns {Promise<void>}
   */
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

    // Check if it's a GIF and user is not premium
    if (file.type === "image/gif" && !isPremium) {
      setError("Please upgrade to premium to use animated GIF images.");
      e.target.value = "";
      return;
    }

    // Only allow supported image types
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      setError("Please upload only JPEG, JPG, PNG, or GIF images.");
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

  /**
   * Handles the project form submission
   * Processes and validates form data before sending to the server
   * Handles media uploads and URL validations
   * @param {React.FormEvent} e - Form submission event
   * @returns {Promise<void>}
   */
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

    // Final GIF validation check
    const isGif =
      coverImageFinal.toLowerCase().endsWith(".gif") ||
      coverImageFinal.toLowerCase().includes("/image/gif") ||
      coverImageFinal.toLowerCase().includes("format=gif");
    if (isGif && !user?.premium?.isPremium) {
      setError("Please upgrade to premium to use animated GIF images.");
      setIsLoading(false);
      return;
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
            accept="image/jpeg,image/jpg,image/png,image/gif"
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

        {/* Screenshots Section */}
        <div>
          <label className="block text-sm font-medium mb-1">Screenshots</label>

          {/* File uploader on its own row so it doesn't compete with the URL field */}
          <div className="mb-3">
            <Input
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/gif"
              onChange={handleScreenshotsUpload}
              multiple
              disabled={isUploading}
              className="w-full"
              aria-label="Upload screenshot images"
            />
          </div>

          {/* URL input row: full width input + compact controls */}
          <div className="mb-2">
            <label htmlFor="screenshotUrl" className="sr-only">
              Screenshot image URL
            </label>
            <div className="flex gap-2 items-start">
              <Input
                id="screenshotUrl"
                name="screenshotUrl"
                value={screenshotUrlInput}
                onChange={(e) => {
                  const val = e.target.value;
                  setScreenshotUrlInput(val);
                  const isImage =
                    /(https?:\/\/.+\.(jpg|jpeg|png|gif)(\?.*)?$)/i.test(
                      val.trim()
                    );
                  setIsValidScreenshotUrl(isImage);
                  if (isImage) setError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    if (isValidScreenshotUrl) handleAddScreenshotUrl();
                  }
                }}
                placeholder="Paste a direct image URL (jpg, png, gif)"
                className="flex-1 min-w-0"
                aria-label="Screenshot image URL"
                aria-describedby="screenshot-url-help"
              />

              <div className="flex-shrink-0 flex flex-col items-end gap-2">
                {screenshotUrlInput && isValidScreenshotUrl && (
                  <div className="w-20 h-12">
                    <img
                      src={screenshotUrlInput}
                      alt="Screenshot preview"
                      className="w-full h-full object-cover rounded"
                      onError={() => setIsValidScreenshotUrl(false)}
                    />
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    onClick={handleAddScreenshotUrl}
                    disabled={!isValidScreenshotUrl}
                  >
                    Add
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setScreenshotUrlInput("");
                      setIsValidScreenshotUrl(false);
                      setError(null);
                    }}
                  >
                    Clear
                  </Button>
                </div>
              </div>
            </div>
            <p id="screenshot-url-help" className="text-xs text-gray-500 mt-1">
              You can upload images or paste a direct image URL and press Enter
              / Add.
            </p>
          </div>

          {isUploading && (
            <p className="text-sm text-blue-500 mt-2">
              Uploading screenshots...
            </p>
          )}

          {formData.screenshots && formData.screenshots.length > 0 && (
            <div className="mt-3 grid grid-cols-3 gap-2">
              {formData.screenshots.map((ss, index) => (
                <div key={index} className="relative">
                  <img
                    src={ss}
                    alt={`Screenshot ${index + 1}`}
                    className="h-24 w-full object-cover rounded"
                  />
                  <Button
                    type="button"
                    onClick={() => handleRemoveScreenshot(index)}
                    className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white p-1 rounded-full"
                    size="icon"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="12"
                      height="12"
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
              ))}
            </div>
          )}
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

        <div className="flex gap-4">
          <Button
            type="submit"
            disabled={isLoading || isUploading}
            className="flex-1"
          >
            {isLoading
              ? "Saving..."
              : isEditMode
              ? "Update Project"
              : "Create Project"}
          </Button>
          {isEditMode && (
            <Button
              type="button"
              variant="destructive"
              disabled={isLoading}
              onClick={() => setIsDeleteDialogOpen(true)}
            >
              Delete Project
            </Button>
          )}
        </div>
      </form>

      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={async () => {
          try {
            await api.delete(`/projects/${id}`);
            toast({
              title: "Success",
              description: "Project deleted successfully",
            });
            navigate("/projects");
          } catch (error) {
            toast({
              title: "Error",
              description: "Failed to delete project",
              variant: "destructive",
            });
          }
        }}
        title="Delete Project"
        description="Are you sure you want to delete this project? This action cannot be undone."
        confirmText="Delete"
        variant="destructive"
      />
    </div>
  );
};

export default ProjectForm;
