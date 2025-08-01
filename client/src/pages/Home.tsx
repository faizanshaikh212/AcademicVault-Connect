import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "@/services/api";
import { Blog } from "../types";
import { Button } from "@/components/ui/Button";
import BlogCard from "@/components/shared/BlogCard";
import Particles from "@/components/background/Particles"; // Corrected import path
import Aurora from "@/components/background/Aurora"; // Corrected import path
import { ArrowRight, BookOpen, Users, Lightbulb } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const Home: React.FC = () => {
  const { user } = useAuth();
  const [latestBlogs, setLatestBlogs] = useState<Blog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLatestBlogs = async () => {
      try {
        const { data } = await api.get<Blog[]>("/blogs");
        setLatestBlogs(data.slice(0, 4));
      } catch (error) {
        console.error("Failed to fetch latest blogs", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchLatestBlogs();
  }, []);

  return (
    <div className="relative w-full overflow-hidden bg-gray-900">
      {/* Full Page Particle Background - this fixes the hover issue */}
      <Particles
        className="absolute inset-0 z-0"
        particleCount={200}
        particleSpread={10}
        speed={0.1}
        particleBaseSize={100}
        moveParticlesOnHover={true}
        alphaParticles={false}
        disableRotation={false}
      />

      <div className="relative z-10">
        {/* 1. Hero Section with Aurora */}
        <section className="relative flex h-[70vh] min-h-[500px] w-full items-center justify-center text-center text-white overflow-hidden">
          <Aurora
            colorStops={["#3A29FF", "#FF94B4", "#FF3232"]}
            blend={0.5}
            amplitude={1.0}
            speed={0.5}
            className="absolute inset-0 z-0"
          />
          <div className="relative z-10 flex flex-col items-center px-4">
            <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl lg:text-6xl">
              Connect, Collaborate, Create.
            </h1>
            <p className="mt-4 max-w-2xl text-lg text-gray-200 md:text-xl">
              The ultimate workspace for students and teachers to share
              knowledge, build projects, and grow together.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
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
                className="bg-transparent border-white text-white hover:bg-white/90 hover:text-gray-900"
              >
                <Link to="/projects">Discover Projects</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* 2. Why Choose Us Section */}
        <section className="py-16 md:py-24 bg-gray-50 dark:bg-gray-900">
          <div className="container mx-auto px-4">
            <div className="text-center">
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
                Why Choose Academic Vault?
              </h2>
              <p className="mt-4 max-w-3xl mx-auto text-lg text-gray-600 dark:text-gray-400">
                We provide a feature-rich environment designed for academic
                success and collaboration.
              </p>
            </div>
            <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-3">
              <div className="flex flex-col items-center text-center p-6">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300">
                  <Users className="h-8 w-8" />
                </div>
                <h3 className="mt-6 text-xl font-semibold">Global Network</h3>
                <p className="mt-2 text-gray-600 dark:text-gray-400">
                  Connect with peers and mentors from around the world.
                </p>
              </div>
              <div className="flex flex-col items-center text-center p-6">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300">
                  <Lightbulb className="h-8 w-8" />
                </div>
                <h3 className="mt-6 text-xl font-semibold">Project Showcase</h3>
                <p className="mt-2 text-gray-600 dark:text-gray-400">
                  Share your work, get feedback, and build your portfolio.
                </p>
              </div>
              <div className="flex flex-col items-center text-center p-6">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300">
                  <BookOpen className="h-8 w-8" />
                </div>
                <h3 className="mt-6 text-xl font-semibold">Shared Knowledge</h3>
                <p className="mt-2 text-gray-600 dark:text-gray-400">
                  Publish and discover articles, tutorials, and blogs.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 3. Blogs Section */}
        <section className="py-16 md:py-24 bg-white dark:bg-gray-950">
          <div className="container mx-auto px-4">
            <div className="text-center">
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
                From Our Blog
              </h2>
              <p className="mt-4 max-w-3xl mx-auto text-lg text-gray-600 dark:text-gray-400">
                Check out the latest articles from our community of creators and
                educators.
              </p>
            </div>
            <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {isLoading ? (
                <p className="col-span-full text-center">
                  Loading latest blogs...
                </p>
              ) : (
                latestBlogs.map((blog) => (
                  <BlogCard key={blog._id} blog={blog} />
                ))
              )}
            </div>
            <div className="mt-12 text-center">
              <Button asChild size="lg" variant="outline">
                <Link to="/blogs">See All Blogs</Link>
              </Button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Home;
/*this is default code:
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "@/services/api";
import { Blog } from "../types";
import { Button } from "@/components/ui/Button";
import BlogCard from "@/components/shared/BlogCard";
import Particles from "@/components/background/Particles"; // Corrected import path
import Aurora from "@/components/background/Aurora"; // Corrected import path
import { ArrowRight, BookOpen, Users, Lightbulb } from "lucide-react";
// The unused 'cn' import has been removed.

const Home: React.FC = () => {
  const [latestBlogs, setLatestBlogs] = useState<Blog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLatestBlogs = async () => {
      try {
        const { data } = await api.get<Blog[]>("/blogs");
        setLatestBlogs(data.slice(0, 4));
      } catch (error) {
        console.error("Failed to fetch latest blogs", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchLatestBlogs();
  }, []);

  return (
    <div className="relative w-full overflow-hidden bg-gray-900">
      {/* Full Page Particle Background - this fixes the hover issue}
      <Particles
        className="absolute inset-0 z-0"
        particleCount={200}
        particleSpread={10}
        speed={0.1}
        particleBaseSize={100}
        moveParticlesOnHover={true}
        alphaParticles={false}
        disableRotation={false}
      />

      <div className="relative z-10">
        {/* 1. Hero Section with Aurora }
        <section className="relative flex h-[70vh] min-h-[500px] w-full items-center justify-center text-center text-white overflow-hidden">
          <Aurora
            colorStops={["#3A29FF", "#FF94B4", "#FF3232"]}
            blend={0.5}
            amplitude={1.0}
            speed={0.5}
            className="absolute inset-0 z-0"
          />
          <div className="relative z-10 flex flex-col items-center px-4">
            <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl lg:text-6xl">
              Connect, Collaborate, Create.
            </h1>
            <p className="mt-4 max-w-2xl text-lg text-gray-200 md:text-xl">
              The ultimate workspace for students and teachers to share
              knowledge, build projects, and grow together.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
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
                className="bg-transparent border-white text-white hover:bg-white/90 hover:text-gray-900"
              >
                <Link to="/projects">Discover Projects</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* 2. Why Choose Us Section }
        <section className="py-16 md:py-24 bg-gray-50 dark:bg-gray-900">
          <div className="container mx-auto px-4">
            <div className="text-center">
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
                Why Choose Academic Vault?
              </h2>
              <p className="mt-4 max-w-3xl mx-auto text-lg text-gray-600 dark:text-gray-400">
                We provide a feature-rich environment designed for academic
                success and collaboration.
              </p>
            </div>
            <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-3">
              <div className="flex flex-col items-center text-center p-6">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300">
                  <Users className="h-8 w-8" />
                </div>
                <h3 className="mt-6 text-xl font-semibold">Global Network</h3>
                <p className="mt-2 text-gray-600 dark:text-gray-400">
                  Connect with peers and mentors from around the world.
                </p>
              </div>
              <div className="flex flex-col items-center text-center p-6">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300">
                  <Lightbulb className="h-8 w-8" />
                </div>
                <h3 className="mt-6 text-xl font-semibold">Project Showcase</h3>
                <p className="mt-2 text-gray-600 dark:text-gray-400">
                  Share your work, get feedback, and build your portfolio.
                </p>
              </div>
              <div className="flex flex-col items-center text-center p-6">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300">
                  <BookOpen className="h-8 w-8" />
                </div>
                <h3 className="mt-6 text-xl font-semibold">Shared Knowledge</h3>
                <p className="mt-2 text-gray-600 dark:text-gray-400">
                  Publish and discover articles, tutorials, and blogs.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 3. Blogs Section }
        <section className="py-16 md:py-24 bg-white dark:bg-gray-950">
          <div className="container mx-auto px-4">
            <div className="text-center">
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
                From Our Blog
              </h2>
              <p className="mt-4 max-w-3xl mx-auto text-lg text-gray-600 dark:text-gray-400">
                Check out the latest articles from our community of creators and
                educators.
              </p>
            </div>
            <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {isLoading ? (
                <p className="col-span-full text-center">
                  Loading latest blogs...
                </p>
              ) : (
                latestBlogs.map((blog) => (
                  <BlogCard key={blog._id} blog={blog} />
                ))
              )}
            </div>
            <div className="mt-12 text-center">
              <Button asChild size="lg" variant="outline">
                <Link to="/blogs">See All Blogs</Link>
              </Button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Home;
*/
