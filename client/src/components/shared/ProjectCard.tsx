import React from "react";
import { Link } from "react-router-dom";
import { Project } from "../../types";
import { ArrowRight } from "lucide-react";

interface ProjectCardProps {
  project: Project;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project }) => {
  // THE FIX: If for some reason a project's author was deleted,
  // we prevent the component from crashing.
  if (!project.author) {
    return null;
  }

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-lg border bg-white shadow-sm transition-all hover:shadow-lg dark:border-gray-800 dark:bg-gray-900">
      <Link
        to={`/projects/${project._id}`}
        className="absolute inset-0 z-10"
        aria-label={project.title}
      />

      <div className="aspect-video overflow-hidden">
        <img
          src={project.coverImage}
          alt={project.title}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
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

      <div className="border-t p-4 dark:border-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img
              src={
                project.author.profile?.avatar ||
                `https://i.pravatar.cc/40?u=${project.author._id}`
              }
              alt={project.author.username}
              className="h-8 w-8 rounded-full"
            />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {project.author.username}
            </span>
          </div>
          <div className="flex items-center text-sm text-blue-600 transition-transform duration-300 group-hover:translate-x-1 dark:text-blue-400">
            View <ArrowRight className="ml-1 h-4 w-4" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectCard;
