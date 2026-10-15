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
      } catch {
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
    <div className="min-h-screen w-full bg-white pt-20 dark:bg-gray-900">
      <header className="px-5 py-10 md:px-8 md:py-14">
        <div className="container mx-auto w-full max-w-[120rem]">
          <div className="flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
                Discover Projects
              </h1>
              <p className="mt-3 text-lg text-gray-600 dark:text-gray-400">
                Explore projects shared by students and teachers.
              </p>
            </div>
            <Button asChild>
              <Link to="/projects/new">
                <Plus className="mr-2 h-4 w-4" /> Add Your Project
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto w-full max-w-[120rem] px-5 pb-12 md:px-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="min-w-0 flex-1">
            <AdvancedSearch
              title={"Search projects"}
              searchQuery={searchQuery}
              onSearchChange={(v) => setSearchQuery(v)}
              onSearch={() => setSearchTerm(searchQuery)}
              showFilters={showFilters}
              setShowFilters={setShowFilters}
              showFilterButton={false}
            />
          </div>
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

        <div className="min-h-[400px]">
          {isLoading ? (
            <p className="py-16 text-center text-gray-600 dark:text-gray-400">
              Loading projects...
            </p>
          ) : error ? (
            <p className="py-16 text-center text-red-500">{error}</p>
          ) : filteredProjects.length > 0 ? (
            <div className="grid grid-cols-1 gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
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
            <div className="flex min-h-[320px] flex-col items-center justify-center px-6 text-center">
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
      </main>
      <div className="border-t border-gray-200 py-12 dark:border-gray-800">
        <div className="container mx-auto w-full max-w-[120rem] px-5 md:px-8">
          <NewsletterSubscribe />
        </div>
      </div>
    </div>
  );
};

export default Projects;
