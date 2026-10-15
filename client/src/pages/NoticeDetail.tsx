import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "@/services/api";
import { formatDistance } from "date-fns";
import MarkdownContent from "@/components/shared/MarkdownContent";
import CoverMedia from "@/components/shared/CoverMedia";

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

  if (!notice) return <div className="flex min-h-[60vh] items-center justify-center text-sm text-slate-500 dark:text-gray-400">Notice not found</div>;

  return (
    <div className="min-h-screen bg-white px-4 pb-16 pt-28 dark:bg-gray-900 sm:px-6">
      <article className="mx-auto max-w-4xl overflow-hidden">
        <CoverMedia
          src={notice.coverImage || undefined}
          alt={notice.title}
          className="aspect-[16/9] w-full rounded-lg object-cover"
        />
        <header className="border-b border-gray-200 py-6 dark:border-gray-700">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-blue-600 dark:text-blue-400">
            Community notice
          </p>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-950 dark:text-white sm:text-4xl">{notice.title}</h1>
          <div className="mt-3 text-sm text-slate-500 dark:text-gray-400">By {notice.author?.username || "Anonymous"} • {formatDistance(new Date(notice.createdAt), new Date(), { addSuffix: true })}</div>
        </header>
        <div className="py-6">
          <MarkdownContent content={notice.content} />
        </div>
        {notice.attachments && notice.attachments.length > 0 && (
          <div className="border-t border-gray-200 py-6 dark:border-gray-700">
            <h3 className="font-semibold text-slate-950 dark:text-white">Attachments</h3>
            <ul className="ml-5 mt-3 list-disc space-y-2">
              {notice.attachments.map((att) => (
                <li key={att.url}><a href={att.url} target="_blank" rel="noreferrer" className="text-blue-700 hover:underline dark:text-blue-300">{att.title}</a></li>
              ))}
            </ul>
          </div>
        )}
      </article>
    </div>
  );
};

export default NoticeDetail;
