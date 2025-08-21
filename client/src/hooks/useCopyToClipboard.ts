import { useState } from "react";

export const useCopyToClipboard = () => {
  const [copied, setCopied] = useState(false);

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
      return true;
    } catch (error) {
      console.error("Failed to copy text:", error);
      return false;
    }
  };

  return { copied, copy };
};
