import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "@/services/api";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { useToast } from "@/hooks/useToast";
import ConfirmDialog from "@/components/shared/ConfirmDialog";

interface Attachment {
  title: string;
  url: string;
}

interface NewsFormData {
  title: string;
  content: string;
  summary: string;
  coverImage: string;
  coverImageUrl: string;
  tags: string;
  attachments: Attachment[];
}

const NewsForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isEditMode = Boolean(id);

  const [formData, setFormData] = useState<NewsFormData>({
    title: "",
    content: "",
    summary: "",
    coverImage: "",
    coverImageUrl: "",
    tags: "",
    attachments: [],
  });

  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  useEffect(() => {
    if (isEditMode) {
      setIsLoading(true);
      api
        .get(`/news/${id}`)
        .then((response) => {
          setFormData({
            title: response.data.title,
            content: response.data.content,
            summary: response.data.summary,
            coverImage: response.data.coverImage,
            coverImageUrl: "",
            tags: response.data.tags.join(", "),
            attachments: response.data.attachments || [],
          });
        })
        .catch(() => setError("Failed to load news data."))
        .finally(() => setIsLoading(false));
    }
  }, [id, isEditMode]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setError(null);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    if (file.size > MAX_FILE_SIZE) {
      setError("File size exceeds 5MB limit");
      e.target.value = "";
      return;
    }

    const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];
    if (!allowedTypes.includes(file.type)) {
      setError("Please upload only JPEG, JPG, or PNG images.");
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
        "https://res.cloudinary.com/dy7fw9h6s/image/upload/v1754894548/22_kcl6sr.jpg";
    }

    // Filter out empty attachments
    const validAttachments = formData.attachments
      .filter((attachment) => attachment && typeof attachment === "object")
      .filter(
        (attachment) => attachment.title?.trim() && attachment.url?.trim()
      );

    const submissionData = {
      title: formData.title,
      content: formData.content,
      summary: formData.summary,
      coverImage: coverImageFinal,
      attachments: validAttachments,
      tags: formData.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
    };

    try {
      console.log("Submitting data:", submissionData); // Debug log
      const request = isEditMode
        ? api.put(`/news/${id}`, submissionData)
        : api.post("/news/create", submissionData);
      const response = await request;
      console.log("Response:", response.data); // Debug log
      navigate("/news");
    } catch (err: any) {
      setError(err.response?.data?.message || "An error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8 pt-30">
      <h1 className="text-3xl font-bold mb-6">
        {isEditMode ? "Edit News" : "Create News"}
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
          <label htmlFor="summary" className="block text-sm font-medium mb-1">
            Summary
          </label>
          <Input
            id="summary"
            name="summary"
            value={formData.summary}
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
            accept="image/jpeg,image/jpg,image/png"
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

        {/* Attachments Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <label className="block text-sm font-medium">Attachments</label>
            <Button
              type="button"
              onClick={() => {
                setFormData((prev) => ({
                  ...prev,
                  attachments: [...prev.attachments, { title: "", url: "" }],
                }));
              }}
              className="flex items-center space-x-1"
            >
              <span>Add Attachment</span>
            </Button>
          </div>

          <div className="space-y-4">
            {formData.attachments.map((attachment, index) => (
              <div key={index} className="flex gap-4 items-start">
                <div className="flex-1">
                  <Input
                    placeholder="Attachment Title"
                    value={attachment.title}
                    onChange={(e) => {
                      const newAttachments = [...formData.attachments];
                      newAttachments[index] = {
                        ...newAttachments[index],
                        title: e.target.value,
                      };
                      setFormData((prev) => ({
                        ...prev,
                        attachments: newAttachments,
                      }));
                    }}
                  />
                </div>
                <div className="flex-1">
                  <Input
                    placeholder="Attachment URL"
                    value={attachment.url}
                    onChange={(e) => {
                      const newAttachments = [...formData.attachments];
                      newAttachments[index] = {
                        ...newAttachments[index],
                        url: e.target.value,
                      };
                      setFormData((prev) => ({
                        ...prev,
                        attachments: newAttachments,
                      }));
                    }}
                  />
                </div>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => {
                    const newAttachments = formData.attachments.filter(
                      (_, i) => i !== index
                    );
                    setFormData((prev) => ({
                      ...prev,
                      attachments: newAttachments,
                    }));
                  }}
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
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
              ? "Update News"
              : "Publish News"}
          </Button>
          {isEditMode && (
            <Button
              type="button"
              variant="destructive"
              disabled={isLoading}
              onClick={() => setIsDeleteDialogOpen(true)}
            >
              Delete News
            </Button>
          )}
        </div>
      </form>

      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={async () => {
          try {
            await api.delete(`/news/${id}`);
            toast({
              title: "Success",
              description: "News deleted successfully",
            });
            navigate("/news");
          } catch (error) {
            toast({
              title: "Error",
              description: "Failed to delete news",
              variant: "destructive",
            });
          }
        }}
        title="Delete News"
        description="Are you sure you want to delete this news? This action cannot be undone."
        confirmText="Delete"
        variant="destructive"
      />
    </div>
  );
};

export default NewsForm;
