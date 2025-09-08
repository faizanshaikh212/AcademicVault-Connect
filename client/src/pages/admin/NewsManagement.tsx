import React, { useState, useEffect } from "react";
import api from "@/services/api";
import { useToast } from "@/hooks/useToast";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Link } from "react-router-dom";
import AdvancedSearch from "@/components/shared/AdvancedSearch";
import Sort from "@/components/shared/Sort";

interface Attachment {
  title: string;
  url: string;
}

interface NewsItem {
  _id: string;
  title: string;
  content: string;
  author: { _id: string; username: string } | null;
  createdAt: string;
  isPublished: boolean;
  attachments: Attachment[];
  coverImage?: string;
}

const NewsManagement: React.FC = () => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchNewsQuery, setSearchNewsQuery] = useState("");
  const [searchSubscriberQuery, setSearchSubscriberQuery] = useState("");
  const [sortOption, setSortOption] = useState("created-desc");

  // Create form state
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);

  // Subscribers
  const [subscribers, setSubscribers] = useState<any[]>([]);

  const { toast } = useToast();

  useEffect(() => {
    fetchNews();
    fetchSubscribers();
  }, []);

  const fetchNews = async () => {
    try {
      const response = await api.get("/news/all");
      setNews(response.data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch news",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchSubscribers = async () => {
    try {
      const response = await api.get("/news/subscribers");
      setSubscribers(response.data || []);
    } catch (error: any) {
      // non-fatal
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleCreateNews = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let coverImageUrl = "https://placehold.co/600x400";

      if (image) {
        const formData = new FormData();
        formData.append("file", image);
        const uploadRes = await api.post("/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        coverImageUrl = uploadRes.data.filePath;
      }

      const summary =
        content.length > 200 ? content.substring(0, 197) + "..." : content;

      await api.post("/news/create", {
        title,
        content,
        summary,
        coverImage: coverImageUrl,
        attachments,
        isPublished: true,
      });

      toast({ title: "Success", description: "News created successfully" });

      setTitle("");
      setContent("");
      setImage(null);
      setImagePreview("");
      setAttachments([]);
      fetchNews();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to create news",
        variant: "destructive",
      });
    }
  };

  const handleDeleteNews = async (id: string) => {
    try {
      await api.delete(`/news/${id}`);
      toast({ title: "Success", description: "News deleted successfully" });
      fetchNews();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to delete news",
        variant: "destructive",
      });
    }
  };

  const handleUpdateSubscriber = async (id: string, isActive: boolean) => {
    try {
      await api.put(`/news/subscribers/${id}`, { isActive });
      toast({
        title: "Success",
        description: `Subscriber ${
          isActive ? "activated" : "deactivated"
        } successfully`,
      });
      fetchSubscribers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update subscriber",
        variant: "destructive",
      });
    }
  };

  const handleDeleteSubscriber = async (id: string) => {
    try {
      await api.delete(`/news/subscribers/${id}`);
      toast({
        title: "Success",
        description: "Subscriber deleted successfully",
      });
      fetchSubscribers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to delete subscriber",
        variant: "destructive",
      });
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">News Management</h1>

      {/* Create News Form */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg mb-8">
        <h2 className="text-2xl font-semibold mb-4">Create News</h2>
        <form onSubmit={handleCreateNews} className="space-y-4">
          <div>
            <label
              htmlFor="title"
              className="block text-sm font-medium text-gray-700 dark:text-gray-200"
            >
              Title
            </label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="mt-1"
            />
          </div>

          <div>
            <label
              htmlFor="content"
              className="block text-sm font-medium text-gray-700 dark:text-gray-200"
            >
              Content
            </label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
              rows={4}
            />
          </div>

          <div>
            <label
              htmlFor="image"
              className="block text-sm font-medium text-gray-700 dark:text-gray-200"
            >
              Cover Image
            </label>
            <Input
              id="image"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="mt-1"
            />
            {imagePreview && (
              <div className="mt-2">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="max-w-[200px] rounded"
                />
              </div>
            )}
          </div>

          {/* Attachments Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
              Attachments
            </label>
            <div className="space-y-4">
              {attachments.map((attachment, index) => (
                <div
                  key={index}
                  className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <div className="flex-1">
                    <Input
                      value={attachment.title}
                      onChange={(e) => {
                        const newAttachments = [...attachments];
                        newAttachments[index].title = e.target.value;
                        setAttachments(newAttachments);
                      }}
                      placeholder="Attachment title"
                      className="mb-2"
                    />
                    <Input
                      value={attachment.url}
                      onChange={(e) => {
                        const newAttachments = [...attachments];
                        newAttachments[index].url = e.target.value;
                        setAttachments(newAttachments);
                      }}
                      placeholder="Attachment URL"
                    />
                  </div>
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => {
                      const newAttachments = attachments.filter(
                        (_, i) => i !== index
                      );
                      setAttachments(newAttachments);
                    }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  setAttachments([...attachments, { title: "", url: "" }])
                }
                className="w-full"
              >
                Add Attachment
              </Button>
            </div>
          </div>

          <Button type="submit">Create News</Button>
        </form>
      </div>

      {/* News List */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg mb-8">
        <h2 className="text-2xl font-semibold mb-4">News List</h2>

        <AdvancedSearch
          title="News"
          searchQuery={searchNewsQuery}
          onSearchChange={setSearchNewsQuery}
          onSearch={() => {
            /* server search */
          }}
          showFilters={false}
          setShowFilters={() => {}}
          debounceMs={250}
          showFilterButton={false}
        />

        <div className="mt-4 flex items-center justify-end">
          <Sort
            options={[
              { value: "created-desc", label: "Newest" },
              { value: "created-asc", label: "Oldest" },
              { value: "title-asc", label: "Title A-Z" },
              { value: "title-desc", label: "Title Z-A" },
            ]}
            value={sortOption}
            onChange={(v) => setSortOption(v)}
          />
        </div>

        <div className="space-y-4 mt-4">
          {news
            .filter((item) =>
              item.title.toLowerCase().includes(searchNewsQuery.toLowerCase())
            )
            .sort((a, b) => {
              switch (sortOption) {
                case "created-asc":
                  return (
                    new Date(a.createdAt).getTime() -
                    new Date(b.createdAt).getTime()
                  );
                case "created-desc":
                  return (
                    new Date(b.createdAt).getTime() -
                    new Date(a.createdAt).getTime()
                  );
                case "title-asc":
                  return a.title.localeCompare(b.title);
                case "title-desc":
                  return b.title.localeCompare(a.title);
                default:
                  return 0;
              }
            })
            .map((item) => (
              <div
                key={item._id}
                className="border-b dark:border-gray-700 pb-4"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-medium">
                      <Link
                        to={`/news/${item._id}`}
                        className="text-blue-600 hover:underline"
                        target="_blank"
                      >
                        {item.title}
                      </Link>
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      By{" "}
                      {item.author ? (
                        <Link
                          to={`/profile/${item.author.username}`}
                          className="text-blue-600 hover:underline"
                          target="_blank"
                        >
                          {item.author.username}
                        </Link>
                      ) : (
                        "Anonymous"
                      )}{" "}
                      • {new Date(item.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Button
                    onClick={() => handleDeleteNews(item._id)}
                    variant="destructive"
                    size="sm"
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Subscribers List */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-semibold mb-4">Newsletter Subscribers</h2>
        <div className="mb-4">
          <Input
            placeholder="Search subscribers..."
            value={searchSubscriberQuery}
            onChange={(e) => setSearchSubscriberQuery(e.target.value)}
            className="max-w-md"
          />
        </div>
        <div className="space-y-4">
          {subscribers
            .filter((subscriber) =>
              subscriber.email
                .toLowerCase()
                .includes(searchSubscriberQuery.toLowerCase())
            )
            .map((subscriber) => (
              <div
                key={subscriber._id}
                className="border-b dark:border-gray-700 pb-4"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">
                      {subscriber.user ? (
                        <>
                          <Link
                            to={`/profile/${subscriber.user.username}`}
                            className="text-blue-600 hover:underline"
                            target="_blank"
                          >
                            {subscriber.user.email}
                          </Link>
                          <span className="ml-2 text-green-500">(Member)</span>
                        </>
                      ) : (
                        <>
                          {subscriber.email}{" "}
                          <span className="text-gray-500">(Guest)</span>
                        </>
                      )}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Joined{" "}
                      {new Date(subscriber.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() =>
                        handleUpdateSubscriber(
                          subscriber._id,
                          !subscriber.isActive
                        )
                      }
                      variant={subscriber.isActive ? "destructive" : "default"}
                      size="sm"
                    >
                      {subscriber.isActive ? "Deactivate" : "Activate"}
                    </Button>
                    <Button
                      onClick={() => handleDeleteSubscriber(subscriber._id)}
                      variant="destructive"
                      size="sm"
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default NewsManagement;
