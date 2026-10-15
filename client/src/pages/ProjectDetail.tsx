import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import api from "@/services/api";
import { Project } from "../types";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import CoverMedia from "@/components/shared/CoverMedia";
import {
  ExternalLink,
  Github,
  Calendar,
  User as UserIcon,
  Edit,
} from "lucide-react";
import MarkdownContent from "@/components/shared/MarkdownContent";

const ProjectDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user: currentUser } = useAuth();

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const { data } = await api.get<Project>(`/projects/${id}`);
        setProject(data);
      } catch (err) {
        setError(
          "Failed to fetch project details. It may have been removed or the link is incorrect."
        );
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchProject();
    }
  }, [id]);

  if (isLoading)
    return <div className="text-center py-20">Loading project...</div>;
  if (error)
    return <div className="text-center py-20 text-red-500">{error}</div>;
  if (!project)
    return <div className="text-center py-20">Project not found.</div>;

  const isAuthor = currentUser?._id === project.author._id;

  return (
    <div className="min-h-screen bg-white px-5 py-10 pt-28 dark:bg-gray-900 md:px-8">
      <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-10 lg:grid-cols-[minmax(0,2fr)_minmax(16rem,1fr)] lg:gap-12">
        <div className="min-w-0">
          <div className="relative">
            <CoverMedia
              src={project.coverImage || undefined}
              alt={project.title}
              className="aspect-video w-full rounded-lg object-cover"
            />
            {isAuthor && (
              <Button asChild className="absolute top-4 right-4 z-10">
                <Link to={`/projects/edit/${project._id}`}>
                  <Edit className="mr-2 h-4 w-4" /> Edit Project
                </Link>
              </Button>
            )}
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mt-6">
            {project.title}
          </h1>
          <article>
            <MarkdownContent content={project.description} />
          </article>

          {/* Screenshots */}
          {project.screenshots && project.screenshots.length > 0 && (
            <div className="mt-12">
              <h2 className="text-2xl font-bold mb-4">Screenshots</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {project.screenshots.map((ss, index) => (
                  <img
                    key={index}
                    src={ss}
                    alt={`Screenshot ${index + 1}`}
                    className="w-full rounded-lg object-cover"
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Column */}
        <aside className="lg:col-span-1">
          <div className="h-fit w-full space-y-4 border-t border-gray-200 pt-5 dark:border-gray-700 lg:sticky lg:top-24 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
            <h3 className="border-b border-gray-200 pb-2 text-lg font-semibold dark:border-gray-700">
              Project Details
            </h3>

            {/* Author Info */}
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

            {/* Date */}
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-gray-500" />
              <span className="font-medium">Published:</span>
              <span>{new Date(project.createdAt).toLocaleDateString()}</span>
            </div>

            {/* Links */}
            <div className="space-y-2 pt-3 border-t dark:border-gray-700">
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

            {/* Social Media Links */}
            {project.socialMediaLinks &&
              Object.entries(project.socialMediaLinks).some(
                ([_, value]) => value
              ) && (
                <div className="pt-3 border-t dark:border-gray-700">
                  <h4 className="font-semibold mb-2">Connect</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {project.socialMediaLinks.github && (
                      <Button asChild variant="outline" size="sm">
                        <a
                          href={project.socialMediaLinks.github}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Github className="mr-2 h-4 w-4" />
                          GitHub
                        </a>
                      </Button>
                    )}
                    {project.socialMediaLinks.linkedin && (
                      <Button asChild variant="outline" size="sm">
                        <a
                          href={project.socialMediaLinks.linkedin}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <svg
                            className="mr-2 h-4 w-4"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                          >
                            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                          </svg>
                          LinkedIn
                        </a>
                      </Button>
                    )}
                    {project.socialMediaLinks.twitter && (
                      <Button asChild variant="outline" size="sm">
                        <a
                          href={project.socialMediaLinks.twitter}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <svg
                            className="mr-2 h-4 w-4"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                          >
                            <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                          </svg>
                          Twitter
                        </a>
                      </Button>
                    )}
                    {project.socialMediaLinks.instagram && (
                      <Button asChild variant="outline" size="sm">
                        <a
                          href={project.socialMediaLinks.instagram}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <svg
                            className="mr-2 h-4 w-4"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                          >
                            <path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.76-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z" />
                          </svg>
                          Instagram
                        </a>
                      </Button>
                    )}
                    {project.socialMediaLinks.facebook && (
                      <Button asChild variant="outline" size="sm">
                        <a
                          href={project.socialMediaLinks.facebook}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <svg
                            className="mr-2 h-4 w-4"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                          >
                            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                          </svg>
                          Facebook
                        </a>
                      </Button>
                    )}
                    {project.socialMediaLinks.youtube && (
                      <Button asChild variant="outline" size="sm">
                        <a
                          href={project.socialMediaLinks.youtube}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <svg
                            className="mr-2 h-4 w-4"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                          >
                            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                          </svg>
                          YouTube
                        </a>
                      </Button>
                    )}
                    {project.socialMediaLinks.website && (
                      <Button asChild variant="outline" size="sm">
                        <a
                          href={project.socialMediaLinks.website}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="mr-2 h-4 w-4" />
                          Website
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              )}
          </div>
        </aside>
      </div>
    </div>
  );
};

export default ProjectDetail;
