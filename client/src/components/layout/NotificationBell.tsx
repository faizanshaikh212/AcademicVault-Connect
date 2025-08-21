import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "@/services/api";
import { Notification as NotificationType } from "../../types";
import {
  Bell,
  UserPlus,
  Newspaper,
  UserCheck,
  Crown,
  Trash2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "../ui/DropdownMenu"; // Separator removed
import { Button } from "../ui/Button";

const NotificationBell: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationType[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const { data } = await api.get<NotificationType[]>("/notifications");
        console.log("Fetched notifications:", data);
        const activeNotifications = data.filter((n) => !n.isCleared);
        console.log("Active notifications:", activeNotifications);
        setNotifications(activeNotifications);
        setUnreadCount(activeNotifications.filter((n) => !n.isRead).length);
      } catch (error) {
        console.error("Failed to fetch notifications", error);
      }
    };
    fetchNotifications();
  }, []);

  const handleMarkAsRead = async () => {
    if (unreadCount === 0) return;
    try {
      await api.post("/notifications/read");
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (error) {
      console.error("Failed to mark notifications as read", error);
    }
  };

  const handleClearNotifications = async () => {
    try {
      await api.post("/notifications/clear");
      setNotifications([]);
      setUnreadCount(0);
    } catch (error) {
      console.error("Failed to clear notifications", error);
    }
  };

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
        console.log("Rendering new_news notification:", notification);
        return (
          <div className="flex items-center">
            <Newspaper className="h-4 w-4 mr-2 text-blue-500 flex-shrink-0" />
            <span className="line-clamp-2">
              <strong>{notification.sender.username}</strong> published "
              {notification.message}"
            </span>
          </div>
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
        return "New notification";
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          onClick={handleMarkAsRead}
          className="relative p-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white focus:outline-none"
        >
          <Bell className="h-6 w-6" />
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 h-4 w-4 flex items-center justify-center rounded-full bg-red-500 text-xs text-white">
              {unreadCount}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="px-4 py-2 font-semibold border-b flex justify-between items-center">
          <span>Notifications</span>
          <div className="flex gap-2">
            {unreadCount > 0 && (
              <Button
                variant="link"
                size="sm"
                className="p-0 h-auto"
                onClick={handleMarkAsRead}
              >
                Mark all as read
              </Button>
            )}
            {notifications.length > 0 && (
              <Button
                variant="link"
                size="sm"
                className="p-0 h-auto flex items-center"
                onClick={handleClearNotifications}
              >
                <Trash2 className="h-4 w-4 mr-1" /> Clear
              </Button>
            )}
            <Button
              variant="link"
              size="sm"
              className="p-0 h-auto"
              onClick={() => navigate("/notification-history")}
            >
              History
            </Button>
          </div>
        </div>
        {notifications.length > 0 ? (
          notifications.slice(0, 5).map((notif) => (
            <DropdownMenuItem key={notif._id}>
              <Link
                to={notif.link}
                className="flex items-center w-full text-sm py-2 px-1 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                {getNotificationMessage(notif)}
              </Link>
            </DropdownMenuItem>
          ))
        ) : (
          <div className="p-4 text-sm text-center text-gray-500">
            No new notifications.
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default NotificationBell;
