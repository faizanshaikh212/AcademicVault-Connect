import React, { Suspense, useState, useEffect } from "react";
import api from "@/services/api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";
import { Edit, Trash2, Eye } from "lucide-react";
import { Link } from "react-router-dom";
import MainPagesSection from "@/components/admin/MainPagesSection";

const StaticPageEditor = React.lazy(
  () => import("@/components/admin/StaticPageEditor")
);

/**
 * Interface representing a generic content item in the admin panel
 * @interface ContentItem
 * @property {string} _id - Unique identifier for the content item
 * @property {string} title - Title of the content item
 * @property {Object} author - Author information
 * @property {string} author.name - Name of the author
 * @property {string} author._id - Unique identifier of the author
 * @property {string} createdAt - Creation timestamp
 * @property {string} updatedAt - Last update timestamp
 */
interface ContentItem {
  _id: string;
  title: string;
  author: {
    _id: string;
    firstName: string;
    lastName: string;
    username: string;
  };
  createdAt: string;
  updatedAt: string;
}

const ContentManagement: React.FC = () => {
  const [blogs, setBlogs] = useState<ContentItem[]>([]);
  const [projects, setProjects] = useState<ContentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingPage, setEditingPage] = useState<{
    slug: string;
    title: string;
    content: string;
  } | null>(null);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const [blogsRes, projectsRes] = await Promise.all([
          api.get("/admin/content/blogs"),
          api.get("/admin/content/projects"),
        ]);
        setBlogs(blogsRes.data);
        setProjects(projectsRes.data);
      } catch (error) {
        console.error("Failed to fetch content", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchContent();
  }, []);

  /**
   * Handles the deletion of blog posts or projects
   * Confirms with user before deletion and updates the UI accordingly
   * @param {("blog"|"project")} type - The type of content to delete
   * @param {string} id - The unique identifier of the content item
   * @returns {Promise<void>}
   */
  const handleDelete = async (type: "blog" | "project", id: string) => {
    if (!window.confirm("Are you sure you want to delete this item?")) return;

    try {
      await api.delete(`/${type}s/${id}`);
      if (type === "blog") {
        setBlogs((prev) => prev.filter((item) => item._id !== id));
      } else {
        setProjects((prev) => prev.filter((item) => item._id !== id));
      }
    } catch (error) {
      console.error(`Failed to delete ${type}`, error);
    }
  };

  const handlePageEdit = async (slug: string) => {
    try {
      const { data } = await api.get(`/pages/${slug}`);
      setEditingPage(data);
    } catch (err) {
      console.error("Failed to fetch page", err);
      // Initialize with default content if page doesn't exist
      setEditingPage({
        slug,
        title:
          slug === "about-us"
            ? "About Us"
            : slug === "terms-and-conditions"
            ? "Terms and Conditions"
            : "Privacy Policy",
        content:
          "# " +
          (slug === "about-us"
            ? "About Us"
            : slug === "terms-and-conditions"
            ? "Terms and Conditions"
            : "Privacy Policy") +
          "\n\nEdit this content...",
      });
    }
  };

  const ContentTable: React.FC<{
    items: ContentItem[];
    type: "blog" | "project";
  }> = ({ items, type }) => (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Author</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Updated</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item._id}>
              <TableCell className="font-medium">{item.title}</TableCell>
              <TableCell>
                {item.author ? (
                  <Link
                    to={`/profile/${item.author.username}`}
                    className="text-blue-500 hover:text-blue-700 hover:underline"
                  >
                    {item.author.username}
                  </Link>
                ) : item.author === null ? (
                  <span className="text-red-500">Deleted User</span>
                ) : (
                  <span className="text-gray-500">Unknown User</span>
                )}
              </TableCell>
              <TableCell>
                {new Date(item.createdAt).toLocaleString(undefined, {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </TableCell>
              <TableCell>
                {new Date(item.updatedAt).toLocaleString(undefined, {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Link
                    to={`/${type}s/${item._id}`}
                    className="text-blue-500 hover:text-blue-700"
                  >
                    <Eye className="h-5 w-5" />
                  </Link>
                  <Link
                    to={`/${type}s/edit/${item._id}`}
                    className="text-yellow-500 hover:text-yellow-700"
                  >
                    <Edit className="h-5 w-5" />
                  </Link>
                  <button
                    onClick={() => handleDelete(type, item._id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );

  if (isLoading) return <p className="text-center">Loading content...</p>;

  /**
   * Renders the content management interface
   * Displays tabs for blogs and projects with management controls
   * @returns {JSX.Element} Content management component
   */
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Content Management</h1>
        <div className="space-x-4">
          <Button asChild>
            <Link to="/blogs/new">New Blog</Link>
          </Button>
          <Button asChild>
            <Link to="/projects/new">New Project</Link>
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        <MainPagesSection onEditPage={handlePageEdit} />

        <div className="border-t pt-6">
          <Tabs defaultValue="blogs" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="blogs">Blogs</TabsTrigger>
              <TabsTrigger value="projects">Projects</TabsTrigger>
            </TabsList>
            <TabsContent value="blogs" className="mt-6">
              <ContentTable items={blogs} type="blog" />
            </TabsContent>
            <TabsContent value="projects" className="mt-6">
              <ContentTable items={projects} type="project" />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {editingPage && (
        <Suspense fallback={<div role="status">Loading editor...</div>}>
          <StaticPageEditor
            isOpen
            onClose={() => setEditingPage(null)}
            editingPage={editingPage}
            setEditingPage={setEditingPage}
          />
        </Suspense>
      )}
    </div>
  );
};

export default ContentManagement;
