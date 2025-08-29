import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import api from "@/services/api";
import { Blog } from "../types";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { useToast } from "@/hooks/useToast";
import ConfirmDialog from "@/components/shared/ConfirmDialog";

const BlogForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const isEditMode = Boolean(id);

  const [formData, setFormData] = useState({
    title: "",
    content: "",
    coverImage: "",
    coverImageUrl: "",
    tags: "",
  });
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  useEffect(() => {
    if (isEditMode) {
      setIsLoading(true);
      api
        .get<Blog>(`/blogs/${id}`)
        .then((response) => {
          setFormData({
            title: response.data.title,
            content: response.data.content,
            coverImage: response.data.coverImage,
            coverImageUrl: "",
            tags: response.data.tags.join(", "),
          });
        })
        .catch(() => setError("Failed to load blog data."))
        .finally(() => setIsLoading(false));
    }
  }, [id, isEditMode]);

  const handleChange = (
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

    /**
     * Prepare and send file upload request
     * Handles media upload with premium user considerations
     */
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
        "https://res.cloudinary.com/dy7fw9h6s/image/upload/v1754894548/22_kcl6sr.jpg"; // Set your default image path here
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

    const submissionData = {
      ...formData,
      coverImage: coverImageFinal,
      tags: formData.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
    };

    try {
      const request = isEditMode
        ? api.put(`/blogs/${id}`, submissionData)
        : api.post("/blogs", submissionData);
      await request;
      navigate("/blogs");
    } catch (err: any) {
      setError(err.response?.data?.message || "An error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8 pt-30">
      <h1 className="text-3xl font-bold mb-6">
        {isEditMode ? "Edit Article" : "Write a New Article"}
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
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label htmlFor="content" className="block text-sm font-medium mb-1">
            Content (Markdown supported)
          </label>
          <Textarea
            id="content"
            name="content"
            value={formData.content}
            onChange={handleChange}
            rows={15}
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
              onChange={handleChange}
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
          <label htmlFor="tags" className="block text-sm font-medium mb-1">
            Tags (comma-separated)
          </label>
          <Input
            id="tags"
            name="tags"
            value={formData.tags}
            onChange={handleChange}
          />
        </div>

        {error && <p className="text-red-500">{error}</p>}

        <div className="flex gap-4">
          <Button
            type="submit"
            disabled={isLoading || isUploading}
            className="flex-1"
          >
            {isLoading
              ? "Saving..."
              : isEditMode
              ? "Update Article"
              : "Publish Article"}
          </Button>
          {isEditMode && (
            <Button
              type="button"
              variant="destructive"
              disabled={isLoading}
              onClick={() => setIsDeleteDialogOpen(true)}
            >
              Delete Article
            </Button>
          )}
        </div>
      </form>

      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={async () => {
          try {
            await api.delete(`/blogs/${id}`);
            toast({
              title: "Success",
              description: "Blog deleted successfully",
            });
            navigate("/blogs");
          } catch (error) {
            toast({
              title: "Error",
              description: "Failed to delete blog",
              variant: "destructive",
            });
          }
        }}
        title="Delete Blog"
        description="Are you sure you want to delete this blog? This action cannot be undone."
        confirmText="Delete"
        variant="destructive"
      />
    </div>
  );
};

export default BlogForm;
