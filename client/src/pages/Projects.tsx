import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "@/services/api";
import { Project } from "@/types";
import ProjectCard from "@/components/shared/ProjectCard";
import { Button } from "@/components/ui/Button";
import { Plus } from "lucide-react";
import NewsletterSubscribe from "@/components/shared/NewsletterSubscribe";
import AdvancedSearch from "@/components/shared/AdvancedSearch";
import Sort from "@/components/shared/Sort";

const Projects: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [sortOption, setSortOption] = useState<string>("newest");

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const { data } = await api.get<Project[]>("/projects");
        setProjects(data);
        setFilteredProjects(data);
      } catch (err) {
        setError("Failed to fetch projects. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjects();
  }, []);

  useEffect(() => {
    const results = projects.filter(
      (project) =>
        project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.tags.some((tag: string) =>
          tag.toLowerCase().includes(searchTerm.toLowerCase())
        )
    );
    setFilteredProjects(results);
  }, [searchTerm, projects]);

  return (
    <div className="relative w-full min-h-screen pt-30">
      <div className="absolute inset-0 -z-10"></div>
      <div className="container mx-auto px-4 pb-8">
        {/* Page Header */}
        <div className="flex flex-col items-start justify-between gap-4 border-b pb-6 md:flex-row md:items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
              Discover Projects
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Explore projects from talented students and teachers around the
              globe.
            </p>
          </div>
          <Button asChild>
            <Link to="/projects/new">
              <Plus className="mr-2 h-4 w-4" /> Add Your Project
            </Link>
          </Button>
        </div>

        {/* Search and Filters Bar */}
        <div className="mt-8">
          <div>
            <AdvancedSearch
              title={"Search projects"}
              searchQuery={searchQuery}
              onSearchChange={(v) => setSearchQuery(v)}
              onSearch={() => setSearchTerm(searchQuery)}
              showFilters={showFilters}
              setShowFilters={setShowFilters}
              showFilterButton={false}
            />

            <div className="flex items-center justify-between mt-2 mb-6">
              <div />
              <Sort
                options={[
                  { value: "newest", label: "Newest" },
                  { value: "oldest", label: "Oldest" },
                  { value: "title_asc", label: "Title A-Z" },
                  { value: "title_desc", label: "Title Z-A" },
                ]}
                value={sortOption}
                onChange={(v) => setSortOption(v)}
                className="mt-0"
              />
            </div>
          </div>
        </div>

        {/* Content Grid */}
        <div className="mt-8 min-h-[400px]">
          {isLoading ? (
            <p className="text-center">Loading projects...</p>
          ) : error ? (
            <p className="text-center text-red-500">{error}</p>
          ) : filteredProjects.length > 0 ? (
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredProjects.map((project) => (
                <ProjectCard
                  key={project._id}
                  project={project}
                  onDelete={() => {
                    setProjects((prevProjects) =>
                      prevProjects.filter((p) => p._id !== project._id)
                    );
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center min-h-[400px] bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                No Projects Found
              </p>
              <p className="text-gray-600 dark:text-gray-400 text-center max-w-md">
                {searchTerm
                  ? "Try different keywords or remove some filters."
                  : "Be the first to showcase your project to the community!"}
              </p>
            </div>
          )}
        </div>
        <div className="border-t border-gray-200 dark:border-gray-800 mt-8">
          <div className="py-12">
            <NewsletterSubscribe />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Projects;
