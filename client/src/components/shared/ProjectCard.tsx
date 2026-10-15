import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Project } from "../../types";
import { getAvatarUrl } from "@/lib/avatar";
import { getCoverImageUrl } from "@/lib/images";
import CoverMedia from "./CoverMedia";
import { ArrowRight, Edit2, Trash2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "../ui/Button";
import ConfirmDialog from "./ConfirmDialog";
import { useToast } from "@/hooks/useToast";
import api from "@/services/api";

interface ProjectCardProps {
  project: Project;
  onDelete?: () => void;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, onDelete }) => {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Get premium status of the project author
  if (!project.author) {
    return null;
  }

  const ownerIsPremium = project.author.premium?.isPremium || false;
  const isOwner = user?._id === project.author._id;

  const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/projects/edit/${project._id}`);
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/projects/${project._id}`);
      toast({
        title: "Success",
        description: "Project deleted successfully",
      });
      onDelete?.();
      setIsDeleteDialogOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete project",
        variant: "destructive",
      });
    }
  };

  return (
    <article className="group relative flex h-full flex-col overflow-hidden">
      <Link
        to={`/projects/${project._id}`}
        className="absolute inset-0 z-10"
        aria-label={project.title}
      />

      <div className="aspect-[16/10] overflow-hidden bg-gray-100 dark:bg-gray-800">
        <CoverMedia
          src={project.coverImage ? getCoverImageUrl(project.coverImage) : undefined}
          alt={project.title}
          className="h-full w-full object-cover"
        />
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-700 dark:text-white dark:group-hover:text-blue-300">
          {project.title}
        </h3>
        <p className="mt-2 flex-1 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
          {project.description}
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          {project.tags.slice(0, 3).map((tag: string) => (
            <span
              key={tag}
              className="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800 dark:bg-blue-900/50 dark:text-blue-300"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-auto border-t border-gray-200 py-3 dark:border-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img
              src={getAvatarUrl(
                project.author.profile?.avatar,
                ownerIsPremium,
                project.author.updatedAt
              )}
              alt={project.author.username}
              className="h-8 w-8 rounded-full"
            />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {project.author.username}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {isOwner && (
              <div className="flex items-center gap-2 z-20">
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-0 hover:bg-transparent"
                  onClick={handleEdit}
                >
                  <Edit2 className="h-4 w-4 text-gray-500 hover:text-blue-500" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-0 hover:bg-transparent"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsDeleteDialogOpen(true);
                  }}
                >
                  <Trash2 className="h-4 w-4 text-gray-500 hover:text-red-500" />
                </Button>
              </div>
            )}
            <div className="flex items-center text-sm text-blue-600 transition-transform duration-300 group-hover:translate-x-1 dark:text-blue-400">
              View <ArrowRight className="ml-1 h-4 w-4" />
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title="Delete Project"
        description="Are you sure you want to delete this project? This action cannot be undone."
        confirmText="Delete"
        variant="destructive"
      />
    </article>
  );
};

export default ProjectCard;
