import React, { useEffect, useState } from "react";
import api from "../../services/api";

const TeacherDashboard: React.FC = () => {
  const [newsCount, setNewsCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const response = await api.get("/news/all");
        setNewsCount(response.data.length);
      } catch (error) {
        setNewsCount(null);
      } finally {
        setLoading(false);
      }
    };
    fetchNews();
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Teacher Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg flex flex-col items-center justify-center">
          <h2 className="text-xl font-semibold mb-2">Total News</h2>
          {loading ? (
            <span>Loading...</span>
          ) : (
            <span className="text-4xl font-bold text-green-600 dark:text-green-400">
              {newsCount ?? "-"}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;
