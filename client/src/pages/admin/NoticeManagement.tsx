import React, { useState, useEffect } from "react";
import api from "@/services/api";
import { useToast } from "@/hooks/useToast";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Link } from "react-router-dom";

interface Attachment {
  title: string;
  url: string;
}

interface NoticeItem {
  _id: string;
  title: string;
  content: string;
  author: { _id: string; username: string } | null;
  createdAt: string;
  isPublished: boolean;
  attachments: Attachment[];
}

const NoticeManagement: React.FC = () => {
  const [notices, setNotices] = useState<NoticeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  // Form state
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);

  useEffect(() => {
    fetchNotices();
  }, []);

  const fetchNotices = async () => {
    try {
      const response = await api.get("/notices/all");
      setNotices(response.data);
    } catch (error: any) {
      toast({ title: "Error", description: "Failed to fetch notices", variant: "destructive" });
    } finally {
      setLoading(false);
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

  const handleCreateNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let coverImageUrl = "https://placehold.co/600x400";
      if (image) {
        const formData = new FormData();
        formData.append("file", image);
        const uploadRes = await api.post("/upload", formData, { headers: { "Content-Type": "multipart/form-data" } });
        coverImageUrl = uploadRes.data.filePath;
      }

      const summary = content.length > 200 ? content.substring(0, 197) + "..." : content;

      await api.post("/notices/create", { title, content, summary, coverImage: coverImageUrl, attachments, isPublished: true });

      toast({ title: "Success", description: "Notice created successfully" });
      setTitle("");
      setContent("");
      setImage(null);
      setImagePreview("");
      setAttachments([]);
      fetchNotices();
    } catch (error: any) {
      toast({ title: "Error", description: error.response?.data?.message || "Failed to create notice", variant: "destructive" });
    }
  };

  const handleDeleteNotice = async (id: string) => {
    try {
      await api.delete(`/notices/${id}`);
      toast({ title: "Success", description: "Notice deleted successfully" });
      fetchNotices();
    } catch (error: any) {
      toast({ title: "Error", description: "Failed to delete notice", variant: "destructive" });
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Notice Management</h1>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg mb-8">
        <h2 className="text-2xl font-semibold mb-4">Create Notice</h2>
        <form onSubmit={handleCreateNotice} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Title</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} required className="mt-1" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Content</label>
            <textarea value={content} onChange={(e) => setContent(e.target.value)} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" rows={4} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Cover Image</label>
            <Input type="file" accept="image/*" onChange={handleImageChange} className="mt-1" />
            {imagePreview && <div className="mt-2"><img src={imagePreview} alt="Preview" className="max-w-[200px] rounded" /></div>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Attachments</label>
            <div className="space-y-4">
              {attachments.map((attachment, index) => (
                <div key={index} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <Input value={attachment.title} onChange={(e) => { const newAttachments = [...attachments]; newAttachments[index].title = e.target.value; setAttachments(newAttachments); }} placeholder="Attachment title" className="mb-2" />
                    <Input value={attachment.url} onChange={(e) => { const newAttachments = [...attachments]; newAttachments[index].url = e.target.value; setAttachments(newAttachments); }} placeholder="Attachment URL" />
                  </div>
                  <Button variant="destructive" size="icon" onClick={() => setAttachments(attachments.filter((_, i) => i !== index))}>Remove</Button>
                </div>
              ))}
              <Button type="button" variant="outline" onClick={() => setAttachments([...attachments, { title: "", url: "" }])} className="w-full">Add Attachment</Button>
            </div>
          </div>

          <Button type="submit">Create Notice</Button>
        </form>
      </div>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg mb-8">
        <h2 className="text-2xl font-semibold mb-4">Notice List</h2>
        <div className="mb-4">
          <Input placeholder="Search notices..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="max-w-md" />
        </div>
        <div className="space-y-4">
          {notices.filter(n => n.title.toLowerCase().includes(searchQuery.toLowerCase())).map(item => (
            <div key={item._id} className="border-b pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <Link to={`/notices/${item._id}`} className="text-lg font-semibold">{item.title}</Link>
                  <div className="text-sm text-gray-500">By {item.author?.username || 'Unknown'}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Button onClick={() => handleDeleteNotice(item._id)} variant="destructive">Delete</Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default NoticeManagement;
