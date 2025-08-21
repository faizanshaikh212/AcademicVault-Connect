import React, { useState, useEffect } from "react";
import api from "@/services/api";
import MarkdownPage from "@/components/shared/MarkdownPage";
import Particles from "@/components/background/Particles";

const AboutUs: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<{ title: string; content: string } | null>(
    null
  );

  useEffect(() => {
    const fetchPage = async () => {
      try {
        const { data } = await api.get("/pages/about-us");
        setPage(data);
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to load About Us page");
      } finally {
        setLoading(false);
      }
    };

    fetchPage();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-red-500 text-center">{error}</div>
      </div>
    );
  }

  if (!page) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">About Us page content not found.</div>
      </div>
    );
  }

  return (
    <div className="relative w-full min-h-screen bg-gray-50 dark:bg-gray-900">
      <Particles
        className="absolute inset-0 z-0 opacity-50 dark:opacity-100"
        particleCount={100}
        particleSpread={10}
        speed={0.1}
        particleBaseSize={100}
        moveParticlesOnHover={true}
        alphaParticles={false}
        disableRotation={false}
      />
      <div className="relative z-10">
        <MarkdownPage title={page.title} content={page.content} />
      </div>
    </div>
  );
};

export default AboutUs;
