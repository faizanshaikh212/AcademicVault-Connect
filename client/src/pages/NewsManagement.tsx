import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/services/api";
import { formatDistance } from "date-fns";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/hooks/useToast";

interface NewsItem {
  _id: string;
  title: string;
  summary: string;
  coverImage: string;
  author: {
    username: string;
  };
  createdAt: string;
  isPublished: boolean;
  attachments: Array<{
    title: string;
    url: string;
  }>;
}

const NewsManagement: React.FC = () => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchNews();
  }, []);

  const fetchNews = async () => {
    try {
      const response = await api.get("/news/all");
      setNews(response.data);
    } catch (error) {
      console.error("Failed to fetch news:", error);
      toast({
        title: "Error",
        description: "Failed to fetch news",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this news item?")) {
      return;
    }

    try {
      await api.delete(`/news/${id}`);
      toast({
        title: "Success",
        description: "News deleted successfully",
      });
      fetchNews();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete news",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        Loading...
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Manage News</h1>
        <Button onClick={() => navigate("/admin/news/new")}>Create News</Button>
      </div>

      <div className="grid gap-6">
        {news.map((item) => (
          <div
            key={item._id}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6"
          >
            <div className="flex items-start gap-4">
              <img
                src={item.coverImage}
                alt={item.title}
                className="w-24 h-24 object-cover rounded-lg"
              />
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-semibold mb-2">{item.title}</h2>
                    <p className="text-gray-600 dark:text-gray-300 mb-2">
                      {item.summary}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => navigate(`/admin/news/${item._id}/edit`)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => handleDelete(item._id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mt-2">
                  <span>{item.author.username}</span>
                  <span className="mx-2">•</span>
                  <time dateTime={item.createdAt}>
                    {formatDistance(new Date(item.createdAt), new Date(), {
                      addSuffix: true,
                    })}
                  </time>
                  <span className="mx-2">•</span>
                  <span>
                    {item.attachments?.length || 0} attachment
                    {item.attachments?.length !== 1 ? "s" : ""}
                  </span>
                  <span className="mx-2">•</span>
                  <span
                    className={`${
                      item.isPublished
                        ? "text-green-600 dark:text-green-400"
                        : "text-red-600 dark:text-red-400"
                    }`}
                  >
                    {item.isPublished ? "Published" : "Draft"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NewsManagement;
