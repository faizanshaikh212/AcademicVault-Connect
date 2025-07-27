import React, { useState } from "react";
import { Button } from "../ui/Button";
import { Send } from "lucide-react";
import { Input } from "../ui/Input";

interface MessageInputProps {
  onSendMessage: (content: string) => void;
  isLoading: boolean;
}

const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  isLoading,
}) => {
  const [content, setContent] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (content.trim()) {
      onSendMessage(content);
      setContent("");
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="p-4 border-t bg-white dark:bg-gray-900 dark:border-gray-800"
    >
      <div className="flex items-center gap-2">
        <Input
          type="text"
          placeholder="Type a message..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="flex-1"
          disabled={isLoading}
        />
        <Button
          type="submit"
          size="icon"
          disabled={isLoading || !content.trim()}
        >
          <Send className="h-5 w-5" />
        </Button>
      </div>
    </form>
  );
};

export default MessageInput;
