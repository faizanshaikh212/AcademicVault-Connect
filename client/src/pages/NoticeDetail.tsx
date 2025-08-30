import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "@/services/api";
import { formatDistance } from "date-fns";
import MarkdownContent from "@/components/shared/MarkdownContent";

interface NoticeItem {
  _id: string;
  title: string;
  content: string;
  summary: string;
  coverImage: string;
  author: { username: string } | null;
  createdAt: string;
  tags: string[];
  attachments?: { title: string; url: string }[];
}

const NoticeDetail: React.FC = () => {
  const { id } = useParams();
  const [notice, setNotice] = useState<NoticeItem | null>(null);

  useEffect(() => {
    const fetchNotice = async () => {
      try {
        const response = await api.get(`/notices/${id}`);
        setNotice(response.data);
      } catch (error) {
        console.error("Failed to fetch notice:", error);
      }
    };
    fetchNotice();
  }, [id]);

  if (!notice) return <div className="flex justify-center items-center min-h-screen">Notice not found</div>;

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-3xl mx-auto bg-white dark:bg-gray-900 p-6 rounded-lg shadow">
        <img src={notice.coverImage} alt={notice.title} className="w-full h-64 object-cover rounded" />
        <h1 className="text-3xl font-bold mt-4">{notice.title}</h1>
        <div className="text-sm text-gray-500">By {notice.author?.username || "Anonymous"} • {formatDistance(new Date(notice.createdAt), new Date(), { addSuffix: true })}</div>
        <div className="mt-4">
          <MarkdownContent content={notice.content} />
        </div>
        {notice.attachments && notice.attachments.length > 0 && (
          <div className="mt-6">
            <h3 className="font-semibold">Attachments</h3>
            <ul className="list-disc ml-5">
              {notice.attachments.map((att) => (
                <li key={att.url}><a href={att.url} target="_blank" rel="noreferrer" className="text-blue-600">{att.title}</a></li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default NoticeDetail;
