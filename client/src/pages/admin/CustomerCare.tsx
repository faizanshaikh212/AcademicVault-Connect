import React, { useEffect, useState } from "react";
import api from "@/services/api";
import ContactRequestTable from "@/components/shared/ContactRequestTable";
import { Eye, EyeOff } from "lucide-react";

interface Contact {
  _id: string;
  name: string;
  email: string;
  message: string;
  createdAt: string;
  userId?: string | null;
  status?: "completed" | "on-going" | "marked-for-deletion" | "pending";
}

const CustomerCare: React.FC = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showDeletePassword, setShowDeletePassword] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState(false);

  useEffect(() => {
    const fetchContacts = async () => {
      try {
        const token = localStorage.getItem("token");
        const { data } = await api.get("/contact/all", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setContacts(data);
      } catch (err: any) {
        setError("Failed to fetch contact submissions.");
      } finally {
        setLoading(false);
      }
    };
    fetchContacts();
  }, []);

  // Copy email to clipboard
  const handleCopyEmail = (email: string) => {
    navigator.clipboard.writeText(email);
    setCopied(true);
    setTimeout(() => setCopied(false), 700);
  };

  // Status update
  const handleStatusChange = async (id: string, status: Contact["status"]) => {
    // Optimistically update UI
    setContacts((prev) =>
      prev.map((c) => (c._id === id ? { ...c, status } : c))
    );
    try {
      const token = localStorage.getItem("token");
      await api.patch(
        `/contact/${id}/status`,
        { status },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
    } catch {
      // Revert UI if API fails
      setContacts((prev) =>
        prev.map((c) => (c._id === id ? { ...c, status: c.status } : c))
      );
    }
  };

  // Delete request
  const handleDelete = async (id: string) => {
    setDeleteError(null);
    try {
      const token = localStorage.getItem("token");
      await api.delete(`/contact/${id}`, {
        data: { password: deletePassword },
        headers: { Authorization: `Bearer ${token}` },
      });
      setContacts((prev) => prev.filter((c) => c._id !== id));
      setDeletingId(null);
      setDeletePassword("");
      setDeleteSuccess(true);
      setTimeout(() => setDeleteSuccess(false), 2500);
    } catch (err: any) {
      setDeleteError(err?.response?.data?.message || "Delete failed");
    }
  };

  // Go to user profile
  const handleGoToProfile = async (userId: string | null | undefined) => {
    if (!userId) return;
    try {
      const token = localStorage.getItem("token");
      // Fetch user details by ID
      const { data } = await api.get(`/users/id/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (data && data.username) {
        window.open(`/profile/${data.username}`, "_blank");
      }
    } catch {}
  };

  return (
    <div className="max-w-3xl mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-8 text-blue-700 dark:text-blue-300">
        Customer Care Requests
      </h1>
      {loading ? (
        <div className="text-center py-12">Loading...</div>
      ) : error ? (
        <div className="text-center text-red-500 font-semibold py-8">
          {error}
        </div>
      ) : contacts.length === 0 ? (
        <div className="text-center text-gray-400 py-8">
          No contact submissions found.
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {contacts.map((c) => (
            <ContactRequestTable
              key={c._id}
              contact={c}
              onCopyEmail={handleCopyEmail}
              onStatusChange={handleStatusChange}
              onDelete={(id) => setDeletingId(id)}
              onGoToProfile={handleGoToProfile}
            />
          ))}
        </div>
      )}
      {deletingId && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-gray-900 p-8 rounded-lg shadow-lg w-full max-w-md border border-gray-800">
            <h2 className="text-xl font-bold mb-4 text-red-400">
              Confirm Deletion
            </h2>
            <div className="relative mb-3">
              <input
                type={showDeletePassword ? "text" : "password"}
                className="w-full border rounded px-4 py-2 text-lg bg-gray-950 text-gray-200 border-gray-700 pr-10"
                placeholder="Enter your password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-400 text-sm"
                onClick={() => setShowDeletePassword((v) => !v)}
                tabIndex={-1}
              >
                {showDeletePassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
            {deleteError && (
              <p className="text-red-500 mb-2 font-semibold">{deleteError}</p>
            )}
            <div className="flex gap-3 mt-2">
              <button
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                onClick={() => handleDelete(deletingId!)}
              >
                Confirm Delete
              </button>
              <button
                className="flex-1 px-4 py-2 bg-gray-700 text-gray-200 rounded hover:bg-gray-800"
                onClick={() => {
                  setDeletingId(null);
                  setDeletePassword("");
                  setDeleteError(null);
                  setShowDeletePassword(false);
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      {copied && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 bg-blue-700 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-fade-in-out pointer-events-none">
          Copied!
        </div>
      )}
      {deleteSuccess && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-fade-in-out pointer-events-none">
          Contact request deleted successfully.
        </div>
      )}
    </div>
  );
};

export default CustomerCare;
