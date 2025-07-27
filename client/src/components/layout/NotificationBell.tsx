import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "@/services/api";
import { Notification as NotificationType } from "../../types";
import { useSocket } from "@/context/SocketContext";
import { Bell, UserPlus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "../ui/DropdownMenu"; // Separator removed
import { Button } from "../ui/Button";

// A simple sound player using Tone.js
const playNotificationSound = () => {
  // The global.d.ts file will prevent TypeScript errors on window.Tone
  if (window.Tone) {
    const synth = new window.Tone.Synth().toDestination();
    synth.triggerAttackRelease("C5", "8n");
  }
};

const NotificationBell: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationType[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { socket } = useSocket();

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const { data } = await api.get<NotificationType[]>("/notifications");
        setNotifications(data);
        setUnreadCount(data.filter((n) => !n.isRead).length);
      } catch (error) {
        console.error("Failed to fetch notifications", error);
      }
    };
    fetchNotifications();
  }, []);

  // Listen for real-time notifications
  useEffect(() => {
    if (!socket) return;

    const handleNewNotification = (newNotification: NotificationType) => {
      playNotificationSound();
      setNotifications((prev) => [newNotification, ...prev]);
      setUnreadCount((prev) => prev + 1);
    };

    socket.on("new notification", handleNewNotification);

    return () => {
      socket.off("new notification", handleNewNotification);
    };
  }, [socket]);

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
        </div>
        {notifications.length > 0 ? (
          notifications.slice(0, 5).map((notif) => (
            <DropdownMenuItem key={notif._id}>
              <Link
                to={notif.link}
                className="flex items-center w-full text-sm"
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
