import React from "react";
import { Message as MessageType } from "../../types";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface MessageProps {
  message: MessageType;
}

const Message: React.FC<MessageProps> = ({ message }) => {
  const { user: currentUser } = useAuth();
  const isSender = message.sender._id === currentUser?._id;

  return (
    <div
      className={cn(
        "flex items-end gap-2",
        isSender ? "justify-end" : "justify-start"
      )}
    >
      {!isSender && (
        <img
          src={
            message.sender.profile?.avatar ||
            `https://i.pravatar.cc/32?u=${message.sender._id}`
          }
          alt={message.sender.username}
          className="h-8 w-8 rounded-full"
        />
      )}
      <div
        className={cn(
          "max-w-xs md:max-w-md lg:max-w-lg rounded-2xl px-4 py-2",
          isSender
            ? "bg-blue-600 text-white rounded-br-none"
            : "bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200 rounded-bl-none"
        )}
      >
        <div className="prose prose-sm dark:prose-invert max-w-none text-white">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {message.content}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
};

export default Message;
