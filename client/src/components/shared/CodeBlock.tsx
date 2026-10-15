import React, { useState, useCallback, useRef, useEffect } from "react";
import { PrismLight as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import bash from "react-syntax-highlighter/dist/esm/languages/prism/bash";
import c from "react-syntax-highlighter/dist/esm/languages/prism/c";
import cpp from "react-syntax-highlighter/dist/esm/languages/prism/cpp";
import csharp from "react-syntax-highlighter/dist/esm/languages/prism/csharp";
import css from "react-syntax-highlighter/dist/esm/languages/prism/css";
import java from "react-syntax-highlighter/dist/esm/languages/prism/java";
import javascript from "react-syntax-highlighter/dist/esm/languages/prism/javascript";
import jsx from "react-syntax-highlighter/dist/esm/languages/prism/jsx";
import json from "react-syntax-highlighter/dist/esm/languages/prism/json";
import markup from "react-syntax-highlighter/dist/esm/languages/prism/markup";
import python from "react-syntax-highlighter/dist/esm/languages/prism/python";
import sql from "react-syntax-highlighter/dist/esm/languages/prism/sql";
import tsx from "react-syntax-highlighter/dist/esm/languages/prism/tsx";
import typescript from "react-syntax-highlighter/dist/esm/languages/prism/typescript";

SyntaxHighlighter.registerLanguage("bash", bash);
SyntaxHighlighter.registerLanguage("c", c);
SyntaxHighlighter.registerLanguage("cpp", cpp);
SyntaxHighlighter.registerLanguage("csharp", csharp);
SyntaxHighlighter.registerLanguage("css", css);
SyntaxHighlighter.registerLanguage("java", java);
SyntaxHighlighter.registerLanguage("javascript", javascript);
SyntaxHighlighter.registerLanguage("jsx", jsx);
SyntaxHighlighter.registerLanguage("json", json);
SyntaxHighlighter.registerLanguage("markup", markup);
SyntaxHighlighter.registerLanguage("python", python);
SyntaxHighlighter.registerLanguage("sql", sql);
SyntaxHighlighter.registerLanguage("tsx", tsx);
SyntaxHighlighter.registerLanguage("typescript", typescript);
SyntaxHighlighter.registerLanguage("js", javascript);
SyntaxHighlighter.registerLanguage("ts", typescript);
SyntaxHighlighter.registerLanguage("shell", bash);
SyntaxHighlighter.registerLanguage("html", markup);

interface CodeBlockProps extends React.HTMLAttributes<HTMLElement> {
  children?: React.ReactNode;
  inline?: boolean;
  language?: string;
}

const CodeBlock: React.FC<CodeBlockProps> = ({
  children,
  className,
  inline,
  language,
}) => {
  const [showCopied, setShowCopied] = useState(false);
  const [copyCount, setCopyCount] = useState(0);
  const copyTimeoutRef = useRef<NodeJS.Timeout>();
  const resetTimeoutRef = useRef<NodeJS.Timeout>();

  const content = React.Children.toArray(children).join("");

  // Reset copy count after 5 seconds of inactivity
  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
      if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current);
    };
  }, []);

  const copyCode = useCallback(() => {
    navigator.clipboard.writeText(String(content).replace(/\n$/, ""));
    setShowCopied(true);
    setCopyCount((prev) => prev + 1);

    // Clear existing timeouts
    if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
    if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current);

    // Hide copied message after 2 seconds
    copyTimeoutRef.current = setTimeout(() => {
      setShowCopied(false);
    }, 2000);

    // Reset copy count after 2 seconds of inactivity
    resetTimeoutRef.current = setTimeout(() => {
      setCopyCount(0);
    }, 2000);
  }, [content]);

  const getCopyLevel = () => {
    const messages = [
      { text: "Copy!", color: "green" }, // 0
      { text: "Double Copy!", color: "green" }, // 1
      { text: "Triple Copy!", color: "green" }, // 2
      { text: "Dominating!", color: "green" }, // 3
      { text: "Rampage!", color: "green" }, // 4
      { text: "Mega Copy!", color: "orange" }, // 5
      { text: "Unstoppable!", color: "orange" }, // 6
      { text: "Wicked Sick!", color: "orange" }, // 7
      { text: "Monster Copy!", color: "orange" }, // 8
      { text: "Godlike!", color: "red" }, // 9
      { text: "Beyond Godlike!", color: "red" }, // 10+
    ];

    const index = Math.min(copyCount, messages.length - 1);
    return messages[index];
  };

  const getMessageStyle = (level: { color: string }) => {
    const baseStyle =
      "py-1 px-2 text-white text-xs rounded shadow-lg whitespace-nowrap";

    switch (level.color) {
      case "green":
        return `${baseStyle} bg-green-600`;
      case "orange":
        return `${baseStyle} bg-orange-500`;
      case "red":
        return `${baseStyle} bg-red-600`;
      default:
        return `${baseStyle} bg-green-600`;
    }
  };

  // If it's inline code (not wrapped in ```)
  if (!className || inline) {
    return (
      <code className="bg-[#1f2428] text-[#e6edf3] rounded px-1.5 py-0.5 text-[0.9em] font-mono">
        {content}
      </code>
    );
  }

  const codeLanguage = className
    ? className.replace("language-", "")
    : language || "text";

  return (
    <div className="relative group my-4">
      <button
        onClick={copyCode}
        className="absolute right-2 top-2 p-2 rounded-lg bg-[#30363d] opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10"
        title="Copy code"
      >
        <div className="relative">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-gray-300 hover:text-white"
          >
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
          {showCopied && (
            <div className="absolute bottom-full right-0 mb-2">
              <div className={getMessageStyle(getCopyLevel())}>
                {getCopyLevel().text}
                {copyCount >= 9 && (
                  <div className="absolute inset-0 -z-10 animate-pulse bg-red-500/30 rounded"></div>
                )}
              </div>
            </div>
          )}
        </div>
      </button>
      <SyntaxHighlighter
        language={codeLanguage}
        style={vscDarkPlus}
        customStyle={{
          margin: "0",
          padding: "16px",
          background: "none",
        }}
      >
        {String(content).replace(/\n$/, "")}
      </SyntaxHighlighter>
    </div>
  );
};

export default CodeBlock;
