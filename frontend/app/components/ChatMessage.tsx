"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";

export interface MessageAttachment {
  id: string;
  type: "image" | "text" | "pdf";
  name: string;
  preview?: string; // base64 for images, content for text
  pageImages?: string[]; // For PDFs: array of base64 page images
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  attachments?: MessageAttachment[];
}

interface ChatMessageProps {
  message: Message;
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={`flex w-full ${isUser ? "justify-end" : "justify-start"} mb-4`}
    >
      <div
        className={`flex items-start gap-3 max-w-[95%] md:max-w-[95%] ${
          isUser ? "flex-row-reverse" : "flex-row"
        }`}
      >
        <div
          className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
            isUser
              ? "bg-blue-600 text-white"
              : "bg-gradient-to-br from-purple-500 to-pink-500 text-white"
          }`}
        >
          {isUser ? "U" : "AI"}
        </div>

        <div
          className={`rounded-2xl px-4 py-3 ${
            isUser
              ? "bg-blue-600 text-white rounded-br-md"
              : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-md"
          }`}
        >
          {/* Attachments */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {message.attachments.map((attachment) => (
                <div
                  key={attachment.id}
                  className="rounded-lg overflow-hidden bg-black/10 dark:bg-white/10"
                >
                  {attachment.type === "image" || attachment.type === "pdf" ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={attachment.preview}
                      alt={attachment.name}
                      className="max-h-48 max-w-full object-contain"
                    />
                  ) : (
                    <div className="flex items-center gap-2 px-3 py-2">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="w-5 h-5 opacity-70"
                      >
                        <path
                          fillRule="evenodd"
                          d="M5.625 1.5c-1.036 0-1.875.84-1.875 1.875v17.25c0 1.035.84 1.875 1.875 1.875h12.75c1.035 0 1.875-.84 1.875-1.875V12.75A3.75 3.75 0 0 0 16.5 9h-1.875a1.875 1.875 0 0 1-1.875-1.875V5.25A3.75 3.75 0 0 0 9 1.5H5.625ZM7.5 15a.75.75 0 0 1 .75-.75h7.5a.75.75 0 0 1 0 1.5h-7.5A.75.75 0 0 1 7.5 15Zm.75 2.25a.75.75 0 0 0 0 1.5H12a.75.75 0 0 0 0-1.5H8.25Z"
                          clipRule="evenodd"
                        />
                        <path d="M12.971 1.816A5.23 5.23 0 0 1 14.25 5.25v1.875c0 .207.168.375.375.375H16.5a5.23 5.23 0 0 1 3.434 1.279 9.768 9.768 0 0 0-6.963-6.963Z" />
                      </svg>
                      <span className="text-sm">{attachment.name}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Message content */}
          {message.content && (
            <div className={`text-sm md:text-base leading-relaxed prose prose-sm max-w-none ${
              isUser
                ? "prose-invert prose-p:text-white prose-strong:text-white prose-em:text-white prose-code:text-white prose-headings:text-white prose-a:text-blue-200"
                : "dark:prose-invert prose-p:text-gray-900 dark:prose-p:text-gray-100 prose-strong:text-gray-900 dark:prose-strong:text-gray-100 prose-code:bg-gray-200 dark:prose-code:bg-gray-700 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-pre:bg-gray-200 dark:prose-pre:bg-gray-700"
            }`}>
              <ReactMarkdown>
                {message.content}
              </ReactMarkdown>
            </div>
          )}

          <div className={`flex items-center gap-2 mt-2 ${isUser ? "justify-end" : "justify-start"}`}>
            {!isUser && message.content && (
              <div className="relative group">
                <button
                  onClick={handleCopy}
                  className="cursor-pointer text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  aria-label={copied ? "Copied" : "Copy message"}
                >
                  {copied ? (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-green-500">
                      <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                      <path d="M7 3.5A1.5 1.5 0 0 1 8.5 2h3.879a1.5 1.5 0 0 1 1.06.44l3.122 3.12A1.5 1.5 0 0 1 17 6.622V12.5a1.5 1.5 0 0 1-1.5 1.5h-1v-3.379a3 3 0 0 0-.879-2.121L10.5 5.379A3 3 0 0 0 8.379 4.5H7v-1Z" />
                      <path d="M4.5 6A1.5 1.5 0 0 0 3 7.5v9A1.5 1.5 0 0 0 4.5 18h7a1.5 1.5 0 0 0 1.5-1.5v-5.879a1.5 1.5 0 0 0-.44-1.06L9.44 6.439A1.5 1.5 0 0 0 8.378 6H4.5Z" />
                    </svg>
                  )}
                </button>
                <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 text-xs text-white bg-gray-800 dark:bg-gray-700 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                  {copied ? "Copied!" : "Copy"}
                </span>
              </div>
            )}
            <p
              className={`text-xs ${
                isUser
                  ? "text-blue-200"
                  : "text-gray-500 dark:text-gray-400"
              }`}
            >
              {message.timestamp.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
