import React, { useState } from "react";
import { Chat as ChatType } from "../types";
import ConversationList from "@/components/chat/ConversationList";
import MessageContainer from "@/components/chat/MessageContainer"; // Import the real component

/**
 * The main Chat page component.
 */
const Chat: React.FC = () => {
  const [selectedChat, setSelectedChat] = useState<ChatType | null>(null);

  return (
    <div className="h-[calc(100vh-5rem)] flex border-t dark:border-gray-800">
      <ConversationList
        selectedChat={selectedChat}
        onSelectChat={setSelectedChat}
      />
      <MessageContainer selectedChat={selectedChat} />
    </div>
  );
};

export default Chat;
