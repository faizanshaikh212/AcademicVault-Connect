import React, { useState, useEffect } from "react";
import api from "@/services/api";
import MarkdownPage from "@/components/shared/MarkdownPage";

const TermsAndConditions: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<{ title: string; content: string } | null>(
    null
  );

  useEffect(() => {
    const fetchPage = async () => {
      try {
        const { data } = await api.get("/pages/terms-and-conditions");
        setPage(data);
      } catch (err: any) {
        setError(
          err.response?.data?.message || "Failed to load Terms and Conditions"
        );
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
        <div className="text-center">Terms and Conditions not found.</div>
      </div>
    );
  }

  return <MarkdownPage title={page.title} content={page.content} />;
};

export default TermsAndConditions;
