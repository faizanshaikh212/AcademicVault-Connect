import { useState, useEffect } from "react";
import api from "@/services/api";
import { useToast } from "@/hooks/useToast";
import { formatDistance } from "date-fns";

interface Subscriber {
  _id: string;
  email: string;
  isActive: boolean;
  createdAt: string;
  isRegisteredUser: boolean;
  displayName: string;
  userType: "Registered User" | "Guest";
}

type ActionState = {
  id: string;
  type: "delete" | "toggle";
};

const SubscriberList = () => {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<ActionState | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchSubscribers();
  }, []);

  const fetchSubscribers = async () => {
    try {
      setError(null);
      console.log("Fetching subscribers...");
      const response = await api.get("/news/subscribers");
      console.log("Subscribers response:", response.data);
      setSubscribers(response.data);
    } catch (error: any) {
      console.error("Error fetching subscribers:", error.response || error);
      setError(error.response?.data?.message || "Failed to fetch subscribers");
      toast({
        title: "Error",
        description:
          error.response?.data?.message || "Failed to fetch subscribers",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusToggle = async (id: string, currentStatus: boolean) => {
    try {
      setActionLoading({ id, type: "toggle" });
      await api.put(`/news/subscribers/${id}`, {
        isActive: !currentStatus,
      });

      setSubscribers(
        subscribers.map((sub) =>
          sub._id === id ? { ...sub, isActive: !currentStatus } : sub
        )
      );

      toast({
        title: "Success",
        description: `Subscriber ${
          !currentStatus ? "activated" : "deactivated"
        } successfully`,
        variant: "default",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description:
          error.response?.data?.message || "Failed to update subscriber status",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this subscriber?")) {
      return;
    }

    try {
      setActionLoading({ id, type: "delete" });
      await api.delete(`/news/subscribers/${id}`);
      setSubscribers(subscribers.filter((sub) => sub._id !== id));

      toast({
        title: "Success",
        description: "Subscriber deleted successfully",
        variant: "default",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description:
          error.response?.data?.message || "Failed to delete subscriber",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-6">Newsletter Subscribers</h2>

      {loading ? (
        <div className="flex justify-center items-center min-h-[200px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
        </div>
      ) : error ? (
        <div className="text-red-500 text-center">{error}</div>
      ) : subscribers.length === 0 ? (
        <div className="text-center text-gray-500 dark:text-gray-400 py-8">
          No subscribers found.
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200 dark:divide-gray-800">
            {subscribers.map((subscriber) => (
              <li key={subscriber._id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {subscriber.displayName}
                        <span
                          className={`ml-2 text-xs px-2 py-1 rounded ${
                            subscriber.isRegisteredUser
                              ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                              : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
                          }`}
                        >
                          {subscriber.userType}
                        </span>
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {subscriber.email}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Subscribed{" "}
                        {formatDistance(
                          new Date(subscriber.createdAt),
                          new Date(),
                          { addSuffix: true }
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() =>
                        handleStatusToggle(subscriber._id, subscriber.isActive)
                      }
                      disabled={actionLoading?.id === subscriber._id}
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        subscriber.isActive
                          ? "bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900 dark:text-green-200"
                          : "bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200"
                      } ${
                        actionLoading?.id === subscriber._id
                          ? "opacity-50 cursor-not-allowed"
                          : ""
                      }`}
                    >
                      {actionLoading?.id === subscriber._id &&
                      actionLoading.type === "toggle"
                        ? "Updating..."
                        : subscriber.isActive
                        ? "Active"
                        : "Inactive"}
                    </button>
                    <button
                      onClick={() => handleDelete(subscriber._id)}
                      disabled={actionLoading?.id === subscriber._id}
                      className={`text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 ${
                        actionLoading?.id === subscriber._id
                          ? "opacity-50 cursor-not-allowed"
                          : ""
                      }`}
                    >
                      {actionLoading?.id === subscriber._id &&
                      actionLoading.type === "delete"
                        ? "Deleting..."
                        : "Delete"}
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default SubscriberList;
