import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import CodeBlock from "./CodeBlock";

interface Contact {
  _id: string;
  name: string;
  email: string;
  message: string;
  createdAt: string;
  userId?: string | null;
  status?: "completed" | "on-going" | "marked-for-deletion" | "pending";
}

interface Props {
  contact: Contact;
  onCopyEmail: (email: string) => void;
  onStatusChange: (id: string, status: Contact["status"]) => void;
  onDelete: (id: string) => void;
  onGoToProfile: (userId: string | null | undefined) => void;
}

const ContactRequestTable: React.FC<Props> = ({
  contact,
  onCopyEmail,
  onStatusChange,
  onDelete,
  onGoToProfile,
}) => {
  const [isMessageOpen, setIsMessageOpen] = React.useState(false);

  return (
    <div className="rounded-xl shadow-lg border border-gray-800 bg-gray-900 overflow-hidden">
      <div className="sticky top-0 z-10">
        <div className="p-4 bg-gray-800 flex flex-wrap gap-4 items-center justify-between">
          <div className="font-bold text-lg text-blue-400">
            {contact.userId ? (
              <button
                className="hover:underline focus:outline-none"
                onClick={() => onGoToProfile(contact.userId)}
              >
                {contact.name}
              </button>
            ) : (
              <span>
                {contact.name}{" "}
                <span className="text-xs text-gray-400">
                  (not a signed up user)
                </span>
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <select
              value={contact.status ?? "pending"}
              onChange={(e) =>
                onStatusChange(contact._id, e.target.value as Contact["status"])
              }
              className="border rounded px-2 py-1 bg-gray-900 text-blue-300 border-blue-700 focus:ring-2 focus:ring-blue-500"
            >
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="on-going">On-Going</option>
              <option value="marked-for-deletion">Mark for Deletion</option>
            </select>
            <button
              onClick={() => setIsMessageOpen(!isMessageOpen)}
              className={`px-3 py-1 rounded border transition-colors ${
                isMessageOpen
                  ? "bg-gray-700 border-gray-600 text-gray-200"
                  : "bg-gray-900 border-gray-700 text-gray-300 hover:bg-gray-800"
              }`}
            >
              {isMessageOpen ? "Hide Message" : "Show Message"}
            </button>
          </div>
        </div>

        <div className="p-4 bg-gray-900 border-b border-gray-800">
          <div className="flex flex-wrap gap-2 items-center">
            <span className="font-semibold text-gray-300">Email:</span>
            <button
              className="text-blue-400 underline hover:text-blue-300"
              onClick={() => onCopyEmail(contact.email)}
              title="Copy email"
            >
              {contact.email}
            </button>
          </div>
        </div>
      </div>

      {isMessageOpen && (
        <div className="text-gray-300">
          <div className="markdown-content bg-gray-950 p-4 border-t border-gray-800">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                code: (props) => <CodeBlock {...props} />,
                p: ({ children }) => (
                  <p className="mb-4 last:mb-0">{children}</p>
                ),
                ul: (props) => (
                  <ul className="list-disc list-inside my-4" {...props} />
                ),
                ol: (props) => (
                  <ol className="list-decimal list-inside my-4" {...props} />
                ),
                li: ({ children }) => <li className="ml-4 mb-2">{children}</li>,
                h1: ({ children }) => (
                  <h1 className="text-2xl font-bold mb-4">{children}</h1>
                ),
                h2: ({ children }) => (
                  <h2 className="text-xl font-bold mb-3">{children}</h2>
                ),
                h3: ({ children }) => (
                  <h3 className="text-lg font-bold mb-2">{children}</h3>
                ),
                a: ({ href, children }) => (
                  <a
                    href={href}
                    className="text-blue-400 hover:text-blue-300 hover:underline"
                    target={href?.startsWith("http") ? "_blank" : undefined}
                    rel={
                      href?.startsWith("http")
                        ? "noopener noreferrer"
                        : undefined
                    }
                  >
                    {children}
                  </a>
                ),
              }}
            >
              {contact.message}
            </ReactMarkdown>
          </div>
        </div>
      )}

      <div className="px-4 py-3 flex flex-wrap gap-4 items-center justify-between border-t border-gray-800 bg-gray-900">
        <span className="text-xs text-gray-500">
          {new Date(contact.createdAt).toLocaleString(undefined, {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
        <button
          className="px-4 py-1.5 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          onClick={() => onDelete(contact._id)}
        >
          Delete
        </button>
      </div>
    </div>
  );
};

export default ContactRequestTable;
