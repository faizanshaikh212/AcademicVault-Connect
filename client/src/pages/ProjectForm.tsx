import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "@/services/api";
import { Project } from "../types";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";

const ProjectForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    coverImage: "",
    screenshots: [] as string[],
    projectLink: "",
    sourceCodeLink: "",
    tags: "",
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
            screenshots: data.screenshots ?? [], // Provide default if undefined
            projectLink: data.projectLink ?? "", // Provide default if undefined
            sourceCodeLink: data.sourceCodeLink ?? "", // Provide default if undefined
            tags: data.tags.join(", "), // Convert tags array to a comma-separated string
          });
        } catch (err) {
          setError("Failed to load project data for editing.");
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

    const uploadData = new FormData();
    uploadData.append("file", file);
    setIsUploading(true);
    setError(null);
    try {
      const { data } = await api.post("/upload", uploadData);
      setFormData((prevData) => ({ ...prevData, coverImage: data.filePath }));
    } catch (err) {
      setError("File upload failed. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.coverImage) {
      setError("A cover image is required. Please upload one.");
      return;
    }

    setIsLoading(true);
    setError(null);

    const submissionData = {
      ...formData,
      tags: formData.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
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
          {isUploading && (
            <p className="text-sm text-blue-500 mt-2">Uploading image...</p>
          )}
          {formData.coverImage && (
            <img
              src={formData.coverImage}
              alt="Cover preview"
              className="mt-4 h-32 w-auto rounded"
            />
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
