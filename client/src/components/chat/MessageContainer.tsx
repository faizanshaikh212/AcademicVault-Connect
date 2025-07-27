import React, { useState, useEffect, useRef } from "react";
import api from "@/services/api";
import { Chat as ChatType, Message as MessageType } from "../../types"; // Removed unused User import
import { useSocket } from "@/context/SocketContext";
import { useAuth } from "@/hooks/useAuth";
import Message from "./Message";
import MessageInput from "./MessageInput";

interface MessageContainerProps {
  selectedChat: ChatType | null;
}

const MessageContainer: React.FC<MessageContainerProps> = ({
  selectedChat,
}) => {
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { socket } = useSocket();
  const { user: currentUser } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Function to scroll to the bottom of the message list
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch messages when a chat is selected
  useEffect(() => {
    const fetchMessages = async () => {
      if (!selectedChat) return;
      setIsLoading(true);
      try {
        const { data } = await api.get<MessageType[]>(
          `/chats/${selectedChat._id}/messages`
        );
        setMessages(data);
      } catch (error) {
        console.error("Failed to fetch messages", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchMessages();
  }, [selectedChat]);

  // Listen for incoming messages via socket
  useEffect(() => {
    if (!socket) return;

    const messageListener = (newMessage: MessageType) => {
      if (selectedChat?._id === newMessage.chat._id) {
        setMessages((prevMessages) => [...prevMessages, newMessage]);
      }
    };

    socket.on("message received", messageListener);

    return () => {
      socket.off("message received", messageListener);
    };
  }, [socket, selectedChat]);

  const handleSendMessage = (content: string) => {
    if (!socket || !selectedChat || !currentUser) return;

    const messageData = {
      sender: currentUser,
      content,
      chat: selectedChat,
    };

    socket.emit("new message", messageData);

    // Optimistically update the UI
    const optimisticMessage: MessageType = {
      _id: Date.now().toString(), // Temporary ID
      sender: currentUser,
      content,
      chat: selectedChat,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticMessage]);
  };

  if (!selectedChat) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500">
        <p>Select a conversation to start chatting.</p>
      </div>
    );
  }

  const otherParticipant = selectedChat.participants.find(
    (p) => p._id !== currentUser?._id
  );
  const chatName = selectedChat.isGroupChat
    ? selectedChat.groupInfo?.name
    : otherParticipant?.username;

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-gray-950">
      <header className="p-4 border-b dark:border-gray-800">
        <h2 className="text-xl font-bold">{chatName}</h2>
      </header>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoading ? (
          <p className="text-center">Loading messages...</p>
        ) : (
          messages.map((msg) => <Message key={msg._id} message={msg} />)
        )}
        <div ref={messagesEndRef} />
      </div>
      <MessageInput onSendMessage={handleSendMessage} isLoading={!socket} />
    </div>
  );
};

export default MessageContainer;
