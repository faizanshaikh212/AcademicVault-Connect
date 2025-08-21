import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/useToast";
import api from "@/services/api";
import { Button } from "@/components/ui/Button";

const NewsForm = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    summary: "",
    content: "",
    coverImage: "",
    tags: "",
    isPublished: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.post("/news", {
        ...formData,
        tags: formData.tags.split(",").map((tag) => tag.trim()),
      });

      toast({
        title: "Success",
        description: "News article created successfully",
        variant: "default",
      });

      navigate("/admin/news");
    } catch (error: any) {
      toast({
        title: "Error",
        description:
          error.response?.data?.message || "Failed to create news article",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-6">Create News Article</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2" htmlFor="title">
            Title
          </label>
          <input
            type="text"
            id="title"
            required
            className="w-full rounded-md border border-gray-300 dark:border-gray-700 p-2"
            value={formData.title}
            onChange={(e) =>
              setFormData({ ...formData, title: e.target.value })
            }
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2" htmlFor="summary">
            Summary
          </label>
          <textarea
            id="summary"
            required
            rows={3}
            className="w-full rounded-md border border-gray-300 dark:border-gray-700 p-2"
            value={formData.summary}
            onChange={(e) =>
              setFormData({ ...formData, summary: e.target.value })
            }
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2" htmlFor="content">
            Content
          </label>
          <textarea
            id="content"
            required
            rows={10}
            className="w-full rounded-md border border-gray-300 dark:border-gray-700 p-2"
            value={formData.content}
            onChange={(e) =>
              setFormData({ ...formData, content: e.target.value })
            }
          />
        </div>

        <div>
          <label
            className="block text-sm font-medium mb-2"
            htmlFor="coverImage"
          >
            Cover Image URL
          </label>
          <input
            type="url"
            id="coverImage"
            required
            className="w-full rounded-md border border-gray-300 dark:border-gray-700 p-2"
            value={formData.coverImage}
            onChange={(e) =>
              setFormData({ ...formData, coverImage: e.target.value })
            }
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2" htmlFor="tags">
            Tags (comma-separated)
          </label>
          <input
            type="text"
            id="tags"
            className="w-full rounded-md border border-gray-300 dark:border-gray-700 p-2"
            value={formData.tags}
            onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
            placeholder="e.g., announcement, feature, update"
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="isPublished"
            checked={formData.isPublished}
            onChange={(e) =>
              setFormData({ ...formData, isPublished: e.target.checked })
            }
          />
          <label className="text-sm font-medium" htmlFor="isPublished">
            Publish immediately
          </label>
        </div>

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate("/admin/news")}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Creating..." : "Create News"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default NewsForm;
