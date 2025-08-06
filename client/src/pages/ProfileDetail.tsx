import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import api from "@/services/api";
import { Project } from "../types";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import {
  ExternalLink,
  Github,
  Calendar,
  User as UserIcon,
  Edit,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const ProjectDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user: currentUser } = useAuth();

  useEffect(() => {
    const fetchProject = async () => {
      if (!id) return;
      setIsLoading(true);
      try {
        const { data } = await api.get<Project>(`/projects/${id}`);
        setProject(data);
      } catch (err) {
        setError("Failed to fetch project details.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchProject();
  }, [id]);

  if (isLoading)
    return <div className="text-center py-20">Loading project...</div>;
  if (error)
    return <div className="text-center py-20 text-red-500">{error}</div>;
  if (!project)
    return <div className="text-center py-20">Project not found.</div>;

  const isAuthor = currentUser?._id === project.author._id;

  return (
    <div className="container mx-auto px-4 py-8 pt-30">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="relative mb-6">
            <img
              src={project.coverImage}
              alt={project.title}
              className="w-full rounded-lg shadow-lg aspect-video object-cover"
            />
            {isAuthor && (
              <Button asChild className="absolute top-4 right-4 z-10">
                <Link to={`/projects/edit/${project._id}`}>
                  <Edit className="mr-2 h-4 w-4" /> Edit Project
                </Link>
              </Button>
            )}
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
            {project.title}
          </h1>
          <article className="prose prose-lg dark:prose-invert max-w-none mt-8">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {project.description}
            </ReactMarkdown>
          </article>
          {project.screenshots && project.screenshots.length > 0 && (
            <div className="mt-12">
              <h2 className="text-2xl font-bold mb-4">Screenshots</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {project.screenshots.map((ss, index) => (
                  <img
                    key={index}
                    src={ss}
                    alt={`Screenshot ${index + 1}`}
                    className="rounded-lg shadow-md w-full object-cover"
                  />
                ))}
              </div>
            </div>
          )}
        </div>
        <aside className="lg:col-span-1">
          <div className="sticky top-24 space-y-6 rounded-lg border bg-white p-6 shadow-sm dark:bg-gray-900 dark:border-gray-800">
            <h3 className="text-lg font-semibold border-b pb-3 dark:border-gray-700">
              Project Details
            </h3>
            <div className="flex items-center gap-3">
              <UserIcon className="h-5 w-5 text-gray-500" />
              <span className="font-medium">Author:</span>
              <Link
                to={`/profile/${project.author.username}`}
                className="text-blue-600 hover:underline dark:text-blue-400"
              >
                {project.author.username}
              </Link>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-gray-500" />
              <span className="font-medium">Published:</span>
              <span>{new Date(project.createdAt).toLocaleDateString()}</span>
            </div>
            <div className="space-y-3 pt-4 border-t dark:border-gray-700">
              {project.projectLink && (
                <Button asChild className="w-full">
                  <a
                    href={project.projectLink}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="mr-2 h-4 w-4" /> View Project
                  </a>
                </Button>
              )}
              {project.sourceCodeLink && (
                <Button asChild variant="secondary" className="w-full">
                  <a
                    href={project.sourceCodeLink}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Github className="mr-2 h-4 w-4" /> Source Code
                  </a>
                </Button>
              )}
            </div>
            <div className="pt-4 border-t dark:border-gray-700">
              <h4 className="font-semibold mb-3">Tags</h4>
              <div className="flex flex-wrap gap-2">
                {project.tags.map((tag: string) => (
                  <span
                    key={tag}
                    className="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-800 dark:bg-gray-800 dark:text-gray-300"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default ProjectDetail;
