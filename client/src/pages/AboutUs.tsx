import React, { useState, useEffect } from "react";
import api from "@/services/api";
import MarkdownPage from "@/components/shared/MarkdownPage";

const defaultAboutPage = {
  title: "About Academic Vault",
  content: `Academic Vault is a platform for finding, organizing, and sharing academic resources.

Students can browse notes, previous question papers, syllabi, and timetables by course. They can also contribute useful materials, read news and notices, and share projects.

Teachers can manage academic resources and course information. Review and approval workflows help keep shared materials organized.

Our goal is simple: make academic resources easier to find and share.`,
};

const AboutUs: React.FC = () => {
  const [page, setPage] = useState<{ title: string; content: string }>(
    defaultAboutPage
  );

  useEffect(() => {
    let isMounted = true;
    const fetchPage = async () => {
      try {
        const { data } = await api.get<{ title: string; content: string }>(
          "/pages/about-us"
        );
        if (isMounted) setPage(data);
      } catch (error) {
        console.error("Failed to load managed About Us page", error);
      }
    };

    fetchPage();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div>
      <MarkdownPage title={page.title} content={page.content} />
    </div>
  );
};

export default AboutUs;
