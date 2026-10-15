import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "@/services/api";
import { Blog } from "../types";
import { Button } from "@/components/ui/Button";
import BlogCard from "@/components/shared/BlogCard";
import Aurora from "@/components/background/Aurora";
import { ArrowRight, BookOpen, FileText, Users } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import NewsletterSubscribe from "@/components/shared/NewsletterSubscribe";

const Home: React.FC = () => {
  const { user } = useAuth();
  const [latestBlogs, setLatestBlogs] = useState<Blog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchLatestBlogs = async () => {
      try {
        const { data } = await api.get<Blog[]>("/blogs");
        if (isMounted) setLatestBlogs(data.slice(0, 4));
      } catch (error) {
        console.error("Failed to fetch latest blogs", error);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchLatestBlogs();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="relative w-full overflow-hidden bg-white dark:bg-gray-900">
      <div className="relative z-10">
        <section className="relative flex min-h-[clamp(22rem,56svh,32rem)] items-center justify-center overflow-hidden px-5 py-16 text-center text-slate-900 dark:text-gray-200 md:px-8">
          <Aurora
            colorStops={["#3A29FF", "#FF94B4", "#FF3232"]}
            blend={0.5}
            amplitude={1}
            speed={0.5}
            className="absolute inset-0 z-0"
          />
          <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-col items-center">
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
              Find, share, and learn.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-700 dark:text-gray-300 sm:text-lg sm:leading-8">
              A shared place for students and teachers to find academic
              resources, share useful work, and stay connected.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-4">
              {!user && (
                <Button asChild size="lg">
                  <Link to="/register">
                    Get Started <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              )}
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-gray-700 bg-transparent text-slate-900 hover:bg-white/80 dark:border-white dark:text-white dark:hover:bg-white/90 dark:hover:text-gray-900"
              >
                <Link to="/about-us">Learn More</Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="bg-gray-50 py-12 dark:bg-gray-900 md:py-16">
          <div className="container mx-auto w-full max-w-[120rem] px-5 md:px-8 xl:px-10">
            <div className="text-center">
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
                A useful place for academic work
              </h2>
              <p className="mx-auto mt-4 max-w-3xl text-lg text-gray-600 dark:text-gray-400">
                Find materials, share projects, and learn from what others have
                contributed.
              </p>
            </div>
            <div className="mt-9 grid grid-cols-1 gap-8 md:grid-cols-3 md:gap-8">
              <article className="flex flex-col items-center p-4 text-center">
                <BookOpen
                  className="h-8 w-8 text-blue-600 dark:text-blue-400"
                  aria-hidden="true"
                />
                <h3 className="mt-5 text-xl font-semibold">
                  Academic Resources
                </h3>
                <p className="mt-2 max-w-sm text-gray-600 dark:text-gray-400">
                  Browse notes, past papers, syllabi, and timetables by subject
                  and course.
                </p>
                <Link
                  to="/academic/notes"
                  className="mt-4 inline-flex items-center text-sm font-medium text-blue-700 hover:underline dark:text-blue-300"
                >
                  Browse resources <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </article>
              <article className="flex flex-col items-center p-4 text-center">
                <FileText
                  className="h-8 w-8 text-blue-600 dark:text-blue-400"
                  aria-hidden="true"
                />
                <h3 className="mt-5 text-xl font-semibold">Projects & Ideas</h3>
                <p className="mt-2 max-w-sm text-gray-600 dark:text-gray-400">
                  Share a project, write an article, or discover practical work
                  from the community.
                </p>
                <Link
                  to="/projects"
                  className="mt-4 inline-flex items-center text-sm font-medium text-blue-700 hover:underline dark:text-blue-300"
                >
                  Explore projects <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </article>
              <article className="flex flex-col items-center p-4 text-center">
                <Users
                  className="h-8 w-8 text-blue-600 dark:text-blue-400"
                  aria-hidden="true"
                />
                <h3 className="mt-5 text-xl font-semibold">Shared Knowledge</h3>
                <p className="mt-2 max-w-sm text-gray-600 dark:text-gray-400">
                  Learn from notes, guides, and experiences shared by students
                  and teachers.
                </p>
                <Link
                  to="/blogs"
                  className="mt-4 inline-flex items-center text-sm font-medium text-blue-700 hover:underline dark:text-blue-300"
                >
                  Read community articles <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </article>
            </div>
          </div>
        </section>

        <section className="bg-white py-12 dark:bg-gray-950 md:py-16">
          <div className="container mx-auto w-full max-w-[120rem] px-5 md:px-8 xl:px-10">
            <div className="text-center">
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
                From the community
              </h2>
              <p className="mx-auto mt-4 max-w-3xl text-lg text-gray-600 dark:text-gray-400">
                Read articles and ideas shared by students and teachers.
              </p>
            </div>

            <div className="mt-9">
              {isLoading ? (
                <p className="text-center text-gray-600 dark:text-gray-400">
                  Loading latest articles...
                </p>
              ) : latestBlogs.length > 0 ? (
                <div className="grid grid-cols-1 gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                  {latestBlogs.map((blog) => (
                    <BlogCard key={blog._id} blog={blog} />
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-600 dark:text-gray-400">
                  No articles have been published yet.
                </p>
              )}
            </div>

            <div className="mt-9 text-center">
              <Button asChild size="lg" variant="outline">
                <Link to="/blogs">See All Articles</Link>
              </Button>
            </div>
          </div>
        </section>

        <NewsletterSubscribe />
      </div>
    </div>
  );
};

export default Home;
