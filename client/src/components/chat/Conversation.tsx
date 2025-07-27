import React from "react";
import { useAuth } from "@/hooks/useAuth";
import { Chat as ChatType } from "../../types";
import { cn } from "@/lib/utils";

interface ConversationProps {
  chat: ChatType;
  isSelected: boolean;
  onSelect: (chat: ChatType) => void;
}

const Conversation: React.FC<ConversationProps> = ({
  chat,
  isSelected,
  onSelect,
}) => {
  const { user: currentUser } = useAuth();

  const otherParticipant = chat.participants.find(
    (p) => p._id !== currentUser?._id
  );

  const name = chat.isGroupChat
    ? chat.groupInfo?.name
    : otherParticipant?.username;
  const avatarUrl = chat.isGroupChat
    ? `https://i.pravatar.cc/48?u=${chat._id}`
    : otherParticipant?.profile?.avatar ||
      `https://i.pravatar.cc/48?u=${otherParticipant?._id}`;

  const lastMessageText = chat.lastMessage
    ? `${
        chat.lastMessage.sender._id === currentUser?._id
          ? "You"
          : chat.lastMessage.sender.username
      }: ${chat.lastMessage.content}`
    : "No messages yet.";

  return (
    <div
      onClick={() => onSelect(chat)}
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors hover:bg-gray-200 dark:hover:bg-gray-700",
        isSelected ? "bg-blue-100 dark:bg-blue-900/50" : "bg-transparent"
      )}
    >
      <img
        src={avatarUrl}
        alt={name}
        className="h-12 w-12 rounded-full object-cover"
      />
      <div className="flex-1 overflow-hidden">
        <h3 className="font-semibold truncate">{name}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
          {lastMessageText}
        </p>
      </div>
    </div>
  );
};

export default Conversation;
