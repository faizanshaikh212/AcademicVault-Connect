import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Input } from "@/components/ui/Input";
import { Notification as NotificationType } from "@/types";
import api from "@/services/api";
import { UserPlus, Newspaper, UserCheck, Crown } from "lucide-react";
import { getAvatarUrl } from "@/lib/avatar";
import { formatDistance } from "date-fns";

const NotificationHistory = () => {
  const [notifications, setNotifications] = useState<NotificationType[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const { data } = await api.get<NotificationType[]>(
          "/notifications/history"
        );
        setNotifications(data);
        setLoading(false);
      } catch (error) {
        console.error("Failed to fetch notification history", error);
        setLoading(false);
      }
    };
    fetchNotifications();
  }, []);

  const getNotificationMessage = (notification: NotificationType) => {
    switch (notification.type) {
      case "follow":
        return (
          <>
            <UserPlus className="h-4 w-4 mr-2 text-blue-500" />{" "}
            <strong>{notification.sender.username}</strong> started following
            you.
          </>
        );
      case "new_news":
        return (
          <>
            <Newspaper className="h-4 w-4 mr-2 text-blue-500" />{" "}
            <strong>{notification.sender.username}</strong> published "
            {notification.message}" on the news page
          </>
        );
      case "new_notice":
        return (
          <>
            <Newspaper className="h-4 w-4 mr-2 text-blue-500" />{" "}
            <strong>{notification.sender.username}</strong> posted a notice: "
            {notification.message}"
          </>
        );
      case "role_approved":
        return (
          <>
            <UserCheck className="h-4 w-4 mr-2 text-green-500" /> Your teacher
            role request has been approved!
          </>
        );
      case "premium_approved":
        return (
          <>
            <Crown className="h-4 w-4 mr-2 text-yellow-500" /> Your premium
            access request has been approved!
          </>
        );
      default:
        return (
          <>
            <strong>{notification.sender?.username || "Someone"}</strong>{" "}
            {notification.message
              ? notification.message
              : "sent you a notification"}
          </>
        );
    }
  };

  const filteredNotifications = notifications.filter((notification) => {
    const searchLower = searchQuery.toLowerCase();
    const senderName = notification.sender.username.toLowerCase();
    const message = notification.message?.toLowerCase() || "";
    const type = notification.type.toLowerCase();

    return (
      senderName.includes(searchLower) ||
      message.includes(searchLower) ||
      type.includes(searchLower)
    );
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        Loading...
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 pt-30">
      <h1 className="text-3xl font-bold mb-8">Notification History</h1>

      <div className="mb-6">
        <Input
          type="text"
          placeholder="Search notifications..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-md"
        />
      </div>

      <div className="space-y-4">
        {filteredNotifications.map((notification) => (
          <div
            key={notification._id}
            className={`p-4 rounded-lg border ${
              notification.isRead
                ? "bg-white dark:bg-gray-800"
                : "bg-blue-50 dark:bg-gray-700"
            }`}
          >
            <Link to={notification.link} className="flex items-start">
              <img
                src={getAvatarUrl(notification.sender?.profile?.avatar)}
                alt={notification.sender?.username || "avatar"}
                className="h-10 w-10 rounded-full object-cover mr-3 flex-shrink-0"
              />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-900 dark:text-white">
                    {getNotificationMessage(notification)}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 ml-4">
                    {formatDistance(
                      new Date(notification.createdAt),
                      new Date(),
                      { addSuffix: true }
                    )}
                  </div>
                </div>
                {notification.message && (
                  <div className="text-sm text-gray-600 dark:text-gray-300 mt-2 line-clamp-2">
                    {notification.message}
                  </div>
                )}
              </div>
            </Link>
          </div>
        ))}

        {filteredNotifications.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            {searchQuery
              ? "No notifications match your search."
              : "No notifications in history."}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationHistory;
