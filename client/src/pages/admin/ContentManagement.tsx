import React, { useState, useEffect } from "react";
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

interface ContentItem {
  _id: string;
  title: string;
  author: {
    name: string;
    _id: string;
  };
  createdAt: string;
  updatedAt: string;
}

const ContentManagement: React.FC = () => {
  const [blogs, setBlogs] = useState<ContentItem[]>([]);
  const [projects, setProjects] = useState<ContentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        // Use the admin endpoints instead of the public ones
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
              <TableCell>{item.author.name}</TableCell>
              <TableCell>
                {new Date(item.createdAt).toLocaleDateString()}
              </TableCell>
              <TableCell>
                {new Date(item.updatedAt).toLocaleDateString()}
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Content Management</h1>
        <div className="space-x-4">
          <Button asChild>
            <Link to="/blog-form">New Blog</Link>
          </Button>
          <Button asChild>
            <Link to="/project-form">New Project</Link>
          </Button>
        </div>
      </div>

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
  );
};

export default ContentManagement;
