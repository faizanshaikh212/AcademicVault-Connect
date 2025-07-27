import React, { useState, useEffect } from "react";
import api from "@/services/api";
import { Chat as ChatType } from "../../types";
import Conversation from "./Conversation";
import { Button } from "../ui/Button";
import { Plus } from "lucide-react";

interface ConversationListProps {
  selectedChat: ChatType | null;
  onSelectChat: (chat: ChatType) => void;
}

const ConversationList: React.FC<ConversationListProps> = ({
  selectedChat,
  onSelectChat,
}) => {
  const [chats, setChats] = useState<ChatType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchChats = async () => {
      try {
        const { data } = await api.get<ChatType[]>("/chats");
        setChats(data);
      } catch (err) {
        setError("Failed to load conversations.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchChats();
  }, []);

  return (
    <div className="w-full md:w-1/3 lg:w-1/4 border-r dark:border-gray-800 bg-gray-50 dark:bg-gray-900 flex flex-col">
      <div className="p-4 border-b dark:border-gray-800 flex justify-between items-center">
        <h2 className="text-xl font-bold">Conversations</h2>
        <Button size="icon" variant="ghost">
          <Plus className="h-5 w-5" />
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {isLoading ? (
          <p className="text-center text-gray-500 p-4">Loading...</p>
        ) : error ? (
          <p className="text-center text-red-500 p-4">{error}</p>
        ) : chats.length > 0 ? (
          chats.map((chat) => (
            <Conversation
              key={chat._id}
              chat={chat}
              isSelected={selectedChat?._id === chat._id}
              onSelect={onSelectChat}
            />
          ))
        ) : (
          <p className="text-center text-gray-500 p-4">No conversations yet.</p>
        )}
      </div>
    </div>
  );
};

export default ConversationList;
