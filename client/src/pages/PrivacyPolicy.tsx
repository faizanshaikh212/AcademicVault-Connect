import React, { useState, useEffect, useMemo } from "react";
import api from "@/services/api";
import MarkdownPage from "@/components/shared/MarkdownPage";

const PrivacyPolicy: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<{ title: string; content: string } | null>(
    null
  );

  useEffect(() => {
    const fetchPage = async () => {
      try {
        const { data } = await api.get("/pages/privacy-policy");
        setPage(data);
      } catch (err: any) {
        setError(
          err.response?.data?.message || "Failed to load Privacy Policy"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchPage();
  }, []);

  // Recommended editor token: place the text [cookie-section] somewhere in the
  // privacy markdown (via admin editor). This token will be replaced with a
  // real anchor element so links like /privacy#cookie-section work reliably.
  // If you prefer a different token, update TOKEN below.
  const TOKEN = "[cookie-section]";
  const ANCHOR_ID = "cookie-section";

  const processedContent = useMemo(() => {
    if (!page?.content) return "";
    // Simple, safe replacement — editors add the token in the markdown where they want the anchor.
    return page.content.split(TOKEN).join(`<div id="${ANCHOR_ID}"></div>`);
  }, [page]);

  // If the user navigated to /privacy#cookie-section, wait for the injected
  // anchor to be rendered (markdown rendering is async) and then smooth-scroll.
  useEffect(() => {
    if (!page) return;
    const rawHash = (window.location.hash || "").replace(/^#/, "");
    if (!rawHash) return;

    const selector = `#${rawHash}`;
    let tries = 0;
    const maxTries = 30; // ~3s (30 * 100ms)
    const delay = 100;

    const tryScroll = () => {
      const el = document.querySelector(selector);
      if (el) {
        const SCROLL_OFFSET = -80; // adjust if you have a fixed header
        const top =
          el.getBoundingClientRect().top + window.scrollY + SCROLL_OFFSET;
        window.scrollTo({ top, behavior: "smooth" });
        return;
      }
      if (tries++ < maxTries) setTimeout(tryScroll, delay);
    };

    tryScroll();
  }, [page]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 pt-30">
        <div className="text-red-500 text-center">{error}</div>
      </div>
    );
  }

  if (!page) {
    return (
      <div className="container mx-auto px-4 py-8 pt-30">
        <div className="text-center">Privacy Policy not found.</div>
      </div>
    );
  }
  return <MarkdownPage title={page.title} content={processedContent} />;
};

export default PrivacyPolicy;
